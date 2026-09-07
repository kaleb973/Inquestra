'use server';
// src/actions/storageActions.ts
// Phase 3 — Cloudflare R2 presigned URL generation for direct browser-to-bucket upload.
// Bypasses Vercel serverless completely — zero egress fees.

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Returns a 1-hour presigned PUT URL for the browser to upload directly to R2.
 * Also returns the fileKey for creating the TelemetryStream record on completion.
 */
export async function getTelemetryUploadUrl(trialId: string, filename: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const fileKey = `trials/${trialId}/${randomUUID()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
    ContentType: 'text/csv',
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  return { uploadUrl, fileKey };
}

/**
 * Called by the client after a successful R2 upload.
 * Creates an immutable TelemetryStream provenance record in PostgreSQL.
 */
export async function recordTelemetryStream(
  trialId: string,
  fileKey: string,
  rowCount: number,
  sensorType: string = 'CSV_IMPORT'
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const fileUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileKey}`;

  const stream = await prisma.telemetryStream.create({
    data: {
      trialId,
      fileUrl,
      rowCount,
      sensorType,
    },
  });

  return { success: true, streamId: stream.id };
}
