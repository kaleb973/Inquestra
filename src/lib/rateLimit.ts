// src/lib/rateLimit.ts
// High-performance sliding-window in-memory rate limiter for Next.js Edge / Node runtimes.
// Defends against brute force authentication, denial-of-service, and bot abuse.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory bucket store (bounded to avoid unbounded cardinality DoS)
const MAX_RATE_LIMIT_ENTRIES = 20_000;
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupStaleEntries(now: number) {
  if (now - lastCleanup >= 300_000 || rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    lastCleanup = now;
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }

  while (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (!oldestKey) break;
    rateLimitMap.delete(oldestKey);
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
  const now = Date.now();
  cleanupStaleEntries(now);

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

const VALID_IP_CANDIDATE = /^[0-9a-fA-F:.]{3,45}$/;

function normalizeValidIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let candidate = raw.trim();
  // Strip IPv6 zone IDs or IPv4 :port suffixes if present
  if (candidate.startsWith('[')) {
    const endIdx = candidate.indexOf(']');
    if (endIdx > 1) candidate = candidate.slice(1, endIdx);
  } else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.split(':')[0];
  }
  if (!VALID_IP_CANDIDATE.test(candidate)) return null;
  return candidate.toLowerCase();
}

/**
 * Extracts the client IP address from trusted proxy headers with input validation.
 * Prefers single-value platform headers (Cloudflare / Vercel / Nginx x-real-ip) before
 * taking the rightmost proxy-appended hop from x-forwarded-for.
 */
export function getClientIp(headers: Headers): string {
  const cfIp = normalizeValidIp(headers.get('cf-connecting-ip'));
  if (cfIp) return cfIp;

  const vercelFwd = headers.get('x-vercel-forwarded-for');
  if (vercelFwd) {
    const parts = vercelFwd.split(',');
    const ip = normalizeValidIp(parts[0]);
    if (ip) return ip;
  }

  const realIp = normalizeValidIp(headers.get('x-real-ip'));
  if (realIp) return realIp;

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => normalizeValidIp(p)).filter((p): p is string => p !== null);
    if (parts.length > 0) {
      // Rightmost hop is appended by the immediate trusted reverse proxy
      return parts[parts.length - 1];
    }
  }

  return '127.0.0.1';
}
