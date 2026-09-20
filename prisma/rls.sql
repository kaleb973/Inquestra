-- prisma/rls.sql
-- Inquestra — Enterprise PostgreSQL Row-Level Security (RLS) & Multi-Tenant Isolation
-- Compliant with 21 CFR Part 11, HIPAA, and GLP reproducibility standards.
-- Safe to execute idempotently in the Supabase SQL Editor.

-- ==============================================================================
-- 1. ENABLE ROW-LEVEL SECURITY ON ALL APPLICATION TABLES
-- ==============================================================================

ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProtocolTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trial" ENABLE ROW LEVEL SECURITY;
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
-- 2. HELPER FUNCTION: GET CURRENT USER ORG ID
-- ==============================================================================

CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS TEXT AS $$
  SELECT "organizationId" FROM "User" WHERE "authId" = auth.uid()::text LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ==============================================================================
-- 3. ORGANIZATION POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "org_member_read" ON "Organization";
CREATE POLICY "org_member_read" ON "Organization"
FOR SELECT USING (
  id = current_user_org_id()
);

-- ==============================================================================
-- 4. USER & TEAM POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "user_tenant_read" ON "User";
CREATE POLICY "user_tenant_read" ON "User"
FOR SELECT USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "team_tenant_all" ON "Team";
CREATE POLICY "team_tenant_all" ON "Team"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

-- ==============================================================================
-- 5. PROJECT & PROTOCOL TEMPLATE POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "project_tenant_all" ON "Project";
CREATE POLICY "project_tenant_all" ON "Project"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "protocol_tenant_all" ON "ProtocolTemplate";
CREATE POLICY "protocol_tenant_all" ON "ProtocolTemplate"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

-- ==============================================================================
-- 6. TRIAL & RESEARCH NOTEBOOK POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "trial_tenant_select" ON "Trial";
CREATE POLICY "trial_tenant_select" ON "Trial"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Project" p
    WHERE p.id = "Trial"."projectId"
    AND p."organizationId" = current_user_org_id()
  )
);

DROP POLICY IF EXISTS "trial_author_mutation" ON "Trial";
CREATE POLICY "trial_author_mutation" ON "Trial"
FOR ALL USING (
  -- Must be from same org and authored by active user
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u."authId" = auth.uid()::text
    AND u.id = "Trial"."userId"
    AND u."organizationId" = current_user_org_id()
  )
);

DROP POLICY IF EXISTS "metadata_via_trial" ON "MetadataEntry";
CREATE POLICY "metadata_via_trial" ON "MetadataEntry"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "MetadataEntry"."trialId"
    AND p."organizationId" = current_user_org_id()
  )
);

DROP POLICY IF EXISTS "telemetry_via_trial" ON "TelemetryStream";
CREATE POLICY "telemetry_via_trial" ON "TelemetryStream"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TelemetryStream"."trialId"
    AND p."organizationId" = current_user_org_id()
  )
);

-- ==============================================================================
-- 7. LIMS INVENTORY, STORAGE & EQUIPMENT POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "storage_tenant_all" ON "StorageLocation";
CREATE POLICY "storage_tenant_all" ON "StorageLocation"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "inventory_tenant_all" ON "InventoryItem";
CREATE POLICY "inventory_tenant_all" ON "InventoryItem"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "equipment_tenant_all" ON "Equipment";
CREATE POLICY "equipment_tenant_all" ON "Equipment"
FOR ALL USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "trial_inventory_join_all" ON "TrialInventory";
CREATE POLICY "trial_inventory_join_all" ON "TrialInventory"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialInventory"."trialId"
    AND p."organizationId" = current_user_org_id()
  )
);

DROP POLICY IF EXISTS "trial_equipment_join_all" ON "TrialEquipment";
CREATE POLICY "trial_equipment_join_all" ON "TrialEquipment"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "TrialEquipment"."trialId"
    AND p."organizationId" = current_user_org_id()
  )
);

-- ==============================================================================
-- 8. COMPLIANCE: IMMUTABLE AUDIT LOG & ELECTRONIC SIGNATURES (21 CFR Part 11)
-- ==============================================================================

-- Electronic Signatures: Viewable by org members; Insertable by signer; NEVER updatable or deletable!
DROP POLICY IF EXISTS "signature_org_select" ON "Signature";
CREATE POLICY "signature_org_select" ON "Signature"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "Trial" t
    JOIN "Project" p ON p.id = t."projectId"
    WHERE t.id = "Signature"."trialId"
    AND p."organizationId" = current_user_org_id()
  )
);

DROP POLICY IF EXISTS "signature_insert_own" ON "Signature";
CREATE POLICY "signature_insert_own" ON "Signature"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "User" u
    WHERE u.id = "Signature"."userId"
    AND u."authId" = auth.uid()::text
    AND u."organizationId" = current_user_org_id()
  )
);

-- Notice: NO UPDATE OR DELETE POLICY ON "Signature" — Immutable by design.

-- AuditLog: Append-only ledger; Never editable or deletable!
DROP POLICY IF EXISTS "audit_log_tenant_select" ON "AuditLog";
CREATE POLICY "audit_log_tenant_select" ON "AuditLog"
FOR SELECT USING (
  "organizationId" = current_user_org_id()
);

DROP POLICY IF EXISTS "audit_log_tenant_insert" ON "AuditLog";
CREATE POLICY "audit_log_tenant_insert" ON "AuditLog"
FOR INSERT WITH CHECK (
  "organizationId" = current_user_org_id()
);

-- Notice: NO UPDATE OR DELETE POLICY ON "AuditLog" — Immutable by design.
