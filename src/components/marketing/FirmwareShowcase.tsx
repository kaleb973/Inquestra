'use client';

import { useState } from 'react';
import { Terminal, Cpu, Code2, Shield, ArrowRight, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

type CodeTab = 'esp32' | 'arduino' | 'webserial' | 'python';

interface CodeSnippet {
  id: CodeTab;
  title: string;
  badge: string;
  language: string;
  description: string;
  code: string;
}

const SNIPPETS: Record<CodeTab, CodeSnippet> = {
  esp32: {
    id: 'esp32',
    title: 'ESP32-S3 Firmware (C++)',
    badge: 'Hardware DAQ',
    language: 'cpp',
    description: 'High-speed differential biopotential sampling with FreeRTOS ring-buffer queue and USB-CDC telemetry stream.',
    code: `// Inquestra DAQ Firmware for ESP32-S3 (Arduino Core / ESP-IDF)
// Continuous 1,000 Hz biopotential sampling with hardware timer

#include <Arduino.h>

const int SENSOR_PIN = 1;        // ADC1_CH0 (GPIO 1)
hw_timer_t *timer = NULL;
volatile uint32_t sampleCount = 0;

void IRAM_ATTR onSampleTimer() {
  sampleCount++;
}

void setup() {
  // High-speed native USB CDC at 921,600 baud
  Serial.begin(921600);
  analogReadResolution(12);       // 12-bit ADC (0 - 4095)

  // Configure 1 kHz hardware timer ISR
  timer = timerBegin(1000000);   // 1 MHz base
  timerAttachInterrupt(timer, &onSampleTimer);
  timerAlarm(timer, 1000, true, 0); // 1,000 ticks = 1 ms interval
}

void loop() {
  static uint32_t lastProcessed = 0;
  if (sampleCount != lastProcessed) {
    lastProcessed = sampleCount;
    int raw = analogRead(SENSOR_PIN);
    float voltage = (raw * 3.3f) / 4095.0f; // Scale to volts

    // Emits standard Inquestra CSV frame: [timestamp_ms],[voltage_mv]
    Serial.printf("%lu,%.4f\\n", millis(), voltage * 1000.0f);
  }
}`,
  },
  arduino: {
    id: 'arduino',
    title: 'Arduino Uno / Mega (C++)',
    badge: 'Standard Microcontroller',
    language: 'cpp',
    description: 'Standard 115,200 baud streaming for Arduino boards. Directly compatible with AD8232 ECG and MyoWare EMG sensors.',
    code: `// Inquestra Basic DAQ for Arduino Uno / Nano / Mega
// Compatible with AD8232 ECG, MyoWare EMG, and HX711 Load Cells

const int SENSOR_CH0 = A0;
const int SENSOR_CH1 = A1;

void setup() {
  // Standard high-reliability bench baud rate
  Serial.begin(115200);
  while (!Serial) { ; } // Wait for USB connection
}

void loop() {
  unsigned long now = millis();
  int raw0 = analogRead(SENSOR_CH0);
  int raw1 = analogRead(SENSOR_CH1);

  // Convert 10-bit ADC (0-1023) to millivolts (5.0V reference)
  float ch0_mv = (raw0 * 5000.0) / 1023.0;
  float ch1_mv = (raw1 * 5000.0) / 1023.0;

  // Stream comma-separated values to Inquestra browser buffer
  Serial.print(now);
  Serial.print(",");
  Serial.print(ch0_mv, 2);
  Serial.print(",");
  Serial.println(ch1_mv, 2);

  delay(2); // ~500 Hz acquisition loop
}`,
  },
  webserial: {
    id: 'webserial',
    title: 'Browser Web Serial Consumer',
    badge: 'Zero Drivers Required',
    language: 'typescript',
    description: 'Native W3C Web Serial API implementation used inside Inquestra to ingest bytes directly to Web Worker ring buffers.',
    code: `// Inquestra Browser-Silicon Ingestion Engine
// Uses native W3C Web Serial API (Chrome, Edge, Chromium)

async function connectBenchInstrument(baudRate: number = 115200) {
  // 1. Request physical hardware port via native browser prompt
  const port = await navigator.serial.requestPort({
    filters: [
      { usbVendorId: 0x303a }, // Espressif ESP32-S3
      { usbVendorId: 0x2341 }, // Arduino SA
      { usbVendorId: 0x16c0 }, // Teensy / PJRC
    ]
  });

  // 2. Open serial stream with hardware flow control
  await port.open({ baudRate, bufferSize: 65536 });

  // 3. Pipe byte stream into TextDecoderStream and off-thread ring buffer
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  // Ingest continuous telemetry packets with zero GC pressure
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    telemetryWorker.postMessage({ type: 'APPEND_CHUNK', chunk: value });
  }
}`,
  },
  python: {
    id: 'python',
    title: 'Python / SciPy Scientific Export',
    badge: 'Open Provenance',
    language: 'python',
    description: 'Load exported Inquestra trial packages in Python with automated SHA-256 cryptographic checksum verification.',
    code: `import hashlib
import json
import pandas as pd
import numpy as np

# Load sealed trial manifest and telemetry stream
with open("trial_TR-2026-BME_manifest.json", "r") as f:
    manifest = json.load(f)

# Verify SHA-256 data integrity before running statistical model
with open("telemetry_stream.csv", "rb") as f:
    computed_hash = hashlib.sha256(f.read()).hexdigest()

assert computed_hash == manifest["data_checksum"], "Data corruption or tampering detected!"
print(f"Cryptographic verification passed: {computed_hash}")

# Load verified telemetry into Pandas DataFrame
df = pd.read_csv("telemetry_stream.csv")
sampling_freq = 1000.0 # 1 kHz

# Compute Power Spectral Density (PSD) for muscle fatigue assessment
from scipy import signal
frequencies, psd = signal.welch(df["ch0_mv"], fs=sampling_freq, nperseg=1024)
mean_freq = np.sum(frequencies * psd) / np.sum(psd)
print(f"Mean Frequency: {mean_freq:.2f} Hz (Valid research record)")`,
  },
};

export function FirmwareShowcase() {
  const [activeTab, setActiveTab] = useState<CodeTab>('esp32');
  const [copied, setCopied] = useState(false);

  const activeSnippet = SNIPPETS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeSnippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden text-left">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(Object.keys(SNIPPETS) as CodeTab[]).map((tab) => {
            const item = SNIPPETS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-mono transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-background text-foreground font-semibold border border-border shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {item.title?.split(' ')?.[0] ?? ''}
              </button>
            );
          })}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground border border-border bg-background hover:bg-muted/60 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-phosphor" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Header Bar */}
      <div className="px-5 py-3 border-b border-border/80 bg-background/50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground font-sans">
              {activeSnippet.title}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {activeSnippet.badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            {activeSnippet.description}
          </p>
        </div>
      </div>

      {/* Code Block Container */}
      <div className="p-4 sm:p-5 bg-background font-mono text-xs overflow-x-auto leading-relaxed text-foreground/90 max-h-[380px]">
        <pre className="whitespace-pre">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>No proprietary libraries or drivers needed</span>
        <span className="text-phosphor">Standard ANSI C++ / ES2022 / Python 3</span>
      </div>
    </div>
  );
}
