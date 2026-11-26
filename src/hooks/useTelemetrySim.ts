'use client';
// src/hooks/useTelemetrySim.ts
// Synthetic data generator emitting a realistic thermistor waveform at 50 Hz.
// Sine wave: 37.0 °C base ± 0.5 °C amplitude + ±0.025 °C white noise.

import { useCallback, useEffect, useRef } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';

export type SimMode = 'ecg' | 'thermistor';

const ECG_INTERVAL_MS = 10; // 100 Hz for biopotentials
const THERM_INTERVAL_MS = 20; // 50 Hz
const HZ_REPORT_INTERVAL = 1000;

export function useTelemetrySim() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(0);
  const packetCountRef = useRef(0);
  const lastHzRef = useRef(Date.now());
  const activeModeRef = useRef<SimMode>('thermistor');

  const appendTelemetry = useNotebookStore((s) => s.appendTelemetry);
  const setHardwareStatus = useNotebookStore((s) => s.setHardwareStatus);

  const startSimulation = useCallback((mode: SimMode = 'thermistor') => {
    if (intervalRef.current !== null) return;
    activeModeRef.current = mode;

    setHardwareStatus({
      isConnected: true,
      portName: mode === 'ecg' ? 'ESP32 (Simulated ECG)' : 'Simulator (Thermistor)',
      baudRate: 115200,
      isSimulated: true,
      packetsPerSec: 0,
      totalBytes: 0,
    });

    const isEcg = mode === 'ecg';
    const intervalMs = isEcg ? ECG_INTERVAL_MS : THERM_INTERVAL_MS;
    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      let value = 0;

      if (isEcg) {
        // Standard Lead-II ECG waveform: 75 bpm (800ms cardiac cycle)
        const cycleMs = 800;
        const t = ((now - startTime) % cycleMs) / cycleMs; // 0.0 to 1.0

        // Gaussian components: P, Q, R, S, T waves
        const pWave = 0.15 * Math.exp(-Math.pow(t - 0.20, 2) / (2 * Math.pow(0.035, 2)));
        const qWave = -0.18 * Math.exp(-Math.pow(t - 0.36, 2) / (2 * Math.pow(0.012, 2)));
        const rPeak = 1.45 * Math.exp(-Math.pow(t - 0.40, 2) / (2 * Math.pow(0.015, 2)));
        const sWave = -0.32 * Math.exp(-Math.pow(t - 0.44, 2) / (2 * Math.pow(0.014, 2)));
        const tWave = 0.35 * Math.exp(-Math.pow(t - 0.65, 2) / (2 * Math.pow(0.055, 2)));
        const noise = (Math.random() - 0.5) * 0.015;

        value = pWave + qWave + rPeak + sWave + tWave + noise;
      } else {
        // Thermistor 37.0 °C physiological bath
        const noise = (Math.random() - 0.5) * 0.05;
        value = 37.0 + 0.5 * Math.sin(phaseRef.current) + noise;
        phaseRef.current += 0.1;
      }

      appendTelemetry({
        timestamp: now,
        value: parseFloat(value.toFixed(4)),
        sensorId: isEcg ? 'ad8232-ecg-sim' : 'thermistor-sim',
        unit: isEcg ? 'mV' : '°C',
      });

      packetCountRef.current++;

      if (now - lastHzRef.current >= HZ_REPORT_INTERVAL) {
        setHardwareStatus({ packetsPerSec: packetCountRef.current });
        packetCountRef.current = 0;
        lastHzRef.current = now;
      }
    }, intervalMs);
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
