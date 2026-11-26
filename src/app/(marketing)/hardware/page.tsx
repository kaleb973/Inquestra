import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Hardware DAQ and Telemetry Ingestion',
  description:
    'Browser Web Serial telemetry ingestion for ESP32, Arduino, and lab sensors. Zero driver installation, 1 kHz sampling, and sub-millisecond latency.',
  path: '/hardware',
});

export default function HardwarePage() {
  const structuredData = buildGraphSchema([
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Hardware DAQ', path: '/hardware' },
    ]),
  ]);

  return (
    <div className="pt-14 sm:pt-20 pb-24">
      <JsonLd data={structuredData} />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-5 leading-[1.1]">
            Direct silicon-to-browser telemetry. Zero drivers required.
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            Stream serial measurements from lab instruments directly into your browser.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Launch Live DAQ Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-card text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Connect Real Hardware
            </Link>
          </div>
        </div>

        {/* Live Telemetry & Web Serial Showcase */}
        <div className="mt-12 bg-card border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/60 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-phosphor" aria-hidden="true" />
              <span className="font-semibold text-foreground">Web Serial Telemetry Stream</span>
              <span className="text-muted-foreground">/dev/ttyACM0, USB CDC, 921,600 baud</span>
            </div>
            <span className="text-phosphor font-medium">Buffer: Synchronized</span>
          </div>
          <div className="p-6 grid lg:grid-cols-12 gap-8 bg-background">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Channel 0: Strain Gauge / Differential ADC (mV)</span>
                <span className="text-foreground font-semibold">1,000 Hz continuous</span>
              </div>
              <div className="h-48 w-full bg-graphite rounded-md relative flex items-end p-3 gap-1 overflow-hidden">
                {[42, 45, 48, 52, 88, 14, 46, 50, 48, 51, 52, 92, 18, 47, 51, 49, 53, 95, 12, 44, 50, 48, 52, 89, 16, 48, 52, 50, 47, 53, 91, 19, 46, 50, 48].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-phosphor/85 rounded-t-sm"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono text-muted-foreground">
                <span>Sweep: 100ms/div</span>
                <span>16-bit differential, 0 to 3.1V calibrated</span>
                <span className="text-phosphor">Drop rate: 0.00%</span>
              </div>
            </div>

            <div className="lg:col-span-5 bg-graphite text-graphite-ink rounded-md p-5 flex flex-col justify-between font-mono text-xs">
              <div className="space-y-3">
                <div className="text-graphite-ink">
                  <span className="text-sky-400">const</span> port = <span className="text-sky-400">await</span> navigator.serial.requestPort();
                </div>
                <div className="text-graphite-ink">
                  <span className="text-sky-400">await</span> port.open(&#123; baudRate: 921600 &#125;);
                </div>
                <div className="p-3 rounded bg-graphite-elevated text-xs space-y-1 text-graphite-muted">
                  <div>USB Vendor ID: 0x303A (Espressif)</div>
                  <div>Device: ESP32-S3 USB OTG</div>
                  <div>Ring Buffer: 65,536 samples</div>
                  <div className="text-phosphor">Transport: Off-main-thread Web Worker</div>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs mt-4">
                <span className="text-graphite-muted">Kernel Latency</span>
                <span className="text-graphite-ink font-semibold">&lt; 0.42 ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Eliminating the fragile workstation bridge.
            </h2>
            <p className="text-base text-muted-foreground mt-3 leading-relaxed">
              Browser Web Serial removes the ad-hoc Python listeners and vendor kernel drivers typically sitting between serial lab instruments and digital records.
            </p>
          </div>

          <div className="border-y border-border py-8 grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border gap-y-6">
            <div className="md:col-span-6 md:pr-8 space-y-1.5">
              <p className="text-sm text-muted-foreground font-medium">USB-CDC and UART Transport</p>
              <p className="text-base font-semibold text-foreground">Native serial bus access</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pairs directly with CP2102, CH340, FT232R, and USB-OTG boards at 9,600 to 921,600 baud without installing vendor kernel drivers.
              </p>
            </div>
            <div className="md:col-span-6 pt-6 md:pt-0 md:pl-8 space-y-1.5">
              <p className="text-sm text-muted-foreground font-medium">Worker Thread Ring Buffer</p>
              <p className="text-base font-semibold text-foreground">Off-main-thread acquisition</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A dedicated Web Worker decodes incoming byte streams at up to 1 kHz so rich-text protocol editing stays jitter-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Validated silicon targets and benchmarks.
            </h2>
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              Every microcontroller firmware profile is benchmarked for packet stability and clock drift.
            </p>
          </div>

          <div className="border-y border-border overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-foreground">
                <tr>
                  <th className="py-3.5 pr-4 font-semibold">Silicon Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Clock and Core</th>
                  <th className="py-3.5 px-4 font-semibold">Max Tested Baud</th>
                  <th className="py-3.5 px-4 font-semibold">Max Sample Rate</th>
                  <th className="py-3.5 pl-4 font-semibold">Recommended Application</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-muted-foreground">
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 pr-4 font-medium text-foreground font-mono">Espressif ESP32-S3</td>
                  <td className="py-3.5 px-4">240 MHz Dual-Core Xtensa LX7</td>
                  <td className="py-3.5 px-4 font-mono">921,600 baud</td>
                  <td className="py-3.5 px-4 font-mono">1,000 Hz / 8 ch</td>
                  <td className="py-3.5 pl-4">High-speed sensor arrays, multi-channel bench DAQ</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 pr-4 font-medium text-foreground font-mono">PJRC Teensy 4.1</td>
                  <td className="py-3.5 px-4">600 MHz ARM Cortex-M7</td>
                  <td className="py-3.5 px-4 font-mono">480 Mbps USB HS</td>
                  <td className="py-3.5 px-4 font-mono">2,500 Hz / 16 ch</td>
                  <td className="py-3.5 pl-4">Spectroscopy, high-rate transducer arrays</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 pr-4 font-medium text-foreground font-mono">Arduino Uno R4 / Mega</td>
                  <td className="py-3.5 px-4">48 MHz Renesas RA4M1 / 16 MHz AVR</td>
                  <td className="py-3.5 px-4 font-mono">115,200 baud</td>
                  <td className="py-3.5 px-4 font-mono">250 Hz / 4 ch</td>
                  <td className="py-3.5 pl-4">Teaching benches, prototyping stations</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 pr-4 font-medium text-foreground font-mono">Nordic nRF52840</td>
                  <td className="py-3.5 px-4">64 MHz ARM Cortex-M4F</td>
                  <td className="py-3.5 px-4 font-mono">460,800 baud</td>
                  <td className="py-3.5 px-4 font-mono">500 Hz / 6 ch</td>
                  <td className="py-3.5 pl-4">Field measurements, portable sensor logging</td>
                </tr>
                <tr className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 pr-4 font-medium text-foreground font-mono">Raspberry Pi RP2040</td>
                  <td className="py-3.5 px-4">133 MHz Dual-Core Cortex-M0+</td>
                  <td className="py-3.5 px-4 font-mono">921,600 baud</td>
                  <td className="py-3.5 px-4 font-mono">1,000 Hz / 4 ch</td>
                  <td className="py-3.5 pl-4">Microfluidic pressure feedback, syringe pumps</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h2 className="text-3xl font-semibold text-foreground tracking-tight">
              Pre-calibrated for laboratory transducers and instruments.
            </h2>
          </div>

          <div className="border-y border-border overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3.5 pr-5 font-semibold w-1/4">Modality</th>
                  <th className="py-3.5 px-5 font-semibold">Signal and Interface</th>
                  <th className="py-3.5 pl-5 font-semibold">Reference ICs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 pr-5 font-medium text-foreground align-top">
                    <span className="block text-xs text-muted-foreground mb-1">Temperature and Analytical</span>
                    RTDs, pH and Probes
                  </td>
                  <td className="py-4 px-5 text-muted-foreground leading-relaxed align-top">
                    Continuous temperature, pH, conductivity, and dissolved oxygen monitoring from analog and digital sensor front-ends.
                  </td>
                  <td className="py-4 pl-5 text-xs font-mono text-muted-foreground align-top">MAX31865, ADS1115</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 pr-5 font-medium text-foreground align-top">
                    <span className="block text-xs text-muted-foreground mb-1">Materials and Mechanics</span>
                    Force Plates and Load Cells
                  </td>
                  <td className="py-4 px-5 text-muted-foreground leading-relaxed align-top">
                    Full-bridge Wheatstone strain gauge telemetry with zero-tare and dynamic calibration curves for stress-strain tests.
                  </td>
                  <td className="py-4 pl-5 text-xs font-mono text-muted-foreground align-top">HX711, INA125</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 pr-5 font-medium text-foreground align-top">
                    <span className="block text-xs text-muted-foreground mb-1">Electrochemistry and Signals</span>
                    Potentiostats and Biopotentials
                  </td>
                  <td className="py-4 px-5 text-muted-foreground leading-relaxed align-top">
                    Cyclic voltammetry sweeps, impedance spectra, and differential voltage measurements with digital notch filtering.
                  </td>
                  <td className="py-4 pl-5 text-xs font-mono text-muted-foreground align-top">AD8232, ADS1298</td>
                </tr>
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-4 pr-5 font-medium text-foreground align-top">
                    <span className="block text-xs text-muted-foreground mb-1">Fluidics and Pressure</span>
                    Pressure and Flow Meters
                  </td>
                  <td className="py-4 px-5 text-muted-foreground leading-relaxed align-top">
                    Piezoresistive pressure transducers, differential flow sensors, and microfluidic feedback loops.
                  </td>
                  <td className="py-4 pl-5 text-xs font-mono text-muted-foreground align-top">MS5803, SDP810</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
        <div className="p-10 rounded-lg bg-card border border-border">
          <h3 className="text-2xl sm:text-3xl text-foreground mb-3 font-semibold">
            Ready to interface your bench hardware?
          </h3>
          <p className="text-base text-muted-foreground max-w-xl mx-auto mb-6">
            Test telemetry ingestion in the browser simulator, or open the workspace to connect live hardware.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-95 px-6 h-11 rounded-md text-sm font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Test Live Simulator
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-medium border border-border bg-background text-foreground hover:bg-muted/60 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Explore System Architecture
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
