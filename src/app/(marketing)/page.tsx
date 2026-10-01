"use client";

import Link from "next/link";
import { ShieldCheck, Database, Zap, Cpu, TestTube, CheckCircle2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { motion } from "framer-motion";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 selection:bg-indigo-500/30 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo className="w-6 h-6 text-indigo-500 group-hover:text-indigo-400 transition-colors" />
              <span className="font-bold text-lg tracking-tight text-white">Inquestra</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/app/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/app/signup" className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (PAS Framework) */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-gray-950 to-gray-950 -z-10" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            BME Data Acquisition & ERN
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight text-balance"
          >
            Stop copying CSVs. <br />
            <span className="bg-gradient-to-r from-indigo-400 to-teal-200 bg-clip-text text-transparent">
              Start doing science.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-gray-400 mb-10 text-balance"
          >
            Hardware telemetry and your research notebook shouldn't live in two different worlds. 
            Stream ESP32 data directly into immutable, cryptographically verifiable protocols.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link href="/app/signup" className="inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Enter Workspace <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-gray-900/30 border-y border-gray-800/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">A unified environment for rigorous research</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-balance">Inquestra bridges the gap between hardware engineering and protocol documentation, ensuring every data point is traceable.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 hover:border-indigo-500/30 transition-colors shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Live Hardware DAQ</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Connect ESP32s and Arduinos instantly via Web Serial. Visualize and record high-frequency telemetry without external scripts.</p>
            </div>
            
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 hover:border-indigo-500/30 transition-colors shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cryptographic Provenance</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Every protocol run is immutable and timestamped. PI Audit Trails ensure zero silent modifications to your recorded results.</p>
            </div>
            
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 hover:border-indigo-500/30 transition-colors shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                <TestTube className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Smart Inventory</h3>
              <p className="text-gray-400 leading-relaxed text-sm">Reference reagents directly in your notebook. Slash commands deduct quantities instantly and alert admins when stock is low.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (Alternating) */}
      <section className="py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-24 md:mb-32">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-indigo-400 font-medium mb-4">
                <Database className="w-5 h-5" />
                <span className="text-sm tracking-widest uppercase">The Old Way</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6 text-balance">Fragmented tools kill reproducibility</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-gray-400">Juggling Python scripts just to read serial ports.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-gray-400">Manually pasting CSV data into rigid notebook software.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-gray-400">No verifiable proof that data wasn't altered post-experiment.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg relative">
              <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-800 rounded"></div>
                      <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-center h-32 border border-dashed border-red-500/30 bg-red-500/5 rounded-xl text-red-400 font-mono text-sm">
                  Error: Serial Port Disconnected
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-indigo-400 font-medium mb-4">
                <Zap className="w-5 h-5" />
                <span className="text-sm tracking-widest uppercase">The Inquestra Way</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-6 text-balance">One continuous flow of truth</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-gray-400">Browser-native DAQ captures signals directly into the cloud.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-gray-400">Telemetry is appended directly to the active protocol step.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
                  <p className="text-gray-400">Strict mode locks the record, creating a permanent audit trail.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg relative">
              <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
              <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="font-mono text-indigo-400 text-sm">COM3 Connected (100Hz)</span>
                </div>
                <div className="h-32 bg-gray-950 rounded-xl border border-gray-800 relative overflow-hidden flex items-end">
                   <div className="w-full h-full flex items-end gap-1 px-2 pb-2 opacity-60">
                     {[40, 60, 45, 80, 55, 90, 75, 100, 65, 85, 70, 95].map((h, i) => (
                       <div key={i} className="flex-1 bg-indigo-500 rounded-t-sm transition-all" style={{ height: `${h}%` }} />
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden border-t border-gray-800">
        <div className="absolute inset-0 bg-indigo-900/10" />
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to secure your lab's data?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto text-balance">Join researchers who have abandoned disjointed spreadsheets for a platform built on cryptographic provenance.</p>
          <Link href="/app/signup" className="inline-flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Legal & Compliance Footer */}
      <footer className="bg-gray-950 py-12 border-t border-gray-900 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <Logo className="w-6 h-6 text-indigo-500" />
            <span className="font-bold text-white tracking-tight text-xl">Inquestra</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 mt-2">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-700">•</span>
            <Link href="/app/login" className="hover:text-white transition-colors">
              Researcher Login
            </Link>
            <span className="text-gray-700">•</span>
            <a href="mailto:legal@inquestra.org" className="hover:text-white transition-colors">
              Legal &amp; DMCA
            </a>
          </div>

          <p className="text-xs text-gray-500 font-sans max-w-xl mx-auto leading-relaxed mt-2">
            &copy; {new Date().getFullYear()} Inquestra Technologies Inc. All rights reserved. Electronic Research Notebook &amp; Hardware DAQ for Biomedical Engineering.
          </p>
        </div>
      </footer>
    </div>
  );
}
