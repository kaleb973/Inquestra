'use client';
// src/hooks/useTelemetrySim.ts
// Synthetic data generator emitting a realistic thermistor waveform at 50 Hz.
// Sine wave: 37.0 °C base ± 0.5 °C amplitude + ±0.025 °C white noise.

import { useCallback, useEffect, useRef } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';

const SIM_INTERVAL_MS = 20; // 50 Hz
const BASE_TEMP = 37.0;
const AMPLITUDE = 0.5;
const NOISE_SCALE = 0.025;
const HZ_REPORT_INTERVAL = 1000;

export function useTelemetrySim() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(0);
  const packetCountRef = useRef(0);
  const lastHzRef = useRef(Date.now());

  const appendTelemetry = useNotebookStore((s) => s.appendTelemetry);
  const setHardwareStatus = useNotebookStore((s) => s.setHardwareStatus);

  const startSimulation = useCallback(() => {
    if (intervalRef.current !== null) return;

    setHardwareStatus({
      isConnected: true,
      portName: 'Simulator',
      baudRate: 115200,
      isSimulated: true,
      packetsPerSec: 0,
      totalBytes: 0,
    });

    intervalRef.current = setInterval(() => {
      const noise = (Math.random() - 0.5) * 2 * NOISE_SCALE;
      const value = BASE_TEMP + AMPLITUDE * Math.sin(phaseRef.current) + noise;
      phaseRef.current += 0.1;

      appendTelemetry({
        timestamp: Date.now(),
        value: parseFloat(value.toFixed(4)),
        sensorId: 'thermistor-sim',
        unit: '°C',
      });

      packetCountRef.current++;

      const now = Date.now();
      if (now - lastHzRef.current >= HZ_REPORT_INTERVAL) {
        setHardwareStatus({ packetsPerSec: packetCountRef.current });
        packetCountRef.current = 0;
        lastHzRef.current = now;
      }
    }, SIM_INTERVAL_MS);
  }, [appendTelemetry, setHardwareStatus]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    phaseRef.current = 0;
    packetCountRef.current = 0;
    setHardwareStatus({
      isConnected: false,
      portName: null,
      packetsPerSec: 0,
      isSimulated: false,
    });
  }, [setHardwareStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  return { startSimulation, stopSimulation };
}
