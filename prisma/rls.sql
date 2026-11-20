-- prisma/rls.sql
-- Inquestra: PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation
-- Supporting GLP reproducibility standards and tamper-evident audit trails.
-- Safe to execute idempotently in the Supabase SQL Editor.

-- ==============================================================================
-- 1. CLEANUP ORPHAN / INSECURE FUNCTIONS
-- ==============================================================================

-- Revoke public execution from rls_auto_enable if it exists in public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
  END IF;
END $$;

-- ==============================================================================
-- 2. PRIVATE SCHEMA & TENANT ISOLATION HELPER
-- ==============================================================================

-- Moving helper to a private schema prevents it from being exposed on PostgREST /rest/v1/rpc
CREATE SCHEMA IF NOT EXISTS internal;
GRANT USAGE ON SCHEMA internal TO authenticated, anon;

CREATE OR REPLACE FUNCTION internal.current_user_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "organizationId" FROM "User" WHERE "authId" = (select auth.uid())::text LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION internal.current_user_org_id() TO authenticated, anon;

-- Remove legacy public function to clear Supabase security linter warnings
DROP FUNCTION IF EXISTS public.current_user_org_id() CASCADE;

-- ==============================================================================
-- 3. ENABLE ROW-LEVEL SECURITY ON ALL APPLICATION TABLES
-- ==============================================================================

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProtocolTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialRevision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetadataEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TelemetryStream" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StorageLocation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialInventory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialEquipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Signature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. ORGANIZATION POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "org_member_read" ON "Organization";
CREATE POLICY "org_member_read" ON "Organization"
FOR SELECT USING (
  id = internal.current_user_org_id()
);

-- ==============================================================================
-- 5. USER & TEAM POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "user_tenant_read" ON "User";
DROP POLICY IF EXISTS "user_select_own_or_org" ON "User";
CREATE POLICY "user_tenant_read" ON "User"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "team_tenant_all" ON "Team";
CREATE POLICY "team_tenant_all" ON "Team"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

-- ==============================================================================
-- 6. PROJECT & PROTOCOL TEMPLATE POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "project_tenant_all" ON "Project";
CREATE POLICY "project_tenant_all" ON "Project"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "protocol_tenant_all" ON "ProtocolTemplate";
CREATE POLICY "protocol_tenant_all" ON "ProtocolTemplate"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

-- ==============================================================================
-- 7. TRIAL & RESEARCH NOTEBOOK POLICIES (MUTUALLY EXCLUSIVE ACTIONS)
-- ==============================================================================

-- Drop all old policies to avoid multiple permissive policies on SELECT
DROP POLICY IF EXISTS "trial_tenant_select" ON "Trial";
DROP POLICY IF EXISTS "trial_select_tenant_isolation" ON "Trial";
DROP POLICY IF EXISTS "trial_author_mutation" ON "Trial";
DROP POLICY IF EXISTS "trial_mutation_author_only" ON "Trial";
DROP POLICY IF EXISTS "trial_author_insert" ON "Trial";
DROP POLICY IF EXISTS "trial_author_update" ON "Trial";
DROP POLICY IF EXISTS "trial_author_delete" ON "Trial";

-- Exactly ONE policy for SELECT
CREATE POLICY "trial_tenant_select" ON "Trial"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Project" p
    WHERE p.id = "Trial"."projectId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

-- Exactly ONE policy for INSERT
CREATE POLICY "trial_author_insert" ON "Trial"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND u.id = "Trial"."userId"
    AND u."organizationId" = internal.current_user_org_id()
  )
);

-- Exactly ONE policy for UPDATE
CREATE POLICY "trial_author_update" ON "Trial"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND u.id = "Trial"."userId"
    AND u."organizationId" = internal.current_user_org_id()
  )
);

-- Exactly ONE policy for DELETE
CREATE POLICY "trial_author_delete" ON "Trial"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND u.id = "Trial"."userId"
    AND u."organizationId" = internal.current_user_org_id()
  )
);

-- ==============================================================================
-- 8. METADATA, TELEMETRY & REVISION POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "metadata_via_trial" ON "MetadataEntry";
DROP POLICY IF EXISTS "metadata_select_via_trial" ON "MetadataEntry";
DROP POLICY IF EXISTS "metadata_mutation_via_trial" ON "MetadataEntry";

CREATE POLICY "metadata_via_trial" ON "MetadataEntry"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

DROP POLICY IF EXISTS "telemetry_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_select_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_mutation_via_trial" ON "TelemetryStream";

CREATE POLICY "telemetry_via_trial" ON "TelemetryStream"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TelemetryStream"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

DROP POLICY IF EXISTS "revision_via_trial" ON "TrialRevision";
CREATE POLICY "revision_via_trial" ON "TrialRevision"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialRevision"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

-- ==============================================================================
-- 9. LIMS INVENTORY, STORAGE & EQUIPMENT POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "storage_tenant_all" ON "StorageLocation";
CREATE POLICY "storage_tenant_all" ON "StorageLocation"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "inventory_tenant_all" ON "InventoryItem";
CREATE POLICY "inventory_tenant_all" ON "InventoryItem"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "equipment_tenant_all" ON "Equipment";
CREATE POLICY "equipment_tenant_all" ON "Equipment"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "trial_inventory_join_all" ON "TrialInventory";
CREATE POLICY "trial_inventory_join_all" ON "TrialInventory"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialInventory"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

DROP POLICY IF EXISTS "trial_equipment_join_all" ON "TrialEquipment";
CREATE POLICY "trial_equipment_join_all" ON "TrialEquipment"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialEquipment"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

-- ==============================================================================
-- 10. COMPLIANCE: IMMUTABLE AUDIT LOG & ELECTRONIC SIGNATURES
-- ==============================================================================

-- Electronic Signatures: Viewable by org members; Insertable by signer; NEVER updatable or deletable!
DROP POLICY IF EXISTS "signature_org_select" ON "Signature";
CREATE POLICY "signature_org_select" ON "Signature"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "Signature"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);

DROP POLICY IF EXISTS "signature_insert_own" ON "Signature";
CREATE POLICY "signature_insert_own" ON "Signature"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = "Signature"."userId"
    AND u."authId" = (select auth.uid())::text
    AND u."organizationId" = internal.current_user_org_id()
  )
);

-- AuditLog: Append-only ledger; Never editable or deletable!
DROP POLICY IF EXISTS "audit_log_tenant_select" ON "AuditLog";
CREATE POLICY "audit_log_tenant_select" ON "AuditLog"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "audit_log_tenant_insert" ON "AuditLog";
CREATE POLICY "audit_log_tenant_insert" ON "AuditLog"
FOR INSERT WITH CHECK (
  "organizationId" = internal.current_user_org_id()
);
