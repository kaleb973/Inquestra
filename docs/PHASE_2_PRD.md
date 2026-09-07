# Product Requirements Document (PRD)
## Inquestra — Phase 2: Supabase Auth, PostgreSQL RLS & Cloud Persistence

**Project:** Inquestra (`inquestra.org`)  
**Phase:** 2 of 4  
**Target Milestone:** Multi-Tenant Cloud Architecture, Database Schema, and Server Actions  
**Audience:** Solo Developer / Antigravity CLI / AI Pair Programmer  
**Status:** Ready for Execution  

---

## 1. Executive Summary & Objectives

Phase 2 transitions Inquestra from an ephemeral local-first prototype (Phase 1) to a secure, enterprise-grade, multi-tenant cloud-persisted SaaS. 

### Core Deliverables
1. **Relational Database Schema (Prisma ORM):** Definitive data models mapping Organizations, Users, Projects, Trials, Metadata, and Telemetry Streams.
2. **PostgreSQL Row-Level Security (RLS):** Database-level security policies isolating university departments and commercial labs.
3. **Next.js Server Actions + Zod Validation:** Edge runtime validation guaranteeing payload integrity before reaching PostgreSQL.
4. **Supabase Authentication:** Secure session management, role-based access control (RBAC), and route protection.
5. **State Synchronization:** Bi-directional sync between the local Zustand editor canvas and cloud persistence.

---

## 2. Technical Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend & ORM** | Prisma ORM + PostgreSQL | Type-safe queries, relational schema migrations, and client generation. |
| **Database Host** | Supabase PostgreSQL | Managed Postgres with native Auth and Row-Level Security (RLS). |
| **Edge Acceleration** | Cloudflare Hyperdrive | Connection pooling and edge caching for low-latency database queries. |
| **Validation** | Zod (v3+) | Runtime schema enforcement at Next.js Server Action boundaries. |
| **Authentication** | Supabase Auth (`@supabase/ssr`) | PKCE authentication flow with SSR cookie handling in Next.js App Router. |

---

## 3. Relational Database Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Organization {
  id        String    @id @default(uuid())
  name      String
  domain    String?   @unique
  users     User[]
  projects  Project[]
  createdAt DateTime  @default(now())
}

model User {
  id             String       @id @default(uuid())
  authId         String       @unique // Maps to Supabase auth.users.id
  email          String       @unique
  role           Role         @default(RESEARCHER)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  trials         Trial[]
  createdAt      DateTime     @default(now())
}

model Project {
  id             String       @id @default(uuid())
  name           String
  description    String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  trials         Trial[]
  createdAt      DateTime     @default(now())
}

model Trial {
  id         String            @id @default(uuid())
  title      String
  content    Json              // TipTap ProseMirror JSON tree
  status     TrialStatus       @default(DRAFT)
  projectId  String
  project    Project           @relation(fields: [projectId], references: [id])
  userId     String
  author     User              @relation(fields: [userId], references: [id])
  metadata   MetadataEntry[]
  telemetry  TelemetryStream[]
  checksum   String?           @unique // SHA-256 cryptographic seal
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  @@index([projectId])
  @@index([status])
}

model MetadataEntry {
  id      String @id @default(uuid())
  key     String
  value   String
  trialId String
  trial   Trial  @relation(fields: [trialId], references: [id], onDelete: Cascade)

  @@index([trialId])
}

model TelemetryStream {
  id          String   @id @default(uuid())
  sensorType  String   // e.g., "ESP32_THERMISTOR"
  fileUrl     String   // Cloudflare R2 / S3 signed pointer
  rowCount    Int
  trialId     String
  trial       Trial    @relation(fields: [trialId], references: [id], onDelete: Cascade)
  recordedAt  DateTime @default(now())

  @@index([trialId])
}

enum Role {
  ADMIN
  PI
  RESEARCHER
  VIEWER
}

enum TrialStatus {
  DRAFT
  ACTIVE
  COMPLETED
  FAILED
}
```

---

## 4. Row-Level Security (RLS) Policies

All tables must enforce strict tenant isolation at the PostgreSQL level:

```sql
-- Enable RLS on Trials table
ALTER TABLE "Trial" ENABLE ROW LEVEL SECURITY;

-- Allow SELECT only to users in the same organization
CREATE POLICY "Tenant isolation for Trial SELECT"
ON "Trial"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = auth.uid()
    AND u."organizationId" = (
      SELECT p."organizationId" FROM "Project" p WHERE p.id = "Trial"."projectId"
    )
  )
);

-- Allow INSERT / UPDATE only if the user is the author and belongs to the organization
CREATE POLICY "Tenant isolation for Trial MUTATION"
ON "Trial"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = auth.uid()
    AND u.id = "Trial"."userId"
  )
);
```

---

## 5. Next.js Server Actions & Zod Contracts

### `src/actions/trialActions.ts`
```typescript
"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const TrialPayloadSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.record(z.any()), // TipTap JSON
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "FAILED"]),
  projectId: z.string().uuid(),
  metadata: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional()
});

export async function saveTrialData(
  payload: z.infer<typeof TrialPayloadSchema>,
  userId: string
) {
  const validatedData = TrialPayloadSchema.parse(payload);

  try {
    const trial = await prisma.trial.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        status: validatedData.status,
        projectId: validatedData.projectId,
        userId: userId,
        metadata: {
          create: validatedData.metadata || []
        }
      }
    });

    revalidatePath(`/projects/${validatedData.projectId}`);
    return { success: true, trialId: trial.id };
  } catch (error) {
    console.error("Database mutation failed:", error);
    throw new Error("Failed to persist trial data.");
  }
}
```

---

## 6. Implementation Checklist

- [ ] Initialize Supabase project & obtain `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Install Prisma (`npm i -D prisma` and `npm i @prisma/client`).
- [ ] Deploy schema with `npx prisma db push` or migrations.
- [ ] Configure Supabase Auth middleware (`src/middleware.ts`) to guard `/projects/*` routes.
- [ ] Implement Auth UI (`/login`, `/signup`) using Tailwind + Shadcn.
- [ ] Bind Zustand store (`useNotebookStore`) to trigger `saveTrialData` on user save action.
