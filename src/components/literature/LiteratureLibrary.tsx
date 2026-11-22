'use client';
// src/components/literature/LiteratureLibrary.tsx
// Central Literature & Citations Library component for Inquestra.
// Provides lab-wide paper management, Europe PMC discovery, cross-experiment citation tracking,
// and open-access PDF access with strict legal attribution.

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Plus,
  ExternalLink,
  FileText,
  Tag,
  Quote,
  Trash2,
  CheckCircle2,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Library,
} from 'lucide-react';
import {
  searchExternalLiterature,
  savePaperToLibrary,
  deletePaperFromLibrary,
  updatePaperTags,
  type LiteratureSearchResult,
} from '@/actions/literatureActions';
import type { Role } from '@prisma/client';

export interface SavedPaperItem {
  id: string;
  title: string;
  authors: string;
  journal: string | null;
  pubYear: number | null;
  doi: string | null;
  pmid: string | null;
  pmcid: string | null;
  abstract: string | null;
  url: string | null;
  pdfUrl: string | null;
  citationCount: number;
  isOpenAccess: boolean;
  tags: string[];
  createdAt: Date;
  trials: {
    id: string;
    trialId: string;
    notes: string | null;
    trial: {
      id: string;
      title: string;
      status: string;
    };
  }[];
}

interface LiteratureLibraryProps {
  initialPapers: SavedPaperItem[];
  orgName: string;
  currentUserRole: Role;
}

const PRESET_TOPICS = [
  'Biosensors',
  'Microfluidics',
  'CRISPR Cas9',
  'Tissue Engineering',
  'Optogenetics',
  'Electrophysiology',
  'Organ-on-Chip',
  'Biomarkers',
];

const isSafeHttpUrl = (url: string | null | undefined): boolean =>
  typeof url === 'string' && /^https?:\/\//i.test(url.trim());

export function LiteratureLibrary({
  initialPapers,
  orgName,
}: LiteratureLibraryProps) {
  const [papers, setPapers] = useState<SavedPaperItem[]>(initialPapers);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CITED' | 'OPEN_ACCESS'>('ALL');

  // Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [externalQuery, setExternalQuery] = useState('');
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalResults, setExternalResults] = useState<LiteratureSearchResult[]>([]);
  const [externalError, setExternalError] = useState<string | null>(null);

  // Expansion and editing states
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const [isPending, startTransition] = useTransition();

  // All unique tags across library
  const allTags = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [papers]);

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      // Text search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesAuthor = (p.authors || '').toLowerCase().includes(q);
        const matchesJournal = (p.journal || '').toLowerCase().includes(q);
        const matchesDoi = (p.doi || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesJournal && !matchesDoi) {
          return false;
        }
      }

      // Tag filter
      if (selectedTag !== 'ALL' && !p.tags.includes(selectedTag)) {
        return false;
      }

      // Filter Mode
      if (filterMode === 'CITED' && p.trials.length === 0) {
        return false;
      }
      if (filterMode === 'OPEN_ACCESS' && !p.isOpenAccess) {
        return false;
      }

      return true;
    });
  }, [papers, searchFilter, selectedTag, filterMode]);

  // Statistics
  const totalPapers = papers.length;
  const totalCitedTrials = papers.reduce((acc, p) => acc + p.trials.length, 0);
  const openAccessCount = papers.filter((p) => p.isOpenAccess).length;
  const openAccessPercent = totalPapers > 0 ? Math.round((openAccessCount / totalPapers) * 100) : 0;

  // External search handler
  const handleSearchExternal = async (q: string) => {
    if (!q.trim()) return;
    setIsSearchingExternal(true);
    setExternalError(null);
    try {
      const res = await searchExternalLiterature(q.trim(), 1, 12);
      setExternalResults(res.results);
    } catch (e) {
      console.error(e);
      setExternalError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearchingExternal(false);
    }
  };

  // Save paper to lab library
  const handleSaveToLibrary = async (paper: LiteratureSearchResult) => {
    startTransition(async () => {
      try {
        const res = await savePaperToLibrary({
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          pubYear: paper.pubYear,
          doi: paper.doi,
          pmid: paper.pmid,
          pmcid: paper.pmcid,
          abstractText: paper.abstractText,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          isOpenAccess: paper.isOpenAccess,
          citationCount: paper.citedByCount,
          tags: [],
        });

        const saved = res.paper;

        // Add to local state if not already there
        setPapers((prev) => {
          if (prev.some((p) => p.id === saved.id)) return prev;
          return [
            {
              id: saved.id,
              title: saved.title,
              authors: saved.authors,
              journal: saved.journal,
              pubYear: saved.pubYear,
              doi: saved.doi,
              pmid: saved.pmid,
              pmcid: saved.pmcid,
              abstract: saved.abstract,
              url: saved.url,
              pdfUrl: saved.pdfUrl,
              citationCount: saved.citationCount,
              isOpenAccess: saved.isOpenAccess,
              tags: saved.tags,
              createdAt: saved.createdAt,
              trials: [],
            },
            ...prev,
          ];
        });

        // Update external results mark
        setExternalResults((prev) =>
          prev.map((p) => (p.doi === paper.doi || p.title === paper.title ? { ...p, isSavedInLab: true } : p))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to save paper');
      }
    });
  };

  // Delete paper from library
  const handleDeletePaper = async (paperId: string, title: string) => {
    if (!confirm(`Remove "${title}" from the organization literature library?`)) {
      return;
    }
    startTransition(async () => {
      try {
        await deletePaperFromLibrary(paperId);
        setPapers((prev) => prev.filter((p) => p.id !== paperId));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete paper');
      }
    });
  };

  // Add tag to paper
  const handleAddTag = async (paperId: string) => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().replace(/^#/, '');
    const paper = papers.find((p) => p.id === paperId);
    if (!paper) return;

    if (paper.tags.includes(tag)) {
      setNewTagInput('');
      setEditingTagId(null);
      return;
    }

    const updatedTags = [...paper.tags, tag];
    startTransition(async () => {
      try {
        await updatePaperTags(paperId, updatedTags);
        setPapers((prev) =>
          prev.map((p) => (p.id === paperId ? { ...p, tags: updatedTags } : p))
        );
        setNewTagInput('');
        setEditingTagId(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to add tag');
      }
    });
  };

  // Remove tag from paper
  const handleRemoveTag = async (paperId: string, tagToRemove: string) => {
    const paper = papers.find((p) => p.id === paperId);
    if (!paper) return;

    const updatedTags = paper.tags.filter((t) => t !== tagToRemove);
    startTransition(async () => {
      try {
        await updatePaperTags(paperId, updatedTags);
        setPapers((prev) =>
          prev.map((p) => (p.id === paperId ? { ...p, tags: updatedTags } : p))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove tag');
      }
    });
  };

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              prefetch={true}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted border border-border/80 font-medium text-xs shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
              title="Return to active experiment notebook"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-primary" />
              <span>Back to Notebook</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-primary" />
                <h1 className="text-base font-semibold text-foreground tracking-tight">
                  Literature &amp; Citations
                </h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-primary/10 text-primary font-mono font-medium border border-primary/20">
                  {orgName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lab library of peer-reviewed publications, open-access papers, and experimental citations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Search Europe PMC
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full space-y-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              Saved Papers
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalPapers}</p>
            <span className="text-[10px] text-muted-foreground">in lab repository</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Quote className="w-3.5 h-3.5 text-foreground" />
              Trial Citations
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalCitedTrials}</p>
            <span className="text-[10px] text-muted-foreground">linked across experiments</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              Open Access Coverage
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{openAccessPercent}%</p>
            <span className="text-[10px] text-muted-foreground">{openAccessCount} direct full-text PDFs</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              Active Tags
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{allTags.length}</p>
            <span className="text-[10px] text-muted-foreground">research disciplines</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search saved papers by title, author, journal, or DOI..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Toggle Pills */}
            <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-md border border-border text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterMode === 'ALL'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({papers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('CITED')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterMode === 'CITED'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cited in Trials ({papers.filter((p) => p.trials.length > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('OPEN_ACCESS')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filterMode === 'OPEN_ACCESS'
                    ? 'bg-background shadow-xs text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Open Access ({openAccessCount})
              </button>
            </div>
          </div>

          {/* Tag Filter Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
                Filter by Tag:
              </span>
              <button
                type="button"
                onClick={() => setSelectedTag('ALL')}
                className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors ${
                  selectedTag === 'ALL'
                    ? 'bg-primary text-primary-foreground border-primary font-medium'
                    : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag === selectedTag ? 'ALL' : tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-xs border transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground border-primary font-medium'
                      : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Papers List */}
        {filteredPapers.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30" />
            <h3 className="text-sm font-semibold text-foreground">No research papers found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {papers.length === 0
                ? 'Your lab library is empty. Search Europe PMC and PubMed to discover and curate scientific papers for your experimental protocols.'
                : 'No papers matched the current search and tag filters.'}
            </p>
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Discover Papers on Europe PMC
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => {
              const isAbstractOpen = expandedAbstracts[paper.id];

              return (
                <div
                  key={paper.id}
                  className="bg-card border border-border rounded-xl p-4 shadow-xs hover:border-primary/40 transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {paper.authors}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {paper.doi && (
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs rounded border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors flex items-center gap-1"
                          title="Open DOI resolver"
                        >
                          DOI <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </a>
                      )}
                      {isSafeHttpUrl(paper.pdfUrl) && (
                        <a
                          href={paper.pdfUrl!}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs font-medium rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                          title="Download Open Access PDF"
                        >
                          <FileText className="w-3 h-3" /> PDF
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeletePaper(paper.id, paper.title)}
                        disabled={isPending}
                        className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Remove from lab library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges Bar */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {paper.journal && (
                      <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border/60">
                        {paper.journal}
                      </span>
                    )}
                    {paper.pubYear && (
                      <span className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                        {paper.pubYear}
                      </span>
                    )}
                    {paper.isOpenAccess && (
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                        Open Access
                      </span>
                    )}
                    {paper.citationCount > 0 && (
                      <span className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                        {paper.citationCount} Citations
                      </span>
                    )}
                    {paper.pmid && (
                      <span className="text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded font-mono text-[11px]">
                        PMID: {paper.pmid}
                      </span>
                    )}
                  </div>

                  {/* Experiments that cited this paper */}
                  {paper.trials.length > 0 && (
                    <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        <Quote className="w-3 h-3" />
                        Cited in {paper.trials.length} Experiment{paper.trials.length > 1 ? 's' : ''}:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {paper.trials.map((tp) => (
                          <Link
                            key={tp.id}
                            href="/app"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-background border border-border hover:border-primary/50 text-foreground transition-colors"
                          >
                            <span className="font-medium truncate max-w-[200px]">{tp.trial.title}</span>
                            <span className="text-[9px] text-muted-foreground">({tp.trial.status})</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags and Tag Editor */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Tags:
                    </span>
                    {paper.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-xs border border-border text-foreground group"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(paper.id, t)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    {editingTagId === paper.id ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="tag name..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag(paper.id)}
                          className="text-[10px] px-2 py-0.5 bg-background border border-primary rounded focus:outline-none w-24 text-foreground"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTag(paper.id)}
                          className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTagId(paper.id);
                          setNewTagInput('');
                        }}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add Tag
                      </button>
                    )}

                    {paper.abstract && (
                      <button
                        type="button"
                        onClick={() => toggleAbstract(paper.id)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        Abstract {isAbstractOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Abstract expansion */}
                  {isAbstractOpen && paper.abstract && (
                    <div className="p-3 bg-muted/30 border border-border/50 rounded-lg text-xs text-muted-foreground leading-relaxed mt-2">
                      <span className="font-semibold text-foreground block mb-1">Abstract:</span>
                      {paper.abstract}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legal & Open Access Notice */}
        <div className="border border-border/80 bg-card rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <h4 className="font-semibold text-foreground">Legal &amp; Open Access Compliance</h4>
            <p className="leading-relaxed">
              Inquestra queries Europe PMC REST API services. Article metadata (titles, authors, abstracts, DOIs) is provided under Creative Commons CC0 / Public Domain dedication. Full-text open access PDFs are distributed subject to publisher-specified Creative Commons licenses. Inquestra does not host unauthorized copyrighted manuscripts.
            </p>
          </div>
        </div>
      </main>

      {/* Europe PMC Discovery Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Search &amp; Discover Literature (Europe PMC)
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  44M+ Papers
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search keywords, disease target, author, or DOI (e.g. 'CRISPR Cas9 base editing')..."
                    value={externalQuery}
                    onChange={(e) => setExternalQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchExternal(externalQuery)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchExternal(externalQuery)}
                  disabled={isSearchingExternal || !externalQuery.trim()}
                  className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSearchingExternal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Quick Preset Topics */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Quick Topics:</span>
                {PRESET_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setExternalQuery(topic);
                      handleSearchExternal(topic);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                  >
                    #{topic}
                  </button>
                ))}
              </div>

              {/* Error state */}
              {externalError && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20">
                  {externalError}
                </div>
              )}

              {/* Results List */}
              {isSearchingExternal ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs">Querying Europe PMC &amp; PubMed Central...</span>
                </div>
              ) : externalResults.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Search Results ({externalResults.length}):
                  </span>

                  {externalResults.map((paper, idx) => {
                    const isAlreadySaved = papers.some((p) => p.doi === paper.doi || p.title === paper.title);

                    return (
                      <div
                        key={paper.doi || paper.pmid || idx}
                        className="p-3 rounded-lg border border-border/80 bg-muted/20 hover:border-primary/40 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-xs font-semibold text-foreground leading-snug">
                            {paper.title}
                          </h4>

                          {isAlreadySaved ? (
                            <span className="px-2 py-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Saved in Library
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSaveToLibrary(paper)}
                              disabled={isPending}
                              className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors flex items-center gap-1 shrink-0 shadow-xs"
                            >
                              <Plus className="w-3 h-3" /> Save to Lab
                            </button>
                          )}
                        </div>

                        <div className="text-[11px] text-muted-foreground">
                          {paper.authors}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          {paper.journal && (
                            <span className="text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                              {paper.journal}
                            </span>
                          )}
                          {paper.pubYear && (
                            <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                              {paper.pubYear}
                            </span>
                          )}
                          {paper.isOpenAccess && (
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-medium">
                              Open Access
                            </span>
                          )}
                          {paper.citedByCount > 0 && (
                            <span className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
                              {paper.citedByCount} citations
                            </span>
                          )}
                          {paper.doi && (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-0.5 ml-auto"
                            >
                              DOI <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {isSafeHttpUrl(paper.pdfUrl) && (
                            <a
                              href={paper.pdfUrl!}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              PDF <FileText className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>

                        {paper.abstractText && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {paper.abstractText}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Enter a keyword or author name to query Europe PMC.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>Sourced from Europe PMC open access REST API.</span>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs bg-muted hover:bg-accent text-foreground transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
