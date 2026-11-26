'use server';
// src/actions/storageActions.ts
// Cloudflare R2 presigned URL generation for direct browser-to-bucket upload.
// Bypasses Vercel serverless completely — zero egress fees.
// Enforces tenant isolation, cryptographic immutability, and CWE-1236/XSS protection.

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
 * Validates that the authenticated user belongs to the organization that owns the trial.
 */
async function verifyTrialAccess(authId: string, trialId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { authId },
    select: { id: true, organizationId: true, role: true },
  });
  if (!dbUser) throw new Error('User record not found');

  const trial = await prisma.trial.findFirst({
    where: {
      id: trialId,
      project: {
        organizationId: dbUser.organizationId,
      },
    },
    select: { id: true, status: true, checksum: true },
  });
  if (!trial) throw new Error('Trial not found or access denied');

  return { dbUser, trial };
}

/**
 * Returns a 1-hour presigned PUT URL for the browser to upload directly to R2.
 * Enforces tenant verification, role check, immutability, file extension whitelist, and attachment disposition.
 */
export async function getTelemetryUploadUrl(trialId: string, filename: string, fileSize?: number) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  // Tenant isolation, role guard & trial immutability check
  const { dbUser, trial } = await verifyTrialAccess(user.id, trialId);
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot upload telemetry files.');
  }
  if (trial.status === 'COMPLETED' || trial.checksum !== null) {
    throw new Error('Immutable Record: Cannot upload telemetry to a completed or sealed trial.');
  }

  // Security: Check file size (max 50MB)
  if (fileSize !== undefined) {
    if (typeof fileSize !== 'number' || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 50 * 1024 * 1024) {
      throw new Error('File size exceeds the 50MB limit or is invalid.');
    }
  }

  // Security: Validate file type to prevent execution and check against double extensions
  const allowedExtensions = ['.csv', '.txt', '.json'];
  const lowerFilename = filename.toLowerCase().trim();

  // Guard against dangerous executable extensions anywhere in the filename (e.g. payload.php.csv)
  const DANGEROUS_EXTENSIONS_REGEX = /\.(php|phtml|php3|php4|php5|phps|exe|sh|bash|bat|cmd|com|vbs|js|mjs|cjs|jar|war|py|pyc|rb|pl|cgi|asp|aspx|jsp|dll|so|wasm)(\.|$)/i;
  if (DANGEROUS_EXTENSIONS_REGEX.test(lowerFilename)) {
    throw new Error('Security Alert: Prohibited file type or double extension detected.');
  }

  const matchedExt = allowedExtensions.find((ext) => lowerFilename.endsWith(ext));
  if (!matchedExt) {
    throw new Error('Invalid file type. Only CSV, TXT, and JSON are allowed.');
  }

  const contentType =
    matchedExt === '.json'
      ? 'application/json'
      : matchedExt === '.txt'
      ? 'text/plain'
      : 'text/csv';

  // Server-generated random filename prevents path traversal and polyglot execution
  const serverGeneratedFilename = `${randomUUID()}${matchedExt}`;
  const fileKey = `trials/${trialId}/${serverGeneratedFilename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
    ContentDisposition: `attachment; filename="${serverGeneratedFilename}"`,
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
  if (typeof rowCount !== 'number' || !Number.isFinite(rowCount) || !Number.isInteger(rowCount) || rowCount < 0) {
    throw new Error('Invalid row count. Must be a non-negative integer.');
  }
  const cleanSensorType = sensorType.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 50) || 'CSV_IMPORT';
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  // Verify tenant ownership, role, and sealed-trial immutability
  const { dbUser, trial } = await verifyTrialAccess(user.id, trialId);
  if (dbUser.role === 'VIEWER') {
    throw new Error('Permission denied: viewers cannot attach telemetry records.');
  }
  if (trial.status === 'COMPLETED' || trial.checksum !== null) {
    throw new Error('Immutable Record: Cannot attach telemetry streams to a completed or sealed trial.');
  }

  // Prevent linking foreign, path-traversal, or arbitrary object keys
  const escapedTrialId = trialId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const strictKeyRegex = new RegExp(`^trials/${escapedTrialId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(csv|txt|json)$`, 'i');
  if (!strictKeyRegex.test(fileKey)) {
    throw new Error('Invalid file key format for this trial.');
  }

  const fileUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${fileKey}`;

  const [stream] = await prisma.$transaction([
    prisma.telemetryStream.create({
      data: {
        trialId,
        fileUrl,
        rowCount,
        sensorType: cleanSensorType,
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TELEMETRY_STREAM_RECORDED',
        entityType: 'Trial',
        entityId: trialId,
        details: { fileKey, rowCount, sensorType: cleanSensorType },
      },
    }),
  ]);

  return { success: true, streamId: stream.id };
}

/**
 * Returns a short-lived (15-min) presigned GET URL for private, authenticated telemetry downloads.
 */
export async function getTelemetryDownloadUrl(streamId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { organizationId: true },
  });
  if (!dbUser) throw new Error('User record not found');

  const stream = await prisma.telemetryStream.findFirst({
    where: {
      id: streamId,
      trial: {
        project: {
          organizationId: dbUser.organizationId,
        },
      },
    },
  });
  if (!stream) throw new Error('Telemetry stream not found or access denied');

  const fileKey = stream.fileUrl.includes('trials/')
    ? stream.fileUrl.substring(stream.fileUrl.indexOf('trials/'))
    : stream.fileUrl;

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

  return { downloadUrl };
}
