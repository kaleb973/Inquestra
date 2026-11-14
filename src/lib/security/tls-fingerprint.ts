// src/lib/security/tls-fingerprint.ts
// Evaluates client integrity, bot heuristics, and extracts composite fingerprints.
// Operates in ~0.05ms synchronously without external network calls.

import type { NextRequest } from 'next/server';

export interface ClientIntegrityResult {
  scorePenalty: number;
  reason: string[];
  fingerprintId: string;
  isScript: boolean;
  isHeadless: boolean;
}

// Known bot and scripting User-Agent tokens
const SCRIPT_BOT_REGEX =
  /(python-requests|aiohttp|httpx|curl\/|wget\/|go-http-client|node-fetch|axios\/|httpie|scrapy|postmanruntime|insomnia|headlesschrome|phantomjs|selenium|puppeteer|playwright|urllib|libwww-perl|java\/)/i;

/**
 * Fast synchronous 64-bit FNV-1a hash to produce consistent fingerprint IDs
 * without requiring asynchronous Web Crypto calls in synchronous evaluation paths.
 */
function fnv1a64(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x84222325;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch >> 8), 0x01000193);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `fp_${p1}${p2}`;
}

/**
 * Extracts and normalizes client headers and TLS signals to score client integrity.
 */
export function evaluateClientIntegrity(req: NextRequest): ClientIntegrityResult {
  const reasons: string[] = [];
  let scorePenalty = 0;

  const ua = req.headers.get('user-agent') || '';
  const accept = req.headers.get('accept') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';

  // Cloudflare TLS & Security headers
  const cfJa3 = req.headers.get('cf-ja3-hash') || '';
  const cfJa4 = req.headers.get('cf-ja4') || '';
  const cfBotScoreStr = req.headers.get('cf-bot-score');
  const cfBotScore = cfBotScoreStr ? parseInt(cfBotScoreStr, 10) : null;

  // Browser Client Hints & Fetch metadata
  const secChUa = req.headers.get('sec-ch-ua') || '';
  const secChUaMobile = req.headers.get('sec-ch-ua-mobile') || '';
  const secChUaPlatform = req.headers.get('sec-ch-ua-platform') || '';
  const secFetchSite = req.headers.get('sec-fetch-site') || '';
  const secFetchMode = req.headers.get('sec-fetch-mode') || '';
  const secFetchDest = req.headers.get('sec-fetch-dest') || '';

  let isScript = false;
  let isHeadless = false;

  // 1. Script-like or Automation Signature Detection
  if (!ua || ua.trim() === '') {
    scorePenalty += 55;
    reasons.push('Missing User-Agent header');
    isScript = true;
  } else if (SCRIPT_BOT_REGEX.test(ua)) {
    scorePenalty += 55;
    reasons.push(`Script-like automation tool or headless signature detected: ${ua.slice(0, 40)}`);
    isScript = true;
    if (/headless|phantom|selenium|puppeteer|playwright/i.test(ua)) {
      isHeadless = true;
    }
  }

  // 2. Cloudflare Bot Score / Threat Level (if deployed behind Cloudflare)
  if (cfBotScore !== null && !isNaN(cfBotScore)) {
    // Cloudflare bot score < 30 strongly indicates automated traffic
    if (cfBotScore < 30) {
      scorePenalty = Math.max(scorePenalty, 55);
      reasons.push(`Cloudflare bot score indicates automated botnet (score: ${cfBotScore})`);
      isScript = true;
    }
  }

  // 3. Browser Client Hint & Header Consistency Checks
  const isClaimedModernBrowser =
    /mozilla\/5\.0/i.test(ua) && /(chrome|safari|firefox|edg|opera)/i.test(ua);
  const isClaimedChromium = /chrome|edg|crios/i.test(ua) && !/firefox/i.test(ua);
  const isClaimedSafari = /safari/i.test(ua) && !/chrome|chromium|edg|crios|android/i.test(ua);

  if (isClaimedModernBrowser && !isScript) {
    // Chromium-based browsers (Chrome, Edge, Brave, Opera) always send sec-ch-ua in modern versions
    if (isClaimedChromium && !secChUa) {
      scorePenalty = Math.max(scorePenalty, 30);
      reasons.push('Claimed Chromium desktop/mobile UA missing sec-ch-ua client hints');
    }

    // Modern browsers always provide Accept-Language and Sec-Fetch-* on interactive fetch/navigation
    if (!acceptLanguage) {
      scorePenalty = Math.max(scorePenalty, 30);
      reasons.push('Claimed browser UA missing Accept-Language header');
    }

    // Anomaly: Safari on macOS/iOS does NOT send sec-ch-ua. If sec-ch-ua is present on pure Safari, it's spoofed.
    if (isClaimedSafari && secChUa) {
      scorePenalty = Math.max(scorePenalty, 30);
      reasons.push('Safari UA spoofing detected (sec-ch-ua provided on Safari)');
    }
  }

  // 4. Generate composite fingerprintId from invariant headers
  // Strips rotating IP, keeping client structure constant across residential proxies
  const fingerprintComponents = [
    ua.trim(),
    acceptEncoding.toLowerCase().trim(),
    acceptLanguage.split(',')[0]?.toLowerCase().trim() || '',
    secChUa.trim(),
    secChUaPlatform.trim(),
    secFetchMode.trim(),
    cfJa3.trim() || cfJa4.trim(),
  ].join('|');

  const fingerprintId = fnv1a64(fingerprintComponents);

  return {
    scorePenalty,
    reason: reasons,
    fingerprintId,
    isScript,
    isHeadless,
  };
}
