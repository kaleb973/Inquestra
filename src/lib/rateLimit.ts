// src/lib/rateLimit.ts
// High-performance sliding-window in-memory rate limiter for Next.js Edge / Node runtimes.
// Defends against brute force authentication, denial-of-service, and bot abuse.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory bucket store
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return; // run at most once per 5 minutes
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in ms when the window resets
  retryAfterSeconds?: number;
}

/**
 * Check if an identifier has exceeded the allowed limit in a given time window.
 * 
 * @param identifier Unique key (e.g., client IP or User ID + route)
 * @param limit Maximum requests permitted in window
 * @param windowMs Duration of rate window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const existing = rateLimitMap.get(identifier);

  // If no record or current record expired, start a fresh window
  if (!existing || existing.resetAt <= now) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(identifier, record);

    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: record.resetAt,
    };
  }

  // Window still active
  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existing.resetAt,
      retryAfterSeconds,
    };
  }

  // Increment counter
  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: existing.resetAt,
  };
}

/**
 * Extracts the real client IP address from Next.js request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return '127.0.0.1';
}
