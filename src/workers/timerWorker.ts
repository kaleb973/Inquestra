// src/workers/timerWorker.ts
// Phase 4 — Web Worker protocol timer.
// Runs in an isolated thread so browser tab throttling (1/min background limit)
// cannot drift laboratory incubation countdowns or protocol timers.

interface TimerMessage {
  command: 'START' | 'PAUSE' | 'RESET';
  durationSeconds: number;
}

interface TickMessage {
  type: 'TICK';
  remaining: number;
  elapsed: number;
}

interface ExpiredMessage {
  type: 'EXPIRED';
}

type WorkerOutMessage = TickMessage | ExpiredMessage;

let intervalId: ReturnType<typeof setInterval> | null = null;
let remaining = 0;
let elapsed = 0;

self.onmessage = (e: MessageEvent<TimerMessage>) => {
  const { command, durationSeconds } = e.data;

  if (command === 'START') {
    remaining = durationSeconds;
    elapsed = 0;

    if (intervalId !== null) clearInterval(intervalId);

    intervalId = setInterval(() => {
      remaining -= 1;
      elapsed += 1;

      const tick: TickMessage = { type: 'TICK', remaining, elapsed };
      self.postMessage(tick);

      if (remaining <= 0) {
        if (intervalId !== null) clearInterval(intervalId);
        intervalId = null;
        const expired: ExpiredMessage = { type: 'EXPIRED' };
        self.postMessage(expired);
      }
    }, 1000);
  } else if (command === 'PAUSE') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  } else if (command === 'RESET') {
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = null;
    remaining = 0;
    elapsed = 0;
    const tick: TickMessage = { type: 'TICK', remaining: 0, elapsed: 0 };
    self.postMessage(tick);
  }
};

// Type export for the main thread hook
export type { WorkerOutMessage, TimerMessage };
