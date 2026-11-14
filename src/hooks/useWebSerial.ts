'use client';
// src/hooks/useWebSerial.ts
// Manages navigator.serial lifecycle: connect, stream-parse, disconnect.
// Emits parsed float values from \n-delimited serial output into the Zustand store.

import { useCallback, useEffect, useRef } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';

export function useWebSerial() {
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const activeRef = useRef(false);

  const appendTelemetry = useNotebookStore((s) => s.appendTelemetry);
  const setHardwareStatus = useNotebookStore((s) => s.setHardwareStatus);

  const disconnect = useCallback(async () => {
    activeRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {
        /* no-op */
      }
      try {
        readerRef.current.releaseLock();
      } catch {
        /* no-op */
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err) {
        console.warn('[Inquestra] Error closing serial port:', err);
      }
      portRef.current = null;
    }

    setHardwareStatus({
      isConnected: false,
      portName: null,
      packetsPerSec: 0,
      isSimulated: false,
    });
  }, [setHardwareStatus]);

  const connect = useCallback(
    async (baudRate = 115200) => {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        console.warn('[Inquestra] Web Serial API is not available in this browser.');
        if (typeof window !== 'undefined') {
          alert(
            'Web Serial requires a Chromium-based browser (Chrome, Edge, Brave, or Opera). Please open Inquestra in a Chromium browser for direct USB DAQ, or use the virtual telemetry simulator.'
          );
        }
        return;
      }
      if (activeRef.current) return;

      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate });
        portRef.current = port;
        activeRef.current = true;

        if (!port.readable) {
          throw new Error('Selected serial port does not provide a readable stream.');
        }

        const reader = port.readable.getReader();
        readerRef.current = reader;

        setHardwareStatus({
          isConnected: true,
          portName: 'USB Serial',
          baudRate,
          isSimulated: false,
          packetsPerSec: 0,
          totalBytes: 0,
        });

        const decoder = new TextDecoder();
        let packetCount = 0;
        let lastHzTick = Date.now();
        let byteTotal = 0;
        let lineBuffer = '';

        try {
          while (activeRef.current) {
            const { value, done } = await reader.read();
            if (done || value === undefined) break;

            byteTotal += value.byteLength;
            lineBuffer += decoder.decode(value, { stream: true });

            // Split on newline; keep any partial trailing line for the next chunk
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop() ?? '';

            for (const raw of lines) {
              const trimmed = raw.trim();
              if (!trimmed) continue;
              const num = parseFloat(trimmed);
              if (!isNaN(num)) {
                appendTelemetry({ timestamp: Date.now(), value: num });
                packetCount++;
              }
            }

            // Update Hz counter once per second
            const now = Date.now();
            if (now - lastHzTick >= 1000) {
              setHardwareStatus({ packetsPerSec: packetCount, totalBytes: byteTotal });
              packetCount = 0;
              lastHzTick = now;
            }
          }
        } catch (readErr) {
          if (activeRef.current) {
            console.warn('[Inquestra] Stream reading interrupted:', readErr);
          }
        } finally {
          try {
            reader.releaseLock();
          } catch {
            /* no-op */
          }
          readerRef.current = null;
        }
      } catch (err) {
        // NotFoundError means the user cancelled the port picker dialog — not an error
        if (err instanceof Error && err.name !== 'NotFoundError') {
          console.error('[Inquestra] Serial connection error:', err);
        }
      } finally {
        activeRef.current = false;
        if (portRef.current) {
          try {
            await portRef.current.close();
          } catch {
            /* no-op */
          }
          portRef.current = null;
        }
        setHardwareStatus({
          isConnected: false,
          portName: null,
          packetsPerSec: 0,
          isSimulated: false,
        });
      }
    },
    [appendTelemetry, setHardwareStatus]
  );

  // Clean up on unmount to prevent memory leaks and dangling hardware locks
  useEffect(() => {
    return () => {
      if (activeRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);

  return { connect, disconnect };
}
