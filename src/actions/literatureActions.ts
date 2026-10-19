'use server';
// src/actions/literatureActions.ts
// Scientific Literature & Citations Server Actions
// Integrates with Europe PMC REST API (44M+ biomedical articles) and manages
// lab-wide references and experiment-linked citations with 21 CFR Part 11 audit trails.

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import DOMPurify from 'isomorphic-dompurify';
import prisma from '@/lib/prisma';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface LiteratureItem {
  id: string; // DOI, PMID, or generated
  title: string;
  authors: string;
  journal: string;
  pubYear: number | null;
  doi: string | null;
  pmid: string | null;
  pmcid: string | null;
  abstractText: string | null;
  url: string;
  pdfUrl: string | null;
  citedByCount: number;
  isOpenAccess: boolean;
  tags: string[];
  isSavedInLab?: boolean;
  isCitedInTrial?: boolean;
}

export type LiteratureSearchResult = LiteratureItem;

export interface PaperPayload {
  title: string;
  authors: string | string[];
  journal?: string | null;
  pubYear?: number | null;
  doi?: string | null;
  pmid?: string | null;
  pmcid?: string | null;
  abstractText?: string | null;
  abstract?: string | null;
  url?: string | null;
  pdfUrl?: string | null;
  citationCount?: number;
  isOpenAccess?: boolean;
  tags?: string[];
}

/**
 * Search external biomedical literature using Europe PMC REST API.
 * Free, public, zero-auth endpoint with 44M+ life science & BME records.
 */
export async function searchExternalLiterature(
  query: string,
  pageOrOptions: number | { page?: number; pageSize?: number; trialId?: string } = 1,
  pageSize = 15,
  trialId?: string
): Promise<{ success: boolean; results: LiteratureItem[]; total: number; error?: string }> {
  try {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { success: true, results: [], total: 0 };
    }

    const page = typeof pageOrOptions === 'number' ? pageOrOptions : (pageOrOptions.page || 1);
    const size = typeof pageOrOptions === 'object' && pageOrOptions.pageSize ? pageOrOptions.pageSize : pageSize;
    const targetTrialId = typeof pageOrOptions === 'object' && pageOrOptions.trialId ? pageOrOptions.trialId : trialId;

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    let orgId: string | null = null;
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
      if (dbUser) orgId = dbUser.organizationId;
    }

    const endpoint = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      cleanQuery
    )}&format=json&pageSize=${pageSize}&page=${page}&resultType=core`;

    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Inquestra-BME-Platform/1.0 (https://inquestra.app)',
      },
      next: { revalidate: 3600 }, // Cache search queries for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Europe PMC API returned status ${res.status}`);
    }

    const json = await res.json();
    const hitCount = json.hitCount || 0;
    const rawList = json.resultList?.result || [];

    // Collect DOIs to check if already saved in org database
    const dois = rawList
      .map((r: any) => r.doi)
      .filter((d: any): d is string => typeof d === 'string' && d.length > 0);

    let savedDoiSet = new Set<string>();
    let citedDoiSet = new Set<string>();

    if (orgId && dois.length > 0) {
      const savedPapers = await prisma.researchPaper.findMany({
        where: {
          organizationId: orgId,
          doi: { in: dois },
        },
        include: {
          trials: trialId ? { where: { trialId } } : false,
        },
      });

      savedPapers.forEach((p) => {
        if (p.doi) savedDoiSet.add(p.doi.toLowerCase());
        if (trialId && p.trials && p.trials.length > 0 && p.doi) {
          citedDoiSet.add(p.doi.toLowerCase());
        }
      });
    }

    const results: LiteratureItem[] = rawList.map((r: any) => {
      const rawTitle = (r.title || 'Untitled Article').replace(/<[^>]+>/g, '');
      const rawAbstract = (r.abstractText || '').replace(/<[^>]+>/g, '');
      const doi = r.doi || null;
      const pmid = r.pmid || null;
      const pmcid = r.pmcid || null;

      // Extract open access direct PDF link if available
      let pdfUrl: string | null = null;
      if (r.fullTextUrlList?.fullTextUrl) {
        const urls = r.fullTextUrlList.fullTextUrl;
        const pdfEntry = Array.isArray(urls)
          ? urls.find((u: any) => u.documentStyle === 'pdf' || u.url?.endsWith('.pdf'))
          : urls.documentStyle === 'pdf' ? urls : null;
        if (pdfEntry?.url) pdfUrl = pdfEntry.url;
      }

      const externalUrl = doi
        ? `https://doi.org/${doi}`
        : pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        : `https://europepmc.org/article/${r.source || 'MED'}/${r.id}`;

      return {
        id: doi || pmid || r.id,
        title: DOMPurify.sanitize(rawTitle),
        authors: DOMPurify.sanitize(r.authorString || 'Unknown Authors'),
        journal: DOMPurify.sanitize(r.journalTitle || r.bookOrReportDetails?.publisher || 'Peer-Reviewed Journal'),
        pubYear: r.pubYear ? parseInt(String(r.pubYear), 10) : null,
        doi,
        pmid,
        pmcid,
        abstractText: rawAbstract ? DOMPurify.sanitize(rawAbstract) : null,
        url: externalUrl,
        pdfUrl,
        citedByCount: typeof r.citedByCount === 'number' ? r.citedByCount : 0,
        isOpenAccess: r.isOpenAccess === 'Y',
        tags: [],
        isSavedInLab: doi ? savedDoiSet.has(doi.toLowerCase()) : false,
        isCitedInTrial: doi ? citedDoiSet.has(doi.toLowerCase()) : false,
      };
    });

    return { success: true, results, total: hitCount };
  } catch (err) {
    console.error('Europe PMC Search Error:', err);
    return {
      success: false,
      results: [],
      total: 0,
      error: err instanceof Error ? err.message : 'Failed to search scientific literature.',
    };
  }
}

/**
 * Save a research paper to the organization's central library.
 */
export async function savePaperToLibrary(payload: PaperPayload) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User profile not found');

  const rawAuthors = Array.isArray(payload.authors) ? payload.authors.join(', ') : payload.authors;
  const cleanTitle = DOMPurify.sanitize(payload.title.trim());
  const cleanAuthors = DOMPurify.sanitize((rawAuthors || 'Unknown Author').trim());
  const rawAbstract = payload.abstractText || payload.abstract || null;
  const cleanAbstract = rawAbstract ? DOMPurify.sanitize(rawAbstract) : null;

  // Check if paper already exists in this org
  let existing = null;
  if (payload.doi) {
    existing = await prisma.researchPaper.findFirst({
      where: { organizationId: dbUser.organizationId, doi: payload.doi },
    });
  }

  let paper;
  if (existing) {
    paper = await prisma.researchPaper.update({
      where: { id: existing.id },
      data: {
        title: cleanTitle,
        authors: cleanAuthors,
        journal: payload.journal ? DOMPurify.sanitize(payload.journal) : undefined,
        pubYear: payload.pubYear ?? undefined,
        abstract: cleanAbstract ?? undefined,
        url: payload.url || undefined,
        pdfUrl: payload.pdfUrl || undefined,
        isOpenAccess: payload.isOpenAccess ?? undefined,
        tags: payload.tags ? Array.from(new Set([...existing.tags, ...payload.tags])) : undefined,
      },
    });
  } else {
    paper = await prisma.researchPaper.create({
      data: {
        title: cleanTitle,
        authors: cleanAuthors,
        journal: payload.journal ? DOMPurify.sanitize(payload.journal) : null,
        pubYear: payload.pubYear || null,
        doi: payload.doi || null,
        pmid: payload.pmid || null,
        pmcid: payload.pmcid || null,
        abstract: cleanAbstract,
        url: payload.url || null,
        pdfUrl: payload.pdfUrl || null,
        isOpenAccess: payload.isOpenAccess || false,
        citationCount: payload.citationCount || 0,
        tags: payload.tags || [],
        organizationId: dbUser.organizationId,
        createdById: dbUser.id,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'LITERATURE_PAPER_SAVED',
      entityType: 'ResearchPaper',
      entityId: paper.id,
      details: { title: paper.title, doi: paper.doi },
    },
  });

  revalidatePath('/app');
  revalidatePath('/app/literature');
  return { success: true, paper };
}

/**
 * Link/cite a paper in an active experiment/trial.
 */
export async function linkPaperToTrial(
  arg1: string | { trialId: string; paperData: PaperPayload; notes?: string },
  arg2?: PaperPayload,
  arg3?: string
) {
  let trialId: string;
  let payload: PaperPayload;
  let notes: string | undefined;

  if (typeof arg1 === 'object') {
    trialId = arg1.trialId;
    payload = arg1.paperData;
    notes = arg1.notes;
  } else {
    trialId = arg1;
    payload = arg2!;
    notes = arg3;
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User profile not found');

  const trial = await prisma.trial.findFirst({
    where: { id: trialId, project: { organizationId: dbUser.organizationId } },
  });
  if (!trial) throw new Error('Trial not found');

  // 1. Ensure paper exists in library
  const saved = await savePaperToLibrary(payload);
  const paperId = saved.paper.id;

  // 2. Count existing citations to assign index
  const existingCount = await prisma.trialPaper.count({ where: { trialId } });

  // 3. Upsert relationship
  const trialPaper = await prisma.trialPaper.upsert({
    where: {
      trialId_paperId: {
        trialId,
        paperId,
      },
    },
    update: {
      notes: notes ? DOMPurify.sanitize(notes) : undefined,
    },
    create: {
      trialId,
      paperId,
      notes: notes ? DOMPurify.sanitize(notes) : null,
      citationIndex: existingCount + 1,
    },
    include: { paper: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'TRIAL_PAPER_CITED',
      entityType: 'Trial',
      entityId: trialId,
      details: {
        paperId,
        title: saved.paper.title,
        doi: saved.paper.doi,
        notes,
      },
    },
  });

  revalidatePath('/app');
  return { success: true, trialPaper };
}

/**
 * Remove a paper citation from an active trial.
 */
export async function unlinkPaperFromTrial(trialIdOrId: string, paperId?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  if (paperId) {
    const trial = await prisma.trial.findFirst({
      where: { id: trialIdOrId, project: { organizationId: dbUser.organizationId } },
    });
    if (!trial) throw new Error('Trial not found');
    if (trial.checksum) throw new Error('Cannot remove citations from a sealed experiment.');

    await prisma.trialPaper.deleteMany({
      where: { trialId: trialIdOrId, paperId },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TRIAL_PAPER_UNLINKED',
        entityType: 'Trial',
        entityId: trialIdOrId,
        details: { paperId },
      },
    });
  } else {
    // Single trialPaper ID passed
    const existing = await prisma.trialPaper.findFirst({
      where: { id: trialIdOrId, trial: { project: { organizationId: dbUser.organizationId } } },
      include: { trial: true },
    });
    if (!existing) throw new Error('Citation not found');
    if (existing.trial.checksum) throw new Error('Cannot remove citations from a sealed experiment.');

    await prisma.trialPaper.delete({
      where: { id: trialIdOrId },
    });

    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        organizationId: dbUser.organizationId,
        action: 'TRIAL_PAPER_UNLINKED',
        entityType: 'Trial',
        entityId: existing.trialId,
        details: { paperId: existing.paperId },
      },
    });
  }

  revalidatePath('/app');
  return { success: true };
}

/**
 * Fetch all papers linked to a specific trial.
 */
export async function fetchTrialPapers(trialId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return [];

  return prisma.trialPaper.findMany({
    where: {
      trialId,
      trial: { project: { organizationId: dbUser.organizationId } },
    },
    include: { paper: true },
    orderBy: { citationIndex: 'asc' },
  });
}

/**
 * Fetch all research papers stored in the organization's library with filtering.
 */
export async function fetchOrganizationPapers(filter?: {
  tags?: string[];
  query?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) return [];

  return prisma.researchPaper.findMany({
    where: {
      organizationId: dbUser.organizationId,
      ...(filter?.tags && filter.tags.length > 0
        ? { tags: { hasSome: filter.tags } }
        : {}),
      ...(filter?.query && filter.query.trim().length > 0
        ? {
            OR: [
              { title: { contains: filter.query.trim(), mode: 'insensitive' } },
              { authors: { contains: filter.query.trim(), mode: 'insensitive' } },
              { doi: { contains: filter.query.trim(), mode: 'insensitive' } },
              { journal: { contains: filter.query.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { trials: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a paper from the lab's library.
 */
export async function deletePaperFromLibrary(paperId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const paper = await prisma.researchPaper.findFirst({
    where: { id: paperId, organizationId: dbUser.organizationId },
    include: { trials: { include: { trial: true } } },
  });

  if (!paper) throw new Error('Paper not found');

  // Verify no sealed trial relies on this paper
  const sealedTrial = paper.trials.find((t) => t.trial.checksum !== null);
  if (sealedTrial) {
    throw new Error(
      `Cannot delete paper: cited in sealed experiment "${sealedTrial.trial.title}" under 21 CFR Part 11.`
    );
  }

  await prisma.researchPaper.delete({ where: { id: paperId } });

  await prisma.auditLog.create({
    data: {
      userId: dbUser.id,
      organizationId: dbUser.organizationId,
      action: 'LITERATURE_PAPER_DELETED',
      entityType: 'ResearchPaper',
      entityId: paperId,
      details: { title: paper.title, doi: paper.doi },
    },
  });

  revalidatePath('/app/literature');
  return { success: true };
}

/**
 * Add or remove custom tags on a research paper.
 */
export async function updatePaperTags(paperId: string, tags: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } });
  if (!dbUser) throw new Error('User not found');

  const cleanTags = tags.map((t) => DOMPurify.sanitize(t.trim())).filter((t) => t.length > 0);

  const updated = await prisma.researchPaper.update({
    where: { id: paperId, organizationId: dbUser.organizationId },
    data: { tags: cleanTags },
  });

  revalidatePath('/app/literature');
  return { success: true, paper: updated };
}
