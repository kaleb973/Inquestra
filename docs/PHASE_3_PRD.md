# Product Requirements Document (PRD)
## Inquestra — Phase 3: Smart CSV Charting & Cloudflare R2 Storage Pipelines

**Project:** Inquestra (`inquestra.org`)  
**Phase:** 3 of 4  
**Target Milestone:** Direct-to-Cloud Telemetry Ingestion, Drag-and-Drop CSV Parser, and Inline TipTap Chart NodeViews  
**Audience:** Solo Developer / Antigravity CLI / AI Pair Programmer  
**Status:** Ready for Execution  

---

## 1. Executive Summary & Objectives

Scientific experimental trials produce massive data payloads (multi-gigabyte sensor streams, spectrophotometer outputs, chromatography runs). Passing these files through Next.js serverless functions exhausts memory and triggers function timeouts.

Phase 3 resolves the throughput bottleneck by implementing:
1. **Direct-to-Cloud Storage (Cloudflare R2):** Bypasses Vercel servers completely with zero egress costs.
2. **Smart CSV Ingestion Engine:** Drag-and-drop file interception directly on the TipTap canvas.
3. **Interactive TipTap NodeView:** Injects responsive, zoomable Recharts graphs inline with scientific notes.
4. **Asynchronous Provenance Webhooks:** Links persisted R2 objects with `TelemetryStream` records in PostgreSQL.

---

## 2. Technical Stack & Dependencies

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Object Storage** | Cloudflare R2 (`@aws-sdk/client-s3`) | S3-compatible, high-throughput storage with **$0 egress fees**. |
| **CSV Parser** | PapaParse (`papaparse`) | High-speed, streaming client-side CSV parsing. |
| **Rich Text Nodes** | TipTap React NodeViews | Mounting dynamic React components inside ProseMirror blocks. |
| **Data Visualization** | Recharts | Interactive, zoomable line and area plots for experimental telemetry. |
| **Upload Pipeline** | Presigned S3 URLs | Direct browser-to-bucket multi-part streaming. |

---

## 3. Direct-to-Cloud Upload Architecture

```
[Browser Client] ──(1) Request Presigned URL──> [Next.js Server Action]
       │                                                 │
       │                                       (Verifies Org Quota)
       │                                                 │
       │ <──(2) Returns Short-Lived PUT URL─────────────┘
       │
       └──(3) Uploads Multi-GB Raw CSV Directly──> [Cloudflare R2 Bucket]
                                                         │
       [PostgreSQL DB] <──(4) Background Webhook Event───┘
     (Creates TelemetryStream)
```

---

## 4. Functional Specifications

### 4.1 Feature 1: Presigned URL Generation (`src/actions/storageActions.ts`)
```typescript
"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getTelemetryUploadUrl(trialId: string, filename: string) {
  const fileKey = `trials/${trialId}/${uuidv4()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
    ContentType: "text/csv",
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  return { uploadUrl, fileKey };
}
```

### 4.2 Feature 2: TipTap `InteractiveChartNode` NodeView
- Custom TipTap Node definition registered with `@tiptap/core`.
- Wrapped with `ReactNodeViewRenderer` to render `<InteractiveChartComponent />`.
- Listens to drag-and-drop events on the canvas:
  - Intercepts dropped `.csv` files.
  - PapaParse streams the first 10,000 rows into memory for preview.
  - Automatically extracts numerical columns (e.g. `Time`, `Temperature_C`, `Voltage_mV`).
  - Renders Recharts line plot with channel toggles, zoom controls, and min/max stats.
  - Dispatches the full raw file to Cloudflare R2 in the background.

### 4.3 Feature 3: Drag-and-Drop Parser Component (`src/lib/csvParser.ts`)
```typescript
import Papa from "papaparse";

export interface ParsedTelemetryData {
  headers: string[];
  rows: Record<string, number | string>[];
  numericKeys: string[];
}

export function parseCSVStream(file: File): Promise<ParsedTelemetryData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, number | string>[];
        const numericKeys = headers.filter((header) =>
          rows.some((row) => typeof row[header] === "number")
        );
        resolve({ headers, rows, numericKeys });
      },
      error: (err) => reject(err),
    });
  });
}
```

---

## 5. Implementation Checklist

- [ ] Configure Cloudflare R2 bucket with CORS policies allowing PUT requests from `inquestra.org` and `localhost:3000`.
- [ ] Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- [ ] Create `InteractiveChartNode.tsx` TipTap extension and register in `EditorCanvas.tsx`.
- [ ] Implement client-side drag-and-drop file drop handler in TipTap.
- [ ] Render dynamic Recharts with multi-channel line selection and interactive brush/zoom.
- [ ] Trigger background `TelemetryStream` record creation in Prisma upon upload completion.
