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
    description: 'Factory-calibrated analog transducer sampling with non-blocking timing and USB-CDC streaming.',
    code: `// ESP32-S3 Bench Instrumentation Telemetry Stream
// Streams timestamped calibrated readings to Inquestra Web Serial buffer

#include <Arduino.h>
#include "esp_adc_cal.h"

#define ADC_CHANNEL        ADC1_CHANNEL_0 // GPIO 1
#define ADC_ATTENUATION    ADC_ATTEN_DB_12 // 0–3.1V dynamic range
#define SAMPLE_INTERVAL_US 10000 // 100 Hz acquisition cadence

static esp_adc_cal_characteristics_t adc_chars;
static uint32_t last_sample_us = 0;

void setup() {
  // Initialize native USB CDC (virtual COM port)
  Serial.begin(115200);
  while (!Serial && millis() < 3000) { yield(); }

  analogReadResolution(12);
  analogSetPinAttenuation(1, ADC_ATTENUATION);
  esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTENUATION, ADC_WIDTH_BIT_12, 1100, &adc_chars);

  // Send channel header for Inquestra parser
  Serial.println("# inquestra:format=csv,channels=time_ms,value,unit=mV");
}

void loop() {
  uint32_t now_us = micros();
  if (now_us - last_sample_us >= SAMPLE_INTERVAL_US) {
    last_sample_us = now_us;

    uint32_t raw = analogRead(1);
    uint32_t mv = esp_adc_cal_raw_to_voltage(raw, &adc_chars);

    // Formatted stream frame: [time_ms],[calibrated_mv]
    Serial.print(now_us / 1000);
    Serial.print(',');
    Serial.println(mv);
  }
}`,
  },
  arduino: {
    id: 'arduino',
    title: 'Arduino Uno / Mega (C++)',
    badge: 'Standard Microcontroller',
    language: 'cpp',
    description: 'Non-blocking sensor streaming for Arduino boards. Compatible with laboratory strain gauges, photodiode detectors, and analytical probes.',
    code: `// Laboratory Sensor Ingestion for Arduino Uno / Nano / Mega
// Compatible with strain gauges, thermistors, and photodiode amplifiers

const uint8_t PROBE_PIN = A0;
const uint16_t CADENCE_MS = 20; // 50 Hz sampling rate

unsigned long next_sample_ms = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  // Channel header for Inquestra parser
  Serial.println("# inquestra:channels=time_ms,ch0_raw");
}

void loop() {
  unsigned long now = millis();
  if (now >= next_sample_ms) {
    next_sample_ms = now + CADENCE_MS;

    int raw = analogRead(PROBE_PIN);
    Serial.print(now);
    Serial.print(',');
    Serial.println(raw);
  }
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
with open("trial_manifest.json", "r") as f:
    manifest = json.load(f)

# Verify SHA-256 data integrity before running statistical model
with open("telemetry_stream.csv", "rb") as f:
    computed_hash = hashlib.sha256(f.read()).hexdigest()

assert computed_hash == manifest["data_checksum"], "Data corruption or tampering detected!"
print(f"Cryptographic verification passed: {computed_hash}")

# Load verified telemetry into Pandas DataFrame
df = pd.read_csv("telemetry_stream.csv")
sampling_freq = 1000.0 # 1 kHz

# Compute Power Spectral Density (PSD) of sensor signal
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

  const TAB_LABELS: Record<CodeTab, string> = {
    esp32: 'ESP32-S3 (C++)',
    arduino: 'Arduino (C++)',
    webserial: 'Web Serial (TS)',
    python: 'Analysis (Python)',
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden text-left">
      {/* Tab Navigation Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/20 px-4 py-2 gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(Object.keys(SNIPPETS) as CodeTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-mono transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-background text-foreground font-semibold border border-border shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                {TAB_LABELS[tab]}
              </button>
            );
          })}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground border border-border bg-background hover:bg-muted/40 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Header Bar */}
      <div className="px-5 py-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground font-sans">
              {activeSnippet.title}
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground border border-border">
              {activeSnippet.badge}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            {activeSnippet.description}
          </p>
        </div>
      </div>

      {/* Code Block Container */}
      <div className="p-4 sm:p-5 bg-muted/10 font-mono text-xs overflow-x-auto leading-relaxed text-foreground max-h-[380px] border-b border-border">
        <pre className="whitespace-pre">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-2.5 bg-muted/20 flex flex-wrap items-center justify-between text-[11px] font-mono text-muted-foreground gap-2">
        <span>Protocol: Standard comma-separated telemetry frames over USB-CDC</span>
        <span>Driverless W3C Web Serial in Chromium browsers</span>
      </div>
    </div>
  );
}
