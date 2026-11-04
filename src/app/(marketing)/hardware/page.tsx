import Link from 'next/link';
import { ArrowRight, Cpu } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hardware DAQ & Telemetry Ingestion — Inquestra',
  description:
    'Direct browser Web Serial telemetry ingestion for ESP32, Arduino, Teensy, laboratory instruments, and analytical sensors. Zero driver installation, 1 kHz sampling, and sub-millisecond latency.',
};

export default function HardwarePage() {
  return (
    <div className="pt-28 pb-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-muted text-muted-foreground text-xs font-mono uppercase tracking-wider mb-6">
            <Cpu className="w-3.5 h-3.5 text-phosphor" />
            <span>Platform / Hardware Instrumentation</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-normal tracking-tight text-foreground mb-6 leading-[1.15]">
            Direct silicon-to-browser telemetry. Zero drivers required.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            Inquestra communicates directly with microcontrollers and analog front-ends via the native W3C Web Serial API.
            Stream continuous multi-channel biopotential, hemodynamic, and force transducer signals directly into your
            experimental notebook buffer with zero intermediate daemons.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-3 rounded text-sm font-medium transition-colors"
            >
              Launch Live DAQ Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 py-3 rounded text-sm font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Connect Real Hardware
            </Link>
          </div>
        </div>

        {/* Live Terminal & Pinout Graphic */}
        <div className="mt-14 bg-card border border-border rounded-lg overflow-hidden shadow-xl">
          <div className="bg-muted/70 px-4 py-2.5 border-b border-border flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-phosphor" />
              <span className="font-semibold text-foreground">Web Serial Telemetry Stream</span>
              <span className="text-muted-foreground">/dev/ttyACM0 · USB CDC · 921,600 baud</span>
            </div>
            <span className="text-phosphor font-medium">BUFFER: SYNCHRONIZED</span>
          </div>
          <div className="p-6 grid lg:grid-cols-12 gap-8 bg-background">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground uppercase">Channel 0: Differential EMG (mV)</span>
                <span className="text-foreground font-semibold">1,000 Hz continuous</span>
              </div>
              <div className="h-48 w-full bg-muted/20 border border-border/80 rounded relative flex items-end p-2 gap-1 overflow-hidden">
                <div className="absolute inset-0 grid grid-rows-4 grid-cols-8 pointer-events-none opacity-20 border-b border-border">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="border-r border-t border-border/40" />
                  ))}
                </div>
                {[42, 45, 48, 52, 88, 14, 46, 50, 48, 51, 52, 92, 18, 47, 51, 49, 53, 95, 12, 44, 50, 48, 52, 89, 16, 48, 52, 50, 47, 53, 91, 19, 46, 50, 48].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-phosphor/80 rounded-t-sm"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
                <span>Sweep: 100ms/div</span>
                <span>Active Filtering: 50/60Hz Notch + 0.5-500Hz Bandpass</span>
                <span className="text-phosphor">Drop rate: 0.00%</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-card border border-border rounded p-4 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-3">
                <div className="text-muted-foreground">{''}</div>
                <div className="text-foreground">
                  <span className="text-primary">const</span> port = <span className="text-primary">await</span> navigator.serial.requestPort();
                </div>
                <div className="text-foreground">
                  <span className="text-primary">await</span> port.open(&#123; baudRate: 921600 &#125;);
                </div>
                <div className="p-2.5 rounded bg-muted/40 border border-border/80 text-[11px] space-y-1 text-muted-foreground">
                  <div>USB Vendor ID: 0x303A (Espressif)</div>
                  <div>Device Product: ESP32-S3 USB OTG</div>
                  <div>Ring Buffer Allocation: 65,536 samples</div>
                  <div className="text-phosphor">Transport: Off-main-thread Web Worker</div>
                </div>
              </div>
              <div className="pt-4 border-t border-border flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Kernel Latency</span>
                <span className="text-foreground font-semibold">&lt; 0.42 ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section — spec strip replaces 3-col card grid */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mb-10">
            <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
              Eliminating the fragile workstation bridge.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Traditional laboratory DAQ setups rely on ad-hoc Python listeners, proprietary National Instruments runtime
              drivers, or custom C++ daemons writing loose CSV files to workstation desktops. Inquestra replaces this entire
              fragile chain with browser-native Web Serial communication.
            </p>
          </div>

          {/* Horizontal spec strip */}
          <div className="border-t border-b border-border py-8 flex flex-wrap gap-y-8">
            <div className="flex-1 min-w-48 pr-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Transport</p>
              <p className="text-sm font-medium text-foreground mb-1">Native USB-CDC &amp; UART</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects to CP2102, CH340, FTDI FT232R, and native USB-OTG controllers without administrative
                driver installs or kernel extensions.
              </p>
            </div>
            <div className="flex-1 min-w-48 px-8 border-r border-border last:border-r-0">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Threading</p>
              <p className="text-sm font-medium text-foreground mb-1">Worker Ring Buffering</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Byte parsing and packet validation execute inside a dedicated HTML5 Web Worker. 1 kHz sampling
                never causes UI frame drops or notebook stutter.
              </p>
            </div>
            <div className="flex-1 min-w-48 pl-8">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Throughput</p>
              <p className="text-sm font-medium text-foreground mb-1">Up to 921,600 Baud</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard laboratory baud rates from 9,600 to 921,600 with hardware flow control (RTS/CTS)
                for synchronous multi-channel acquisition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Microcontroller Compatibility Table */}
      <section className="py-20 border-t border-border bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
              Validated silicon targets &amp; benchmarks.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Every microcontroller firmware driver is benchmarked for packet stability, buffer overrun resistance, and clock drift.
            </p>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/20 border-b border-border text-foreground font-mono">
                <tr>
                  <th className="py-3.5 px-4 font-normal text-muted-foreground uppercase tracking-wider">Silicon Platform</th>
                  <th className="py-3.5 px-4 font-normal text-muted-foreground uppercase tracking-wider">Clock &amp; Core</th>
                  <th className="py-3.5 px-4 font-normal text-muted-foreground uppercase tracking-wider">Max Tested Baud</th>
                  <th className="py-3.5 px-4 font-normal text-muted-foreground uppercase tracking-wider">Max Sample Rate</th>
                  <th className="py-3.5 px-4 font-normal text-muted-foreground uppercase tracking-wider">Recommended Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground font-mono">Espressif ESP32-S3</td>
                  <td className="py-3.5 px-4">240 MHz Dual-Core Xtensa LX7</td>
                  <td className="py-3.5 px-4 font-mono">921,600 baud</td>
                  <td className="py-3.5 px-4 font-mono">1,000 Hz / 8 ch</td>
                  <td className="py-3.5 px-4">High-speed biopotential DAQ, wearable sensor arrays</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground font-mono">PJRC Teensy 4.1</td>
                  <td className="py-3.5 px-4">600 MHz ARM Cortex-M7</td>
                  <td className="py-3.5 px-4 font-mono">480 Mbps USB HS</td>
                  <td className="py-3.5 px-4 font-mono">2,500 Hz / 16 ch</td>
                  <td className="py-3.5 px-4">Ultra-fast electrophysiology, multi-electrode arrays</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground font-mono">Arduino Uno R4 / Mega</td>
                  <td className="py-3.5 px-4">48 MHz Renesas RA4M1 / 16 MHz AVR</td>
                  <td className="py-3.5 px-4 font-mono">115,200 baud</td>
                  <td className="py-3.5 px-4 font-mono">250 Hz / 4 ch</td>
                  <td className="py-3.5 px-4">Classroom biomechanics, standard bench prototyping</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground font-mono">Nordic nRF52840</td>
                  <td className="py-3.5 px-4">64 MHz ARM Cortex-M4F</td>
                  <td className="py-3.5 px-4 font-mono">460,800 baud</td>
                  <td className="py-3.5 px-4 font-mono">500 Hz / 6 ch</td>
                  <td className="py-3.5 px-4">In vivo telemetry, implantable telemetry models</td>
                </tr>
                <tr className="hover:bg-muted/10 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground font-mono">Raspberry Pi RP2040</td>
                  <td className="py-3.5 px-4">133 MHz Dual-Core Cortex-M0+</td>
                  <td className="py-3.5 px-4 font-mono">921,600 baud</td>
                  <td className="py-3.5 px-4 font-mono">1,000 Hz / 4 ch</td>
                  <td className="py-3.5 px-4">Microfluidic pressure feedback, automated syringes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Supported Laboratory Transducers & Analytical Sensors */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="font-display text-3xl font-normal text-foreground tracking-tight">
              Pre-calibrated for laboratory transducers &amp; instruments.
            </h2>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider w-1/4">Modality</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Signal &amp; Interface</th>
                  <th className="text-left px-5 py-3 text-xs font-mono text-muted-foreground font-normal uppercase tracking-wider">Reference ICs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">
                    <span className="block text-xs font-mono text-muted-foreground mb-1">01 / BIOPOTENTIAL</span>
                    ECG, EMG &amp; EEG
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">
                    Direct integration with instrumentation amplifier front-ends. Software 50/60 Hz notch filtering and 0.5–500 Hz bandpass.
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">AD8232, ADS1298</td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">
                    <span className="block text-xs font-mono text-muted-foreground mb-1">02 / HEMODYNAMICS</span>
                    PPG &amp; Pulse Oximetry
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">
                    Dual red/infrared photoplethysmography decoding for SpO₂ and arterial waveform contour analysis.
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">MAX30102, AFE4490</td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">
                    <span className="block text-xs font-mono text-muted-foreground mb-1">03 / BIOMECHANICS</span>
                    Force Plates &amp; Load Cells
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">
                    Full-bridge Wheatstone strain gauge telemetry with zero-tare and dynamic calibration curves.
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">HX711, INA125</td>
                </tr>
                <tr className="hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground align-top">
                    <span className="block text-xs font-mono text-muted-foreground mb-1">04 / MICROFLUIDICS</span>
                    Pressure &amp; Temperature
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed align-top">
                    Piezoresistive pressure transducers and PT100/PT1000 RTD resistance probes for continuous bioreactor monitoring.
                  </td>
                  <td className="px-5 py-4 text-xs font-mono text-muted-foreground align-top">MS5803, MAX31865</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 text-center">
        <div className="p-10 rounded-xl bg-card border border-border shadow-sm">
          <h3 className="font-display text-2xl sm:text-3xl text-foreground mb-3 font-normal">
            Ready to interface your bench hardware?
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
            Test our telemetry ingestion pipeline right now using our in-browser simulator, or launch the workspace to stream real hardware.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded text-xs font-semibold transition-colors"
            >
              Test Live Simulator
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded text-xs font-medium border border-border text-foreground hover:bg-muted/40 transition-colors"
            >
              Explore System Architecture
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
