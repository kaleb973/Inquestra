'use client';
// src/hooks/useWebSerial.ts
// Manages navigator.serial lifecycle: connect, stream-parse, disconnect.
// Emits parsed float values from \n-delimited serial output into the Zustand store.

import { useCallback, useEffect, useRef } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';

export function useWebSerial() {
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const activeRef = useRef(false);

  const appendTelemetry = useNotebookStore((s) => s.appendTelemetry);
  const setHardwareStatus = useNotebookStore((s) => s.setHardwareStatus);

  const connect = useCallback(
    async (baudRate = 115200) => {
      if (typeof navigator === 'undefined' || !('serial' in navigator)) {
        console.warn('[Inquestra] Web Serial API is not available in this browser.');
        return;
      }
      if (activeRef.current) return;

      try {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate });
        portRef.current = port;
        activeRef.current = true;

        setHardwareStatus({
          isConnected: true,
          portName: 'USB Serial',
          baudRate,
          isSimulated: false,
          packetsPerSec: 0,
          totalBytes: 0,
        });

        // Pipe raw bytes → UTF-8 text via TransformStream
        const textDecoder = new TextDecoderStream();
        // Fire-and-forget pipe; cancellation is handled by reader.cancel()
        // Cast needed because our ambient SerialPort.readable is declared as
        // ReadableStream<Uint8Array>, but TextDecoderStream.writable expects
        // ReadableStream<BufferSource>. Uint8Array IS a BufferSource, so safe.
        void (port.readable as ReadableStream<BufferSource>)
          .pipeTo(textDecoder.writable)
          .catch(() => undefined);

        const reader = textDecoder.readable.getReader();
        readerRef.current = reader;

        let packetCount = 0;
        let lastHzTick = Date.now();
        let byteTotal = 0;
        let lineBuffer = '';

        try {
          while (activeRef.current) {
            const { value, done } = await reader.read();
            if (done || value === undefined) break;

            byteTotal += value.length;
            lineBuffer += value;

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
        } catch {
          // Stream ended or reader cancelled — fall through to finally
        } finally {
          try { reader.releaseLock(); } catch { /* no-op */ }
        }
      } catch (err) {
        // NotFoundError means the user cancelled the port picker dialog — not an error
        if (err instanceof Error && err.name !== 'NotFoundError') {
          console.error('[Inquestra] Serial connection error:', err);
        }
      } finally {
        activeRef.current = false;
        portRef.current = null;
        readerRef.current = null;
        setHardwareStatus({ isConnected: false, portName: null, packetsPerSec: 0, isSimulated: false });
      }
    },
    [appendTelemetry, setHardwareStatus]
  );

  const disconnect = useCallback(async () => {
    activeRef.current = false;
    try { await readerRef.current?.cancel(); } catch { /* no-op */ }
    try { await portRef.current?.close(); } catch { /* no-op */ }
    portRef.current = null;
    readerRef.current = null;
    setHardwareStatus({ isConnected: false, portName: null, packetsPerSec: 0, isSimulated: false });
  }, [setHardwareStatus]);

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
