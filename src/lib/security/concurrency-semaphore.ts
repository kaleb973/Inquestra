// src/lib/security/concurrency-semaphore.ts
// In-process Concurrency Limiter around bcrypt password verification.
// Prevents CPU saturation (100% core usage) and event-loop starvation
// under concurrent bursts of credential evaluations.

export class ConcurrencyLimitExceededError extends Error {
  constructor(message = 'Server is currently processing peak authentication load. Please retry in a few seconds.') {
    super(message);
    this.name = 'ConcurrencyLimitExceededError';
  }
}

export interface SemaphoreConfig {
  maxConcurrency?: number;
  maxQueueLength?: number;
  queueTimeoutMs?: number;
}

export class ConcurrencySemaphore {
  private activeCount = 0;
  private queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  private readonly maxConcurrency: number;
  private readonly maxQueueLength: number;
  private readonly queueTimeoutMs: number;

  constructor(config: SemaphoreConfig = {}) {
    this.maxConcurrency = config.maxConcurrency ?? 15;
    this.maxQueueLength = config.maxQueueLength ?? 50;
    this.queueTimeoutMs = config.queueTimeoutMs ?? 5000;
  }

  get stats() {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency,
      maxQueueLength: this.maxQueueLength,
    };
  }

  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrency) {
      this.activeCount++;
      return;
    }

    if (this.queue.length >= this.maxQueueLength) {
      throw new ConcurrencyLimitExceededError();
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const index = this.queue.findIndex((item) => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new ConcurrencyLimitExceededError('Authentication request queued too long.'));
      }, this.queueTimeoutMs);

      this.queue.push({ resolve, reject, timer });
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        clearTimeout(next.timer);
        next.resolve();
      }
    } else {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  reset(): void {
    for (const item of this.queue) {
      clearTimeout(item.timer);
      item.reject(new ConcurrencyLimitExceededError('Semaphore reset'));
    }
    this.queue = [];
    this.activeCount = 0;
  }
}

// Global singleton for Bcrypt operations (max 15 concurrent checks per Node instance)
export const bcryptSemaphore = new ConcurrencySemaphore({
  maxConcurrency: 15,
  maxQueueLength: 50,
  queueTimeoutMs: 5000,
});

export async function executeWithBcryptLimit<T>(fn: () => Promise<T>): Promise<T> {
  return bcryptSemaphore.run(fn);
}
