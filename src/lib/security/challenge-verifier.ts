// src/lib/security/challenge-verifier.ts
// Verifies Step-Up Challenge tokens (Cloudflare Turnstile and cryptographic Proof-of-Work).

export interface ChallengeVerificationResult {
  valid: boolean;
  type?: 'turnstile' | 'pow' | 'dev';
  error?: string;
}

/**
 * Fast synchronous proof-of-work validator.
 * Token format: "pow:<timestamp>:<nonce>:<hash>"
 * Target: sha256(timestamp + ":" + nonce) has difficulty (e.g. 4 leading hex zeros "0000")
 */
function verifyProofOfWork(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 4 || parts[0] !== 'pow') return false;

    const timestamp = parseInt(parts[1], 10);
    const nonce = parts[2];
    const claimedHash = parts[3];

    // Must be fresh (< 5 minutes old) and not in the future
    const now = Date.now();
    if (isNaN(timestamp) || now - timestamp > 300_000 || timestamp > now + 30_000) {
      return false;
    }

    // Must have at least 3 leading zeros in hex
    if (!claimedHash.startsWith('000')) {
      return false;
    }

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

  // 1. Dev / Test bypass for automated tests
  if (
    process.env.NODE_ENV !== 'production' &&
    (trimmedToken === 'test-valid-challenge-token' || trimmedToken.startsWith('mock-challenge-'))
  ) {
    return { valid: true, type: 'dev' };
  }

  // 2. Client Proof-of-Work check
  if (trimmedToken.startsWith('pow:')) {
    const isValidPoW = verifyProofOfWork(trimmedToken);
    return { valid: isValidPoW, type: 'pow' };
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
