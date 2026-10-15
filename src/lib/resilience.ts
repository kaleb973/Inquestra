// src/lib/resilience.ts
// Enterprise Resilience Primitives for Inquestra BME Platform.
// Implements Timeouts (via AbortSignal), Retries with Exponential Backoff and Full Jitter,
// and transient error classifiers to protect outbound RPC, MCP, LIMS, and external webhooks.

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  retries?: number;
  /** Initial delay in ms before first retry (default: 500ms) */
  minTimeoutMs?: number;
  /** Cap on maximum delay in ms (default: 5000ms) */
  maxTimeoutMs?: number;
  /** Optional custom predicate determining if error is retryable */
  retryIf?: (error: unknown) => boolean;
  /** Optional callback fired on each retry attempt */
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

/**
 * Computes an exponential backoff delay with full jitter.
 * Formula: delay = random(0, min(maxTimeout, minTimeout * 2^attempt))
 * Eliminates synchronized thundering herds across distributed nodes.
 */
export function calculateBackoffWithJitter(
  attempt: number,
  minTimeoutMs = 500,
  maxTimeoutMs = 5000
): number {
  const exponential = Math.min(maxTimeoutMs, minTimeoutMs * Math.pow(2, attempt));
  // Full jitter: random number between 0 and exponential upper bound
  return Math.floor(Math.random() * exponential);
}

/**
 * Wraps an async function with exponential backoff retries.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeoutMs = 500,
    maxTimeoutMs = 5000,
    retryIf,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;

      // If we exhausted retries or error is deemed non-retryable, abort immediately
      if (attempt >= retries || (retryIf && !retryIf(err))) {
        throw err;
      }

      const delayMs = calculateBackoffWithJitter(attempt, minTimeoutMs, maxTimeoutMs);
      if (onRetry) {
        onRetry(err, attempt + 1, delayMs);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Fetch wrapper that enforces a deadline timeout using AbortController.
 * Defaults to 10,000ms (10 seconds) timeout.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 10_000;
  const controller = new AbortController();

  let isTimedOut = false;
  const timer = setTimeout(() => {
    isTimedOut = true;
    controller.abort();
  }, timeoutMs);

  // If user provided their own signal, wire up chained abort
  if (init?.signal) {
    init.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (isTimedOut) {
      throw new TimeoutError(`Request to ${input.toString()} timed out after ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
