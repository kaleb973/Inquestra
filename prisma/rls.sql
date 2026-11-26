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

CREATE OR REPLACE FUNCTION internal.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "role"::text FROM "User" WHERE "authId" = (select auth.uid())::text LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION internal.is_admin_or_pi()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE "authId" = (select auth.uid())::text
      AND "role" IN ('PI', 'ADMIN')
  );
$$;

REVOKE ALL ON FUNCTION internal.current_user_org_id() FROM anon, public;
REVOKE ALL ON FUNCTION internal.current_user_role() FROM anon, public;
REVOKE ALL ON FUNCTION internal.is_admin_or_pi() FROM anon, public;
GRANT EXECUTE ON FUNCTION internal.current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION internal.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION internal.is_admin_or_pi() TO authenticated;

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
ALTER TABLE "ResearchPaper" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrialPaper" ENABLE ROW LEVEL SECURITY;
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
DROP POLICY IF EXISTS "team_tenant_select" ON "Team";
DROP POLICY IF EXISTS "team_admin_mutation" ON "Team";
CREATE POLICY "team_tenant_select" ON "Team"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "team_admin_mutation" ON "Team"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
);

-- ==============================================================================
-- 6. PROJECT & PROTOCOL TEMPLATE POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "project_tenant_all" ON "Project";
DROP POLICY IF EXISTS "project_tenant_select" ON "Project";
DROP POLICY IF EXISTS "project_admin_mutation" ON "Project";
CREATE POLICY "project_tenant_select" ON "Project"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "project_admin_mutation" ON "Project"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
);

DROP POLICY IF EXISTS "protocol_tenant_all" ON "ProtocolTemplate";
DROP POLICY IF EXISTS "protocol_tenant_select" ON "ProtocolTemplate";
DROP POLICY IF EXISTS "protocol_researcher_insert" ON "ProtocolTemplate";
DROP POLICY IF EXISTS "protocol_researcher_update" ON "ProtocolTemplate";
DROP POLICY IF EXISTS "protocol_admin_delete" ON "ProtocolTemplate";
CREATE POLICY "protocol_tenant_select" ON "ProtocolTemplate"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "protocol_researcher_insert" ON "ProtocolTemplate"
FOR INSERT WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
);
CREATE POLICY "protocol_researcher_update" ON "ProtocolTemplate"
FOR UPDATE USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
);
CREATE POLICY "protocol_admin_delete" ON "ProtocolTemplate"
FOR DELETE USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
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

-- Exactly ONE policy for INSERT (VIEWER blocked)
CREATE POLICY "trial_author_insert" ON "Trial"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND u.id = "Trial"."userId"
    AND u."organizationId" = internal.current_user_org_id()
    AND u."role" IN ('PI', 'ADMIN', 'RESEARCHER')
  )
);

-- Exactly ONE policy for UPDATE (unsealed records only; VIEWER blocked)
CREATE POLICY "trial_author_update" ON "Trial"
FOR UPDATE USING (
  "Trial"."checksum" IS NULL
  AND "Trial"."status" <> 'COMPLETED'
  AND EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND (u.id = "Trial"."userId" OR u."role" IN ('PI', 'ADMIN'))
    AND u."organizationId" = internal.current_user_org_id()
    AND u."role" IN ('PI', 'ADMIN', 'RESEARCHER')
  )
);

-- Exactly ONE policy for DELETE (unsealed records only; VIEWER blocked)
CREATE POLICY "trial_author_delete" ON "Trial"
FOR DELETE USING (
  "Trial"."checksum" IS NULL
  AND "Trial"."status" <> 'COMPLETED'
  AND EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = (select auth.uid())::text
    AND (u.id = "Trial"."userId" OR u."role" IN ('PI', 'ADMIN'))
    AND u."organizationId" = internal.current_user_org_id()
    AND u."role" IN ('PI', 'ADMIN', 'RESEARCHER')
  )
);

-- ==============================================================================
-- 8. METADATA, TELEMETRY & REVISION POLICIES (APPEND-ONLY & IMMUTABILITY)
-- ==============================================================================

DROP POLICY IF EXISTS "metadata_via_trial" ON "MetadataEntry";
DROP POLICY IF EXISTS "metadata_select_via_trial" ON "MetadataEntry";
DROP POLICY IF EXISTS "metadata_mutation_via_trial" ON "MetadataEntry";

CREATE POLICY "metadata_select_via_trial" ON "MetadataEntry"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "metadata_mutation_via_trial" ON "MetadataEntry"
FOR ALL USING (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
) WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
);

DROP POLICY IF EXISTS "telemetry_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_select_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_mutation_via_trial" ON "TelemetryStream";
DROP POLICY IF EXISTS "telemetry_append_via_trial" ON "TelemetryStream";

-- Append-only: telemetry streams cannot be altered or deleted once recorded
CREATE POLICY "telemetry_select_via_trial" ON "TelemetryStream"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TelemetryStream"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "telemetry_append_via_trial" ON "TelemetryStream"
FOR INSERT WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TelemetryStream"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
    AND t."status" <> 'COMPLETED'
  )
);

DROP POLICY IF EXISTS "revision_via_trial" ON "TrialRevision";
DROP POLICY IF EXISTS "revision_select_via_trial" ON "TrialRevision";
DROP POLICY IF EXISTS "revision_append_via_trial" ON "TrialRevision";

-- Append-only: historical revisions are never overwritten or deleted
CREATE POLICY "revision_select_via_trial" ON "TrialRevision"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialRevision"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "revision_append_via_trial" ON "TrialRevision"
FOR INSERT WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
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
DROP POLICY IF EXISTS "storage_tenant_select" ON "StorageLocation";
DROP POLICY IF EXISTS "storage_admin_mutation" ON "StorageLocation";
CREATE POLICY "storage_tenant_select" ON "StorageLocation"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "storage_admin_mutation" ON "StorageLocation"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
);

DROP POLICY IF EXISTS "inventory_tenant_all" ON "InventoryItem";
DROP POLICY IF EXISTS "inventory_tenant_select" ON "InventoryItem";
DROP POLICY IF EXISTS "inventory_admin_mutation" ON "InventoryItem";
CREATE POLICY "inventory_tenant_select" ON "InventoryItem"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "inventory_admin_mutation" ON "InventoryItem"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
);

DROP POLICY IF EXISTS "equipment_tenant_all" ON "Equipment";
DROP POLICY IF EXISTS "equipment_tenant_select" ON "Equipment";
DROP POLICY IF EXISTS "equipment_admin_mutation" ON "Equipment";
CREATE POLICY "equipment_tenant_select" ON "Equipment"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "equipment_admin_mutation" ON "Equipment"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.is_admin_or_pi()
);

DROP POLICY IF EXISTS "trial_inventory_join_all" ON "TrialInventory";
DROP POLICY IF EXISTS "trial_inventory_select" ON "TrialInventory";
DROP POLICY IF EXISTS "trial_inventory_mutation" ON "TrialInventory";
CREATE POLICY "trial_inventory_select" ON "TrialInventory"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialInventory"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "trial_inventory_mutation" ON "TrialInventory"
FOR ALL USING (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialInventory"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
) WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialInventory"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
);

DROP POLICY IF EXISTS "trial_equipment_join_all" ON "TrialEquipment";
DROP POLICY IF EXISTS "trial_equipment_select" ON "TrialEquipment";
DROP POLICY IF EXISTS "trial_equipment_mutation" ON "TrialEquipment";
CREATE POLICY "trial_equipment_select" ON "TrialEquipment"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialEquipment"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "trial_equipment_mutation" ON "TrialEquipment"
FOR ALL USING (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialEquipment"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
) WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialEquipment"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
);

DROP POLICY IF EXISTS "research_paper_tenant_all" ON "ResearchPaper";
DROP POLICY IF EXISTS "research_paper_select" ON "ResearchPaper";
DROP POLICY IF EXISTS "research_paper_mutation" ON "ResearchPaper";
CREATE POLICY "research_paper_select" ON "ResearchPaper"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);
CREATE POLICY "research_paper_mutation" ON "ResearchPaper"
FOR ALL USING (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
) WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
);

DROP POLICY IF EXISTS "trial_paper_join_all" ON "TrialPaper";
DROP POLICY IF EXISTS "trial_paper_select" ON "TrialPaper";
DROP POLICY IF EXISTS "trial_paper_mutation" ON "TrialPaper";
CREATE POLICY "trial_paper_select" ON "TrialPaper"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialPaper"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
  )
);
CREATE POLICY "trial_paper_mutation" ON "TrialPaper"
FOR ALL USING (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialPaper"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
) WITH CHECK (
  internal.current_user_role() IN ('PI', 'ADMIN', 'RESEARCHER')
  AND EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialPaper"."trialId"
    AND p."organizationId" = internal.current_user_org_id()
    AND t."checksum" IS NULL
  )
);

-- ==============================================================================
-- 10. COMPLIANCE: IMMUTABLE AUDIT LOG & ELECTRONIC SIGNATURES
-- ==============================================================================

-- Electronic Signatures: Viewable by org members; Insertable by non-VIEWER signer; NEVER updatable or deletable!
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
    AND u."role" IN ('PI', 'ADMIN', 'RESEARCHER')
  )
);

-- AuditLog: Append-only ledger scoped to caller identity; Never editable or deletable!
DROP POLICY IF EXISTS "audit_log_tenant_select" ON "AuditLog";
CREATE POLICY "audit_log_tenant_select" ON "AuditLog"
FOR SELECT USING (
  "organizationId" = internal.current_user_org_id()
);

DROP POLICY IF EXISTS "audit_log_tenant_insert" ON "AuditLog";
CREATE POLICY "audit_log_tenant_insert" ON "AuditLog"
FOR INSERT WITH CHECK (
  "organizationId" = internal.current_user_org_id()
  AND EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = "AuditLog"."userId"
    AND u."authId" = (select auth.uid())::text
    AND u."organizationId" = internal.current_user_org_id()
  )
);
