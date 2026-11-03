# Inquestra ELN

A reproducible, real-time Electronic Lab Notebook and bench data acquisition workspace for wet-lab and engineering research.

## Language

**Trial**:
A single experimental run containing timestamped observations, notes, attached data, and linked protocols.
_Avoid_: Experiment, run, session, doc

**Protocol**:
A structured, sequential bench procedure embedded within a Trial that provides interactive step countdown timers and checkpoints.
_Avoid_: Recipe, procedure, workflow, SOP

**Local Notebook**:
A private notebook saved directly in your browser's local storage that works immediately without an account.
_Avoid_: Sandbox, playground, demo, guest session

**Cloud Notebook**:
A notebook backed by remote storage and database sync for cross-device access and team sharing.
_Avoid_: Account workspace, profile space, enterprise environment

## Design & Color Tokens

Inquestra follows the visual grammar of precision laboratory instrumentation (Benchling, Keysight DAQ, Dotmatics, LabArchives):
- **Monochrome Console Primary**: Hardware actuation buttons (`Connect USB Device`, `Confirm Signature`) use high-contrast console slate (`bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 border border-neutral-700/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]`) with tactile bevels.
- **P31 Phosphor Green (`#10b981`)**: Real 525nm oscilloscope CRT phosphor for live DAQ waveforms, sparklines, and active hardware streaming status.
- **Biochemical Emerald (`#059669` / `#10b981`)**: Dedicated chemical reagent tags, deduction logs, and LIMS inventory badges.
- **Instrument Telemetry Sky (`#0284c7` / `#38bdf8`)**: DAQ telemetry rates, active timers, and virtual signal generators.
- _Forbidden_: Generic AI purple (`indigo-600`, `violet-500`, `#6366f1`) and AI sparkle clichés (`<Sparkles />`).

## Relationships

- A **Trial** belongs to either a **Local Notebook** or a **Cloud Notebook**
- A **Trial** embeds zero or more **Protocols**
- A **Local Notebook** can be saved into a **Cloud Notebook** at any time

## Example dialogue

> **Researcher:** "Do I have to register before I can write down my protocol?"
> **Dev:** "No, you're already in your **Local Notebook** — everything saves right in your browser until you choose to back it up."

## Flagged ambiguities

- "Sandbox" was previously used to describe the unauthenticated mode — resolved: replaced with **Local Notebook** to use plain, natural laboratory terminology instead of developer jargon.
- AI purple / violet gradients — resolved: replaced with bench instrumentation console styling, P31 phosphor green, and clinical emerald.
