'use client';
// src/components/hardware/SerialControlPanel.tsx
// Baud-rate selector + connect/disconnect button for physical USB serial devices.

import { useState, useEffect } from 'react';
import { Plug, PlugZap } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { useWebSerial } from '@/hooks/useWebSerial';
import { checkLabCompliance } from '@/actions/adminActions';

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600] as const;

export function SerialControlPanel() {
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);
  const { connect, disconnect } = useWebSerial();
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [isWebSerialSupported, setIsWebSerialSupported] = useState(true);

  useEffect(() => {
    setIsWebSerialSupported(typeof navigator !== 'undefined' && 'serial' in navigator);
  }, []);

  const isPhysicallyConnected = hardwareStatus.isConnected;

  return (
    <div className="space-y-2">
      {!isWebSerialSupported && (
        <p className="text-[10px] text-amber-500 leading-tight">
          Web Serial requires Chrome or Edge on a secure context.
        </p>
      )}

      {/* Baud rate selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">Baud</span>
        <select
          value={selectedBaud}
          onChange={(e) => setSelectedBaud(Number(e.target.value))}
          disabled={isPhysicallyConnected}
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {BAUD_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {/* Port status pill */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            isPhysicallyConnected ? 'bg-indigo-400 animate-pulse' : 'bg-muted-foreground/40'
          }`}
        />
        <span className="text-[10px] text-muted-foreground truncate">
          {isPhysicallyConnected
            ? (hardwareStatus.portName ?? 'Connected')
            : 'No device'}
        </span>
      </div>

      {/* Connect / Disconnect */}
      <button
        onClick={async () => {
          if (isPhysicallyConnected) {
            disconnect();
          } else {
            const res = await checkLabCompliance();
            if (!res.compliant) {
              alert(res.reason);
              return;
            }
            connect(selectedBaud);
          }
        }}
        disabled={!isWebSerialSupported}
        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isPhysicallyConnected
            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
        }`}
      >
        {isPhysicallyConnected ? (
          <>
            <PlugZap className="w-3.5 h-3.5" />
            Disconnect
          </>
        ) : (
          <>
            <Plug className="w-3.5 h-3.5" />
            Connect USB
          </>
        )}
      </button>
    </div>
  );
}
