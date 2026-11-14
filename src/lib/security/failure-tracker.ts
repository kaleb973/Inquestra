// src/lib/security/failure-tracker.ts
// Ultra-fast, bounded in-memory sliding-window tracker for failed logins.
// Designed with a swappable interface for distributed stores (e.g. Redis / Upstash KV).
// Prevents account lockouts while neutralizing distributed credential stuffing.

export interface FailureStats {
  ipFailures: number;
  fingerprintFailures: number;
  emailFailures: number;
  maxClientFailures: number;
  isEmailTargeted: boolean;
}

export interface IFailureTracker {
  recordFailedAttempt(ip: string, fingerprintId: string, email?: string): void;
  clearFailedAttempts(ip: string, fingerprintId: string, email?: string): void;
  getFailureStats(ip: string, fingerprintId: string, email?: string): FailureStats;
  reset(): void;
}

const CLIENT_WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window for IP / Fingerprint
const TARGETED_EMAIL_WINDOW_MS = 10 * 60 * 1000; // 10-minute sliding window for email attacks
const TARGETED_EMAIL_THRESHOLD = 5; // >5 failures marks email as targeted
const MAX_MAP_ENTRIES = 50_000; // Hard memory cap to prevent DoS on memory

/**
 * Normalizes an IPv4 or IPv6 address to its subnet to handle micro-rotating proxy pools.
 * IPv4 -> /24 (e.g., 203.0.113.45 -> 203.0.113.0/24)
 * IPv6 -> /48 (e.g., 2001:db8:85a3:: -> 2001:db8:85a3::/48)
 */
export function normalizeIpSubnet(ip: string): string {
  const cleanIp = ip.trim();
  if (cleanIp.includes(':')) {
    // IPv6: Keep first 3 segments (/48)
    const segments = cleanIp.split(':');
    return segments.slice(0, 3).join(':') + '::/48';
  }
  // IPv4: Keep first 3 octets (/24)
  const octets = cleanIp.split('.');
  if (octets.length === 4) {
    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
  }
  return cleanIp;
}

/**
 * Generates a normalized lookup key for email targeting.
 */
function normalizeEmail(email?: string): string {
  return email ? email.toLowerCase().trim() : '';
}

/**
 * In-memory sliding-window tracker using timestamp arrays.
 */
class InMemoryFailureTracker implements IFailureTracker {
  private failures = new Map<string, number[]>();
  private lastPrune = Date.now();

  /**
   * Prunes expired timestamps for a given key, or clears the key if empty.
   */
  private pruneKey(key: string, now: number, windowMs: number): number[] {
    const list = this.failures.get(key);
    if (!list) return [];

    const cutoff = now - windowMs;
    // Find index of first item >= cutoff
    const valid = list.filter((ts) => ts >= cutoff);
    if (valid.length === 0) {
      this.failures.delete(key);
      return [];
    }
    this.failures.set(key, valid);
    return valid;
  }

  /**
   * Global periodic memory pruning.
   */
  private periodicPrune(now: number): void {
    if (now - this.lastPrune < 60_000 && this.failures.size < MAX_MAP_ENTRIES) {
      return;
    }
    this.lastPrune = now;

    for (const [key, list] of this.failures.entries()) {
      const windowMs = key.startsWith('email:') ? TARGETED_EMAIL_WINDOW_MS : CLIENT_WINDOW_MS;
      const cutoff = now - windowMs;
      const valid = list.filter((ts) => ts >= cutoff);
      if (valid.length === 0) {
        this.failures.delete(key);
      } else {
        this.failures.set(key, valid);
      }
    }

    // If still oversized after pruning, evict oldest 20%
    if (this.failures.size >= MAX_MAP_ENTRIES) {
      const keysToDelete = Array.from(this.failures.keys()).slice(0, Math.floor(MAX_MAP_ENTRIES * 0.2));
      for (const k of keysToDelete) {
        this.failures.delete(k);
      }
    }
  }

  recordFailedAttempt(ip: string, fingerprintId: string, email?: string): void {
    const now = Date.now();
    this.periodicPrune(now);

    const subnet = normalizeIpSubnet(ip);
    const ipKey = `ip:${subnet}`;
    const fpKey = `fp:${fingerprintId}`;

    // 1. Record for IP subnet
    const ipList = this.pruneKey(ipKey, now, CLIENT_WINDOW_MS);
    ipList.push(now);
    this.failures.set(ipKey, ipList);

    // 2. Record for Fingerprint
    if (fingerprintId) {
      const fpList = this.pruneKey(fpKey, now, CLIENT_WINDOW_MS);
      fpList.push(now);
      this.failures.set(fpKey, fpList);
    }

    // 3. Record for Email
    const normEmail = normalizeEmail(email);
    if (normEmail) {
      const emailKey = `email:${normEmail}`;
      const emailList = this.pruneKey(emailKey, now, TARGETED_EMAIL_WINDOW_MS);
      emailList.push(now);
      this.failures.set(emailKey, emailList);
    }
  }

  clearFailedAttempts(ip: string, fingerprintId: string, email?: string): void {
    const subnet = normalizeIpSubnet(ip);
    this.failures.delete(`ip:${subnet}`);
    if (fingerprintId) {
      this.failures.delete(`fp:${fingerprintId}`);
    }
    const normEmail = normalizeEmail(email);
    if (normEmail) {
      this.failures.delete(`email:${normEmail}`);
    }
  }

  getFailureStats(ip: string, fingerprintId: string, email?: string): FailureStats {
    const now = Date.now();
    const subnet = normalizeIpSubnet(ip);

    const ipList = this.pruneKey(`ip:${subnet}`, now, CLIENT_WINDOW_MS);
    const fpList = fingerprintId
      ? this.pruneKey(`fp:${fingerprintId}`, now, CLIENT_WINDOW_MS)
      : [];

    const normEmail = normalizeEmail(email);
    const emailList = normEmail
      ? this.pruneKey(`email:${normEmail}`, now, TARGETED_EMAIL_WINDOW_MS)
      : [];

    const ipFailures = ipList.length;
    const fingerprintFailures = fpList.length;
    const emailFailures = emailList.length;
    const maxClientFailures = Math.max(ipFailures, fingerprintFailures);

    // If an email has >5 failed attempts globally within 10 minutes, it is targeted
    const isEmailTargeted = emailFailures > TARGETED_EMAIL_THRESHOLD;

    return {
      ipFailures,
      fingerprintFailures,
      emailFailures,
      maxClientFailures,
      isEmailTargeted,
    };
  }

  reset(): void {
    this.failures.clear();
    this.lastPrune = Date.now();
  }
}

// Global singleton instance
const failureTracker = new InMemoryFailureTracker();

export function recordFailedAttempt(ip: string, fingerprintId: string, email?: string): void {
  failureTracker.recordFailedAttempt(ip, fingerprintId, email);
}

export function clearFailedAttempts(ip: string, fingerprintId: string, email?: string): void {
  failureTracker.clearFailedAttempts(ip, fingerprintId, email);
}

export function getFailureStats(ip: string, fingerprintId: string, email?: string): FailureStats {
  return failureTracker.getFailureStats(ip, fingerprintId, email);
}

export function resetFailureTracker(): void {
  failureTracker.reset();
}
