// src/lib/security/risk-engine.ts
// Composite Pre-Auth Risk Scoring Engine for Inquestra.
// Evaluates incoming login requests in <0.2ms and assigns deterministic risk scores (0-100).

import type { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/rateLimit';
import { verifyDeviceTrustCookie } from './device-trust';
import { evaluateClientIntegrity } from './tls-fingerprint';
import { getFailureStats } from './failure-tracker';

export type RiskTier = 'ALLOW' | 'CHALLENGE' | 'DROP';

export interface LoginRiskEvaluation {
  score: number;
  tier: RiskTier;
  fingerprintId: string;
  reasons: string[];
  isDeviceTrusted: boolean;
  isEmailTargeted: boolean;
}

/**
 * Extracts the real client IP address using the shared trusted-header validator.
 */
export function extractClientIp(req: NextRequest): string {
  return getClientIp(req.headers);
}

/**
 * Evaluates login risk score (0 to 100) before reading the request body password.
 * @param req Incoming NextRequest
 * @param email Optional target email (if parsed from initial envelope)
 */
export async function evaluateLoginRisk(
  req: NextRequest,
  email?: string
): Promise<LoginRiskEvaluation> {
  const reasons: string[] = [];
  let score = 0;

  // 1. Device Trust Signal
  const isDeviceTrusted = await verifyDeviceTrustCookie(req);
  if (!isDeviceTrusted) {
    score += 25;
    reasons.push('Untrusted / new device (no valid trust cookie)');
  }

  // 2. Client & TLS Integrity Signal
  const integrity = evaluateClientIntegrity(req);
  const fingerprintId = integrity.fingerprintId;

  if (integrity.scorePenalty > 0) {
    score += integrity.scorePenalty;
    reasons.push(...integrity.reason);
  }

  // 3. Failure Velocity Signal (15-minute sliding window)
  const clientIp = extractClientIp(req);
  const stats = getFailureStats(clientIp, fingerprintId, email);

  const failureCount = stats.maxClientFailures;
  if (failureCount > 10) {
    score += 50;
    reasons.push(`High failure velocity (>10 recent failures: ${failureCount})`);
  } else if (failureCount >= 4) {
    score += 30;
    reasons.push(`Moderate failure velocity (4-10 failures: ${failureCount})`);
  } else if (failureCount >= 1) {
    score += 15;
    reasons.push(`Low failure velocity (1-3 failures: ${failureCount})`);
  }

  // 4. Targeted Account Protection (Crucial Rule)
  // If target email has >5 failed attempts globally within 10 minutes:
  // - For UNTRUSTED devices: enforce at least MEDIUM RISK (>= 30) for challenge step-up
  // - For TRUSTED devices: allow pass-through without elevation!
  if (stats.isEmailTargeted) {
    if (!isDeviceTrusted) {
      if (score < 30) {
        score = 30;
      }
      reasons.push('Account under active attack: untrusted device challenged to protect researcher');
    } else {
      reasons.push('Account under active attack, but device is trusted: pass-through permitted');
    }
  }

  // Clamp score strictly between 0 and 100
  const clampedScore = Math.min(100, Math.max(0, score));

  // Determine Tier:
  // LOW RISK (< 30) -> ALLOW
  // MEDIUM RISK (30 <= score < 75) -> CHALLENGE
  // HIGH RISK (score >= 75) -> DROP
  let tier: RiskTier = 'ALLOW';
  if (clampedScore >= 75) {
    tier = 'DROP';
  } else if (clampedScore >= 30) {
    tier = 'CHALLENGE';
  }

  return {
    score: clampedScore,
    tier,
    fingerprintId,
    reasons,
    isDeviceTrusted,
    isEmailTargeted: stats.isEmailTargeted,
  };
}
