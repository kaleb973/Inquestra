'use client';
// src/components/admin/LabClearanceDossier.tsx
// Extraordinary role-tailored onboarding & clearance dossier for Biomedical Engineering labs.
// Displays regulatory mandates (21 CFR Part 11), granular authority bounds, interactive mission checklist,
// and direct "Ask Higher-Up" escalation requests.

import { useState, useEffect, useTransition } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Award,
  CheckCircle2,
  Circle,
  FileText,
  Lock,
  ArrowUpRight,
  Send,
  Loader2,
  X,
  ExternalLink,
  Info,
  ChevronRight,
} from 'lucide-react';
import type { Role } from '@prisma/client';
import { submitAuthorizationRequest } from '@/actions/adminActions';

export interface ClearanceProfile {
  id: string;
  email: string;
  role: Role;
  orgName: string;
  squadName?: string | null;
}

interface LabClearanceDossierProps {
  user: ClearanceProfile;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: Role;
  onRequestSubmitted?: () => void;
}

interface RoleConfig {
  clearanceLevel: number;
  title: string;
  subtitle: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  badgeClass: string;
  authorizedList: string[];
  restrictedList: string[];
  regulatoryMandate: string;
  checklist: { id: string; label: string; desc: string }[];
}

const ROLE_DEFINITIONS: Record<Role, RoleConfig> = {
  PI: {
    clearanceLevel: 4,
    title: 'Principal Investigator',
    subtitle: 'Lab Director & Legal Sign-off Authority',
    colorClass: 'text-foreground',
    borderClass: 'border-violet-300 dark:border-violet-500/40',
    bgClass: 'bg-violet-50 dark:bg-violet-950/20',
    badgeClass: 'bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border-violet-300 dark:border-violet-800',
    authorizedList: [
      'Final legal seal & signature on completed trials (21 CFR Part 11)',
      'Assign & promote members across all clearance levels',
      'Create, restructure, or disband Research Squads',
      'Configure Organization-wide Strict Mode & compliance controls',
      'Approve or deny permission escalations from lower clearance roles',
    ],
    restrictedList: [
      'Actions are permanently logged to the immutable audit ledger',
      'Cannot delete sealed trials with cryptographic checksums',
    ],
    regulatoryMandate:
      'Under FDA 21 CFR § 11.100 and GLP guidelines, the Principal Investigator bears ultimate accountability for data integrity, signature authenticity, and SOP adherence within the research organization.',
    checklist: [
      { id: 'pi_1', label: 'Verify Lab Strict Mode Policy', desc: 'Ensure calibration and reagent blockades are configured.' },
      { id: 'pi_2', label: 'Review Research Squad Assignments', desc: 'Confirm bench researchers are assigned to appropriate cores.' },
      { id: 'pi_3', label: 'Inspect Calibration & Maintenance Queue', desc: 'Audit equipment overdue for routine bench calibration.' },
      { id: 'pi_4', label: 'Examine Electronic Signatures Audit Trail', desc: 'Verify Part 11 signature logs and checksum verification.' },
    ],
  },
  ADMIN: {
    clearanceLevel: 3,
    title: 'Lab Operations Manager',
    subtitle: 'Facility & Inventory Operations Lead',
    colorClass: 'text-foreground',
    borderClass: 'border-indigo-300 dark:border-border',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/20',
    badgeClass: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-muted-foreground border-indigo-300 dark:border-indigo-800',
    authorizedList: [
      'Manage LIMS inventory, stock replenishment, and lot numbers',
      'Define storage locations (freezers, racks, boxes, well-plates)',
      'Manage lab equipment, calibration logs, and operational status',
      'Assign scientists to research squads & elevate to Researcher role',
      'Review and resolve bench overdraft & operational escalations',
    ],
    restrictedList: [
      'Cannot elevate users to Principal Investigator (PI approval required)',
      'Cannot permanently seal trials without certified witness signature',
    ],
    regulatoryMandate:
      'Responsible for continuous physical-to-digital inventory alignment, calibration traceability, and operational readiness for external audit inspections.',
    checklist: [
      { id: 'adm_1', label: 'Map Storage Hierarchy', desc: 'Catalog freezers, liquid nitrogen dewars, and ambient shelves.' },
      { id: 'adm_2', label: 'Register Critical Reagent Lots', desc: 'Input lot numbers and expiration dates for active inventory.' },
      { id: 'adm_3', label: 'Calibrate Bench Sensor Rigs', desc: 'Set calibration intervals and verify serial hardware status.' },
      { id: 'adm_4', label: 'Review Squad Allocations', desc: 'Ensure active lab personnel are organized into working teams.' },
    ],
  },
  RESEARCHER: {
    clearanceLevel: 2,
    title: 'Bench Biomedical Researcher',
    subtitle: 'Experimental Protocol Execution & DAQ Lead',
    colorClass: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-300 dark:border-sky-500/40',
    bgClass: 'bg-sky-50 dark:bg-sky-950/20',
    badgeClass: 'bg-sky-100 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800',
    authorizedList: [
      'Create and author research trials and experimental observations',
      'Connect serial microcontrollers (ESP32/Arduino) for real-time DAQ',
      'Deduct reagents and consumables from LIMS inventory during trials',
      'Apply primary Author electronic signatures to experimental data',
      'Escalate permission requests to PI/Admin via "Ask Higher-Up"',
    ],
    restrictedList: [
      'Cannot overwrite inventory quantities without linked trial usage',
      'Cannot seal trials permanently without PI countersignature',
      'Cannot modify organizational strict mode policies or team rosters',
    ],
    regulatoryMandate:
      'All observations, reagent lot deductions, and sensor telemetry streams are immutably tied to your digital identity. Zero silent edits are permitted.',
    checklist: [
      { id: 'res_1', label: 'Confirm Squad Affiliation', desc: 'Verify your assigned research squad and primary focus area.' },
      { id: 'res_2', label: 'Inspect Reagent Inventory', desc: 'Check available chemicals, buffers, and cell lines in LIMS.' },
      { id: 'res_3', label: 'Test Telemetry Acquisition', desc: 'Run a simulator or serial DAQ stream in the active notebook.' },
      { id: 'res_4', label: 'Draft Initial Research Trial', desc: 'Link reagents, record hardware readings, and test cloud sync.' },
    ],
  },
  VIEWER: {
    clearanceLevel: 1,
    title: 'Audit & Compliance Observer',
    subtitle: 'Read-Only Research Observer',
    colorClass: 'text-slate-600 dark:text-neutral-400',
    borderClass: 'border-slate-300 dark:border-neutral-700',
    bgClass: 'bg-slate-50 dark:bg-neutral-900/40',
    badgeClass: 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-300 border-slate-300 dark:border-neutral-700',
    authorizedList: [
      'Inspect sealed trials, telemetry charts, and historical notebooks',
      'View LIMS storage locations, reagent stocks, and lot numbers',
      'Export verified trial archives (ZIP bundle and compliance PDF)',
      'Review immutable organizational audit logs and timestamps',
      'Submit formal elevation request to obtain Bench Researcher clearance',
    ],
    restrictedList: [
      'Cannot edit or delete any notebook entries or trial observations',
      'Cannot execute hardware telemetry acquisition or mutate LIMS stock',
      'Cannot apply electronic signatures or alter lab configurations',
    ],
    regulatoryMandate:
      'Read-only observer role suited for external compliance auditors, student trainees, and institutional review inspectors.',
    checklist: [
      { id: 'viw_1', label: 'Tour Sealed Research Notebooks', desc: 'Inspect completed trial archives and cryptographic checksums.' },
      { id: 'viw_2', label: 'Examine Storage Map', desc: 'Review the lab inventory structure and storage location hierarchy.' },
      { id: 'viw_3', label: 'Inspect Sensor Streams', desc: 'Review historical high-speed DAQ telemetry streams.' },
      { id: 'viw_4', label: 'Request Researcher Clearance', desc: 'Submit elevation request when ready for hands-on bench access.' },
    ],
  },
};

export function LabClearanceDossier({
  user,
  isOpen,
  onClose,
  currentUserRole,
  onRequestSubmitted,
}: LabClearanceDossierProps) {
  const config = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.VIEWER;

  // Local storage checklist state for interactive onboarding
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState<Role>('RESEARCHER');
  const [justification, setJustification] = useState('');
  const [escalationError, setEscalationError] = useState<string | null>(null);
  const [escalationSuccess, setEscalationSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const storageKey = `inquestra_dossier_${user.id}_${user.role}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggleCheck = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const completedCount = config.checklist.filter((item) => checkedItems[item.id]).length;
  const progressPercent = Math.round((completedCount / config.checklist.length) * 100);

  const handleEscalationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEscalationError(null);

    if (!justification.trim()) {
      setEscalationError('Please provide an operational justification for higher clearance.');
      return;
    }

    startTransition(async () => {
      const res = await submitAuthorizationRequest({
        requestType: 'ROLE_ELEVATION',
        requestedRole,
        justification: justification.trim(),
        targetEntity: user.email,
      });

      if (!res.success) {
        setEscalationError(res.error || 'Failed to submit clearance request.');
      } else {
        setEscalationSuccess(true);
        setTimeout(() => {
          setShowEscalationModal(false);
          setEscalationSuccess(false);
          setJustification('');
          if (onRequestSubmitted) onRequestSubmitted();
        }, 1500);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Banner */}
        <div className={`px-6 py-5 border-b border-border flex items-center justify-between ${config.bgClass}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.borderClass} ${config.bgClass}`}>
              <Shield className={`w-6 h-6 ${config.colorClass}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${config.badgeClass}`}>
                  CLEARANCE LEVEL {config.clearanceLevel}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  CLASSIFIED BME LAB DOSSIER
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight mt-0.5">
                {config.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Identity & Metadata Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
            <div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground">Personnel Identity</div>
              <div className="text-sm font-semibold text-foreground font-mono truncate mt-0.5" title={user.email}>
                {user.email}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground">Organization</div>
              <div className="text-sm font-semibold text-foreground mt-0.5 truncate">
                {user.orgName}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono text-muted-foreground">Assigned Squad</div>
              <div className="text-sm font-semibold text-indigo-600 dark:text-muted-foreground mt-0.5">
                {user.squadName || 'General Lab Pool (Unassigned)'}
              </div>
            </div>
          </div>

          {/* Onboarding Mission Checklist */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${config.colorClass}`} />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Role Kickoff Objectives ({completedCount}/{config.checklist.length})
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {progressPercent}% Complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {config.checklist.map((item) => {
                const isChecked = !!checkedItems[item.id];
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                      isChecked
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60 text-foreground'
                        : 'bg-card border-border hover:border-indigo-300 dark:hover:border-neutral-700 text-foreground shadow-sm'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-foreground" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className={`text-xs font-medium ${isChecked ? 'text-indigo-700 dark:text-indigo-200 line-through opacity-80' : 'text-foreground'}`}>
                        {item.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope of Authority & Restrictions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Authorized */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-muted-foreground uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground" />
                Authorized Operations
              </div>
              <ul className="space-y-2 text-xs text-foreground">
                {config.authorizedList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-foreground mt-0.5 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Operational Safeguards & Limits
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {config.restrictedList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Regulatory Mandate (21 CFR Part 11) */}
          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/15 border border-indigo-200 dark:border-indigo-900/40 flex items-start gap-3">
            <Info className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-indigo-800 dark:text-muted-foreground uppercase tracking-wider">
                FDA 21 CFR Part 11 & GLP Regulatory Mandate
              </div>
              <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                {config.regulatoryMandate}
              </p>
            </div>
          </div>

          {/* Role Elevation / Ask Higher-Up Action Box */}
          {user.role !== 'PI' && (
            <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Need Higher Operational Clearance?</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Request role promotion or special bench overrides directly from the Lab Director / PI.
                </p>
              </div>
              <button
                onClick={() => setShowEscalationModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Request Higher Clearance
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between items-center text-xs text-muted-foreground">
          <span>Inquestra Biomedical Engineering Governance</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-medium bg-muted hover:bg-accent text-foreground border border-border transition-colors shadow-sm"
          >
            Close Dossier
          </button>
        </div>

        {/* Embedded Escalation Modal */}
        {showEscalationModal && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-100">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Ask Higher-Up: Clearance Elevation</h3>
                </div>
                <button
                  onClick={() => setShowEscalationModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {escalationSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-foreground mx-auto" />
                  <div className="text-sm font-semibold text-foreground">Escalation Transmitted</div>
                  <p className="text-xs text-muted-foreground">
                    Your clearance request has been forwarded to the Principal Investigator&apos;s Authorizations Inbox.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleEscalationSubmit} className="space-y-4">
                  {escalationError && (
                    <div className="p-2.5 rounded text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
                      {escalationError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Requested Clearance Level
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as Role)}
                      className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      <option value="RESEARCHER">Level 2: Bench Biomedical Researcher</option>
                      <option value="ADMIN">Level 3: Lab Operations Manager</option>
                      <option value="PI">Level 4: Principal Investigator (PI Approval Required)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Operational Justification / Research Need
                    </label>
                    <textarea
                      rows={3}
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="e.g. Completed BioSafety Level 2 clearance. Need to conduct microfluidic serial acquisitions and deduct reagents."
                      className="w-full px-3 py-2 rounded bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowEscalationModal(false)}
                      className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-1.5 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 font-medium flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                    >
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Transmit to PI
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
