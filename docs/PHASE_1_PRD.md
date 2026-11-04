# Product Requirements Document (PRD)
## Inquestra — Phase 1: Local-First Core & Web Serial DAQ Proof-of-Concept

**Project:** Inquestra (`inquestra.org`)  
**Phase:** 1 of 4  
**Target Milestone:** Local-First Core & Web Serial Hardware DAQ Proof-of-Concept  
**Audience:** Solo Developer / Antigravity CLI Autonomous Agent  
**Status:** Ready for Execution  

---

## 1. Executive Summary & Objectives

The primary goal of Phase 1 is to establish the foundational, local-first reactive canvas for **Inquestra** and validate real-time hardware telemetry ingestion without the overhead of cloud databases or authentication. 

### Core Deliverables
1. **Responsive 3-Column Enterprise Workspace:** Professional dark-mode UI (Left Navigation/Hardware Control, Center TipTap v3 Canvas, Right Telemetry & Metadata Drawer).
2. **TipTap v3 Block-Based Editor:** Clean WYSIWYG note-taking canvas supporting markdown shortcuts, slash commands, and custom React NodeViews.
3. **Web Serial DAQ Integration (`navigator.serial`):** Direct-to-browser USB/Bluetooth microcontroller (ESP32/Arduino) connection loop reading high-speed telemetry (115200 baud) via `TextDecoderStream`.
4. **Zustand High-Frequency State Store:** Granular, transient state manager buffering incoming sensor readings without triggering full-canvas re-renders.
5. **Inline Interactive Chart Node:** Custom TipTap NodeView rendering live, zoomable Recharts graphs directly inline with experimental text notes.
6. **Telemetry Simulator:** Synthetic data generator for rapid offline development and automated testing without requiring a physical microcontroller.

---

## 2. Technical Stack & Dependencies

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Framework** | Next.js 15+ (App Router) | High-performance React 19 architecture, colocation of client and future server code. |
| **Language** | TypeScript (Strict Mode) | Strict typing across hardware packets, preventing runtime crashes in high-frequency research data. |
| **Styling** | Tailwind CSS + Lucide Icons | Clean, high-density enterprise laboratory aesthetic; dark mode standard. |
| **State Management** | Zustand (`useNotebookStore`) | Decoupled atomic subscriptions preventing TipTap re-render lag during high-frequency streaming. |
| **Editor Canvas** | TipTap v3 (`@tiptap/react`, `@tiptap/pm`) | Headless ProseMirror-powered block editor supporting custom React NodeViews. |
| **Visualizations** | Recharts | Responsive, interactive SVG/Canvas charting with zoom and tooltip capabilities. |
| **Hardware I/O** | Native Web Serial API (`navigator.serial`) | Zero-driver, zero-middleware direct browser-to-USB communication. |

---

## 3. UI/UX Layout Architecture (3-Column Grid)

```
+---------------------------------------------------------------------------------------+
|  TOP NAVIGATION BAR: Workspace Title | Trial Status Indicator | Connect Hardware Button  |
+----------------------+----------------------------------------+-----------------------+
| LEFT PANEL (260px)   | CENTER CANVAS (Flexible Flex-1)        | RIGHT DRAWER (320px)  |
| - Project Switcher   | - Document Title & Timestamp           | - Live DAQ Telemetry  |
| - Trial List         | - TipTap v3 WYSIWYG Editor Canvas      |   * Buffer Count      |
| - Hardware Controls  | - Inline [InteractiveChartNode]        |   * Packet Rate (Hz)  |
|   * Port Status      | - Slash Command Menu (`/reagent`, etc.)|   * Min/Max/Current   |
|   * Baud Selector    | - Local Auto-Save Indicator            | - Metadata Key-Values |
| - Synthetic Sim Mode |                                        | - NIH FAIR Tags       |
+----------------------+----------------------------------------+-----------------------+
```

---

## 4. Functional Specifications

### 4.1 Feature 1: High-Frequency Telemetry Store (`useNotebookStore.ts`)
- **State Properties:**
  - `activeTrial`: Id, title, content (TipTap JSON), status (`DRAFT`, `ACTIVE`, `COMPLETED`), createdAt, updatedAt.
  - `telemetryBuffer`: Circular or windowed array of `{ timestamp: number, value: number, channel?: string }`.
  - `hardwareStatus`: `{ isConnected: boolean, portName: string | null, baudRate: number, packetsPerSec: number, totalBytes: number }`.
  - `metadata`: Array of `{ id: string, key: string, value: string }`.
- **Key Actions:**
  - `appendTelemetry(point: TelemetrySample | TelemetrySample[])`: Buffers incoming data points with rate-limiting or slice cap (default: 500 recent points in live window).
  - `updateContent(json: Record<string, any>)`: Updates TipTap document tree with debounced local-storage persistence.
  - `setHardwareStatus(status: Partial<HardwareStatus>)`: Updates connection telemetry indicators.

### 4.2 Feature 2: Web Serial Hook (`useWebSerial.ts`)
- Implements `navigator.serial.requestPort()` and `port.open({ baudRate })`.
- Handles `port.readable` stream with `TextDecoderStream` and line break delimiter parsing (`\n`).
- Employs **Bring Your Own Buffer (BYOB)** patterns or bounded Uint8Array chunk reading to guarantee zero memory leaks during continuous 24-hour trials.
- Implements graceful disconnect detection and cancellation handles on component unmount.
- Includes a **Simulated Hardware Mode** emitting realistic sine/sensor waveforms (e.g. 37.0°C ± 0.5°C thermistor simulation) for instant demoing.

### 4.3 Feature 3: TipTap v3 Interactive Canvas (`EditorCanvas.tsx`)
- Configured with `@tiptap/starter-kit`.
- Custom Slash Command menu (`/`) for inserting:
  - `/chart` - Embeds an empty or live-bound telemetry chart node.
  - `/table` - Inserts structured data table.
  - `/timer` - Inserts protocol incubation timer widget.
  - `/heading` - H1, H2, H3 headers.
- Auto-saves to browser `localStorage` on change (debounced at 500ms).

### 4.4 Feature 4: Interactive Chart NodeView (`InteractiveChartNode.tsx`)
- TipTap React NodeView extension.
- Renders Recharts `<LineChart />` or `<AreaChart />`.
- Live mode: Binds directly to `useNotebookStore.getState().telemetryBuffer` via requestAnimationFrame or 100ms throttle, rendering smooth 60 FPS streaming without editor input lag.
- Controls: Pause stream, clear buffer, toggle channel visibility, download CSV snapshot.

---

## 5. TypeScript Data Contracts

```typescript
// types/inquestra.ts

export type TrialStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "FAILED";

export interface TelemetrySample {
  timestamp: number;
  value: number;
  sensorId?: string;
  unit?: string;
}

export interface HardwareStatus {
  isConnected: boolean;
  portName: string | null;
  baudRate: number;
  packetsPerSec: number;
  totalBytes: number;
  isSimulated: boolean;
}

export interface MetadataEntry {
  id: string;
  key: string;
  value: string;
}

export interface TrialDocument {
  id: string;
  title: string;
  content: Record<string, unknown>; // TipTap ProseMirror JSON
  status: TrialStatus;
  metadata: MetadataEntry[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Execution Plan & File Structure

```
Inquestra/
├── src/
│   ├── app/
│   │   ├── globals.css          # Dark-mode enterprise Tailwind styles
│   │   ├── layout.tsx           # Global layout & metadata
│   │   └── page.tsx             # 3-Column main DAQ workspace
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── EditorCanvas.tsx # TipTap v3 editor container
│   │   │   └── SlashMenu.tsx    # Command popup menu
│   │   ├── editor/
│   │   │   └── nodes/
│   │   │       └── InteractiveChartNode.tsx # Recharts TipTap NodeView
│   │   ├── hardware/
│   │   │   ├── SerialControlPanel.tsx       # Hardware connection modal/controls
│   │   │   └── TelemetryMonitor.tsx         # Live rate/buffer status cards
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Top bar with trial status and quick actions
│   │   │   ├── LeftSidebar.tsx  # Projects and trials navigation
│   │   │   └── RightDrawer.tsx  # Telemetry stream details and metadata
│   ├── hooks/
│   │   ├── useWebSerial.ts      # navigator.serial lifecycle & buffer parser
│   │   └── useTelemetrySim.ts   # Offline mock data generator
│   ├── store/
│   │   └── useNotebookStore.ts  # Zustand reactive state store
│   └── types/
│       └── inquestra.ts         # Strictly-typed data contracts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 7. Quality & Verification Protocol

1. **Type Strictness:** `npm run build` / `tsc --noEmit` must pass with zero warnings and no usage of `any`.
2. **Serial Stress Test:** Verify continuous ingestion at 115200 baud for 10 minutes without memory growth exceeding 50 MB.
3. **Editor Performance:** Typing responsiveness in TipTap must remain < 16ms latency while telemetry charts update simultaneously.
4. **Offline Persistence:** Page reload must restore the active trial document and metadata entries from `localStorage`.
