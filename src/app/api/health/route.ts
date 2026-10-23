// src/app/api/health/route.ts
// Production Liveness & Readiness Probes for Inquestra.
// Based on Section 10 & 12 of Inquestra Distributed Systems Architecture.
//
// Liveness (?type=live): Verifies the Node/Next process is responsive. Never fails on DB drops.
// Readiness (?type=ready): Verifies DB connectivity and connection pool health before routing traffic.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const probeType = searchParams.get('type') || 'live';

  const startTime = Date.now();

  // 1. Liveness Probe (process check)
  if (probeType === 'live') {
    return NextResponse.json(
      {
        status: 'healthy',
        probe: 'liveness',
        uptime: process.uptime(),
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  // 2. Readiness Probe (deep dependency check — Database / Pool)
  try {
    // 3-second timeout race on DB query
    const dbPing = prisma.$queryRaw`SELECT 1`;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out after 3000ms')), 3000)
    );

    await Promise.race([dbPing, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'ready',
        probe: 'readiness',
        database: {
          status: 'connected',
          latencyMs,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database ping failed';
    const latencyMs = Date.now() - startTime;

    console.error('[health-check] Readiness probe failed:', message);

    return NextResponse.json(
      {
        status: 'degraded',
        probe: 'readiness',
        database: {
          status: 'disconnected',
          error: message,
          latencyMs,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
