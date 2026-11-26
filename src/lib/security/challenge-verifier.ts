// src/lib/security/challenge-verifier.ts
// Verifies Step-Up Challenge tokens (Cloudflare Turnstile and cryptographic Proof-of-Work).

export interface ChallengeVerificationResult {
  valid: boolean;
  type?: 'turnstile' | 'pow' | 'dev';
  error?: string;
}

/**
 * Cryptographic proof-of-work validator (Edge + Node Web Crypto compatible).
 * Token format: "pow:<timestamp>:<nonce>:<hash>"
 * Target: sha256(timestamp + ":" + nonce) has difficulty ("000" prefix in lowercase hex)
 * and has not been replayed within the validity window.
 */
const POW_MAX_AGE_MS = 300_000;
const POW_MAX_FUTURE_SKEW_MS = 30_000;
const MAX_USED_POW_ENTRIES = 10_000;
const usedPowTokens = new Map<string, number>();

function pruneUsedPowTokens(now: number) {
  for (const [tokenHash, expiresAt] of usedPowTokens.entries()) {
    if (expiresAt <= now) {
      usedPowTokens.delete(tokenHash);
    }
  }
  while (usedPowTokens.size >= MAX_USED_POW_ENTRIES) {
    const oldestKey = usedPowTokens.keys().next().value;
    if (!oldestKey) break;
    usedPowTokens.delete(oldestKey);
  }
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function computeSha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyProofOfWork(token: string): Promise<boolean> {
  try {
    const parts = token.split(':');
    if (parts.length !== 4 || parts[0] !== 'pow') return false;

    const timestampStr = parts[1];
    const nonce = parts[2];
    const claimedHash = parts[3].toLowerCase();

    if (!/^\d{10,16}$/.test(timestampStr) || !/^\d{1,10}$/.test(nonce)) {
      return false;
    }
    if (!/^[0-9a-f]{64}$/.test(claimedHash)) {
      return false;
    }

    const timestamp = Number.parseInt(timestampStr, 10);
    const now = Date.now();
    if (!Number.isFinite(timestamp) || now - timestamp > POW_MAX_AGE_MS || timestamp > now + POW_MAX_FUTURE_SKEW_MS) {
      return false;
    }

    if (!claimedHash.startsWith('000')) {
      return false;
    }

    const actualHash = await computeSha256Hex(`${timestampStr}:${nonce}`);
    if (!constantTimeEqualHex(actualHash, claimedHash) || !actualHash.startsWith('000')) {
      return false;
    }

    pruneUsedPowTokens(now);
    const replayKey = `${timestampStr}:${nonce}:${actualHash}`;
    const existingExpiry = usedPowTokens.get(replayKey);
    if (existingExpiry && existingExpiry > now) {
      return false;
    }
    usedPowTokens.set(replayKey, timestamp + POW_MAX_AGE_MS);

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies Cloudflare Turnstile token or Proof-of-Work challenge.
 */
export async function verifyChallengeToken(
  token: string | null | undefined,
  clientIp?: string
): Promise<ChallengeVerificationResult> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { valid: false, error: 'Challenge token is missing' };
  }

  const trimmedToken = token.trim();

  // 1. Dev / Test bypass for automated tests (never enabled in production)
  if (
    process.env.NODE_ENV !== 'production' &&
    (trimmedToken === 'test-valid-challenge-token' || trimmedToken.startsWith('mock-challenge-'))
  ) {
    return { valid: true, type: 'dev' };
  }

  // 2. Client Proof-of-Work check
  if (trimmedToken.startsWith('pow:')) {
    const isValidPoW = await verifyProofOfWork(trimmedToken);
    return {
      valid: isValidPoW,
      type: 'pow',
      error: isValidPoW ? undefined : 'Invalid or expired proof-of-work challenge',
    };
  }

  // 3. Cloudflare Turnstile Verification
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    // If no secret key is configured in dev/staging, fallback to PoW or dev token check
    if (process.env.NODE_ENV !== 'production') {
      return { valid: true, type: 'dev' };
    }
    return { valid: false, error: 'Turnstile secret key is not configured' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', trimmedToken);
    if (clientIp) {
      formData.append('remoteip', clientIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!res.ok) {
      return { valid: false, error: `Turnstile verification failed with HTTP ${res.status}` };
    }

    const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
    return {
      valid: data.success === true,
      type: 'turnstile',
      error: data.success ? undefined : data['error-codes']?.join(', ') || 'Invalid Turnstile token',
    };
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Turnstile network verification failed',
    };
  }
}
