// src/lib/security/device-trust.ts
// Stateless HMAC-SHA256 device trust token generator and verifier using Web Crypto API.
// Edge-compatible, sub-millisecond execution with zero database roundtrips.

import type { NextRequest } from 'next/server';

export const DEVICE_TRUST_COOKIE_NAME = '__Host-inquestra_device_trust';
export const DEV_FALLBACK_COOKIE_NAME = 'inquestra_device_trust';
const DEFAULT_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export interface DeviceTrustPayload {
  deviceId: string;
  issuedAt: number;
  uaHash: string;
}

/**
 * Derives a CryptoKey for HMAC-SHA256 from the configured secret.
 */
async function getHmacKey(): Promise<CryptoKey> {
  const secret =
    process.env.DEVICE_TRUST_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('DEVICE_TRUST_SECRET must be configured in production.');
  }

  const activeSecret = secret || 'inquestra-device-trust-secret-key-min-32-bytes!';
  const encoder = new TextEncoder();
  const keyData = encoder.encode(activeSecret);

  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generates a SHA-256 hex/base64url digest of a string using Web Crypto.
 */
export async function hashString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Base64URL encode a UTF-8 string or Uint8Array.
 */
function toBase64Url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode to Uint8Array.
 */
function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates an HMAC-signed device trust cookie value.
 * @param ua The client User-Agent string.
 * @returns Serialized token in format: `${base64Payload}.${base64Signature}`
 */
export async function createDeviceTrustCookie(ua: string): Promise<string> {
  const deviceId = crypto.randomUUID();
  const issuedAt = Date.now();
  const uaHash = await hashString(ua || 'unknown');

  const payload: DeviceTrustPayload = {
    deviceId,
    issuedAt,
    uaHash,
  };

  const payloadJson = JSON.stringify(payload);
  const encodedPayload = toBase64Url(payloadJson);

  const key = await getHmacKey();
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload)
  );

  const encodedSignature = toBase64Url(new Uint8Array(signatureBuffer));
  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies the validity and integrity of the device trust cookie on an incoming request.
 * Checks HMAC signature, expiration timestamp, and User-Agent binding.
 */
export async function verifyDeviceTrustCookie(req: NextRequest): Promise<boolean> {
  // Check primary __Host- cookie first, then fallback for dev
  const cookieVal =
    req.cookies.get(DEVICE_TRUST_COOKIE_NAME)?.value ||
    req.cookies.get(DEV_FALLBACK_COOKIE_NAME)?.value;

  if (!cookieVal) {
    return false;
  }

  const parts = cookieVal.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [encodedPayload, encodedSignature] = parts;
  if (!encodedPayload || !encodedSignature) {
    return false;
  }

  try {
    // 1. Verify HMAC signature
    const key = await getHmacKey();
    const encoder = new TextEncoder();
    const signatureBytes = fromBase64Url(encodedSignature);

    const isValidSig = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(encodedPayload)
    );

    if (!isValidSig) {
      return false;
    }

    // 2. Parse and validate payload
    const decodedPayloadStr = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const payload: DeviceTrustPayload = JSON.parse(decodedPayloadStr);

    if (!payload.deviceId || typeof payload.issuedAt !== 'number' || !payload.uaHash) {
      return false;
    }

    // 3. Expiration check
    const now = Date.now();
    if (now - payload.issuedAt > DEFAULT_TTL_MS || payload.issuedAt > now + 60_000) {
      return false;
    }

    // 4. User-Agent binding check
    const currentUa = req.headers.get('user-agent') || 'unknown';
    const currentUaHash = await hashString(currentUa);
    if (payload.uaHash !== currentUaHash) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Cookie options helper for __Host-inquestra_device_trust
 */
export function getDeviceTrustCookieConfig(isProduction = process.env.NODE_ENV === 'production') {
  return {
    name: isProduction ? DEVICE_TRUST_COOKIE_NAME : DEV_FALLBACK_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: Math.floor(DEFAULT_TTL_MS / 1000),
    },
  };
}
