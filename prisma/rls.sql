-- prisma/rls.sql
-- Inquestra — PostgreSQL Row-Level Security policies (Idempotent)
-- Safe to re-run multiple times in Supabase SQL Editor.

-- ── 1. Enable RLS on all tables ───────────────────────────────────────────────

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetadataEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelemetryStream" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventory" ENABLE ROW LEVEL SECURITY;

-- ── 2. Trial Policies ─────────────────────────────────────────────────────────

-- Clean up existing policies before recreating
DROP POLICY IF EXISTS "trial_select_tenant_isolation" ON "Trial";
DROP POLICY IF EXISTS "trial_mutation_author_only" ON "Trial";

-- SELECT: users can view trials if they belong to the same organization as the project
CREATE POLICY "trial_select_tenant_isolation"
ON "Trial"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = auth.uid()::text
    AND u."organizationId" = (
      SELECT p."organizationId"
      FROM "Project" p
      WHERE p.id = "Trial"."projectId"
    )
  )
);

-- INSERT / UPDATE / DELETE: author can modify their own trials within the org
CREATE POLICY "trial_mutation_author_only"
ON "Trial"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = auth.uid()::text
    AND u.id = "Trial"."userId"
  )
);

-- ── 3. User Policies ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "user_select_own_or_org" ON "User";

-- SELECT: users can view their own profile or peers in the same org
CREATE POLICY "user_select_own_or_org"
ON "User"
FOR SELECT
USING (
  "authId" = auth.uid()::text
  OR "organizationId" = (
    SELECT "organizationId" FROM "User"
    WHERE "authId" = auth.uid()::text
    LIMIT 1
  )
);

-- ── 4. MetadataEntry Policies ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "metadata_select_via_trial" ON "MetadataEntry";
DROP POLICY IF EXISTS "metadata_mutation_via_trial" ON "MetadataEntry";

CREATE POLICY "metadata_select_via_trial"
ON "MetadataEntry"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "User" u ON u.id = t."userId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND u."authId" = auth.uid()::text
  )
);

CREATE POLICY "metadata_mutation_via_trial"
ON "MetadataEntry"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    WHERE t.id = "MetadataEntry"."trialId"
    AND t."userId" = (
      SELECT id FROM "User" WHERE "authId" = auth.uid()::text LIMIT 1
    )
  )
);

-- ── 5. TelemetryStream Policies ───────────────────────────────────────────────

DROP POLICY IF EXISTS "telemetry_select_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_mutation_via_trial" ON "TelemetryStream";

CREATE POLICY "telemetry_select_via_trial"
ON "TelemetryStream"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    JOIN "User" u ON u."organizationId" = p."organizationId"
    WHERE t.id = "TelemetryStream"."trialId"
    AND u."authId" = auth.uid()::text
  )
);

CREATE POLICY "telemetry_mutation_via_trial"
ON "TelemetryStream"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    WHERE t.id = "TelemetryStream"."trialId"
    AND t."userId" = (
      SELECT id FROM "User" WHERE "authId" = auth.uid()::text LIMIT 1
    )
  )
);

-- ── 6. Inventory Policies ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "inventory_org_access" ON "Inventory";

CREATE POLICY "inventory_org_access"
ON "Inventory"
FOR ALL
USING (
  "organizationId" IS NULL
  OR "organizationId" = (
    SELECT "organizationId" FROM "User"
    WHERE "authId" = auth.uid()::text
    LIMIT 1
  )
);
