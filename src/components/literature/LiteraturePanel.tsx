'use client';
// src/components/literature/LiteraturePanel.tsx
// Right drawer tab for literature discovery, Europe PMC search, and trial citations.
// Fully compliant with Europe PMC open access terms and 21 CFR Part 11 audit logging.

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Quote,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import {
  searchExternalLiterature,
  linkPaperToTrial,
  unlinkPaperFromTrial,
  fetchTrialPapers,
  type LiteratureSearchResult,
} from '@/actions/literatureActions';

const QUICK_TAGS = [
  'Biosensors',
  'Microfluidics',
  'CRISPR Cas9',
  'Tissue Engineering',
  'Optogenetics',
  'Electrophysiology',
  'Organ-on-Chip',
  'Biomarkers',
];

// In-memory client cache to make switching between drawer tabs instantaneous
const trialPapersClientCache = new Map<string, any[]>();

export function LiteraturePanel() {
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const isSealed = !!activeTrial?.checksum;

  const [activeSubTab, setActiveSubTab] = useState<'CITED' | 'SEARCH'>('CITED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LiteratureSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [trialPapers, setTrialPapers] = useState<any[]>(() => {
    return cloudTrialId && trialPapersClientCache.has(cloudTrialId)
      ? trialPapersClientCache.get(cloudTrialId)!
      : [];
  });
  const [isLoadingTrialPapers, setIsLoadingTrialPapers] = useState(() => {
    return !!cloudTrialId && !trialPapersClientCache.has(cloudTrialId);
  });
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Load trial citations with SWR (instant cached render + background refresh)
  const loadTrialPapers = useCallback(async () => {
    if (!cloudTrialId) {
      setTrialPapers([]);
      return;
    }

    const cached = trialPapersClientCache.get(cloudTrialId);
    if (cached) {
      setTrialPapers(cached);
      setIsLoadingTrialPapers(false);
    } else {
      setIsLoadingTrialPapers(true);
    }

    try {
      const papers = await fetchTrialPapers(cloudTrialId);
      trialPapersClientCache.set(cloudTrialId, papers);
      setTrialPapers(papers);
    } catch (e) {
      console.error('Failed to load trial papers:', e);
    } finally {
      setIsLoadingTrialPapers(false);
    }
  }, [cloudTrialId]);

  useEffect(() => {
    loadTrialPapers();
  }, [loadTrialPapers]);

  // Execute Europe PMC search
  const handleExecuteSearch = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await searchExternalLiterature(queryToSearch.trim(), {
        pageSize: 12,
        trialId: cloudTrialId || undefined,
      });
      setSearchResults(res.results);
    } catch (e) {
      console.error('Search failed:', e);
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkToTrial = async (paper: LiteratureSearchResult) => {
    if (!cloudTrialId) {
      alert('Please wait for the experiment to sync to cloud or save it first.');
      return;
    }
    startTransition(async () => {
      try {
        await linkPaperToTrial({
          trialId: cloudTrialId,
          paperData: {
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
          },
        });
        if (cloudTrialId) trialPapersClientCache.delete(cloudTrialId);
        await loadTrialPapers();
        // Update local search result state
        setSearchResults((prev) =>
          prev.map((p) => (p.doi === paper.doi || p.title === paper.title ? { ...p, isCitedInTrial: true } : p))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to link citation');
      }
    });
  };

  const handleUnlink = async (trialPaperId: string) => {
    if (isSealed) {
      alert('This experiment is sealed under 21 CFR Part 11. Citations cannot be removed.');
      return;
    }
    startTransition(async () => {
      try {
        await unlinkPaperFromTrial(trialPaperId);
        if (cloudTrialId) trialPapersClientCache.delete(cloudTrialId);
        await loadTrialPapers();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to remove citation');
      }
    });
  };

  const handleInsertIntoNotebook = (paper: {
    id?: string;
    paperId?: string;
    title: string;
    authors: string | string[];
    journal?: string | null;
    pubYear?: number | null;
    doi?: string | null;
    pmid?: string | null;
    pmcid?: string | null;
    url?: string | null;
    pdfUrl?: string | null;
    isOpenAccess?: boolean;
    citationCount?: number;
    notes?: string | null;
  }) => {
    window.dispatchEvent(
      new CustomEvent('inquestra:insert-citation', {
        detail: {
          paperId: paper.id || paper.paperId || null,
          title: paper.title,
          authors: paper.authors,
          journal: paper.journal,
          pubYear: paper.pubYear,
          doi: paper.doi,
          pmid: paper.pmid,
          pmcid: paper.pmcid,
          url: paper.url,
          pdfUrl: paper.pdfUrl,
          isOpenAccess: paper.isOpenAccess,
          citationCount: paper.citationCount,
          notes: paper.notes,
        },
      })
    );
  };

  const toggleAbstract = (key: string) => {
    setExpandedAbstracts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Sub-tab Navigation */}
      <div className="p-2 border-b border-border bg-muted/40 flex gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('CITED')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'CITED'
              ? 'bg-background shadow-xs text-foreground border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Cited</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono">
            {trialPapers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('SEARCH')}
          className={`flex-1 py-1.5 px-2 text-xs font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'SEARCH'
              ? 'bg-background shadow-xs text-foreground border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Discover</span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Europe PMC</span>
        </button>
      </div>

      {/* Main SubTab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeSubTab === 'CITED' ? (
          <div className="space-y-3">
            {isLoadingTrialPapers ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">Loading experiment citations...</span>
              </div>
            ) : trialPapers.length === 0 ? (
              <div className="py-8 text-center space-y-2 px-3">
                <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs font-medium text-foreground">No citations linked yet</p>
                <p className="text-[11px] text-muted-foreground">
                  Search 44M+ peer-reviewed papers from Europe PMC and attach them to this experiment protocol.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('SEARCH')}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Search className="w-3.5 h-3.5" />
                  Search Literature
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trialPapers.map((tp, idx) => {
                  const paper = tp.paper;
                  const key = `cited-${tp.id}`;
                  const isAbstractOpen = expandedAbstracts[key];

                  return (
                    <div
                      key={tp.id}
                      className="border border-border rounded-lg p-3 bg-muted/10 hover:border-primary/40 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          [{idx + 1}]
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleInsertIntoNotebook({
                                id: paper.id,
                                title: paper.title,
                                authors: paper.authors,
                                journal: paper.journal,
                                pubYear: paper.pubYear,
                                doi: paper.doi,
                                pmid: paper.pmid,
                                pmcid: paper.pmcid,
                                url: paper.url,
                                pdfUrl: paper.pdfUrl,
                                isOpenAccess: paper.isOpenAccess,
                                citationCount: paper.citationCount,
                                notes: tp.notes,
                              })
                            }
                            className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded border border-primary/20 transition-colors flex items-center gap-1"
                            title="Insert citation card into active notebook cursor"
                          >
                            <Plus className="w-3 h-3" /> Note
                          </button>
                          {!isSealed && (
                            <button
                              type="button"
                              onClick={() => handleUnlink(tp.id)}
                              disabled={isPending}
                              className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                              title="Unlink from experiment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-xs font-semibold text-foreground leading-snug">
                        {paper.title}
                      </h4>

                      <div className="text-[11px] text-muted-foreground truncate">
                        {paper.authors}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
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
                      </div>

                      {/* Links and Abstract dropdown */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          {paper.doi && (
                            <a
                              href={`https://doi.org/${paper.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline flex items-center gap-0.5"
                            >
                              DOI <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {paper.pdfUrl && (
                            <a
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              PDF <FileText className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>

                        {paper.abstract && (
                          <button
                            type="button"
                            onClick={() => toggleAbstract(key)}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                          >
                            Abstract {isAbstractOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>

                      {isAbstractOpen && paper.abstract && (
                        <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/40 leading-relaxed mt-1">
                          {paper.abstract}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search keywords, DOI, author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch(searchQuery)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteSearch(searchQuery)}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Quick Topic Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      handleExecuteSearch(tag);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="p-2.5 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20">
                {searchError}
              </div>
            )}

            {/* Results */}
            {isSearching ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">Querying Europe PMC / PubMed Central...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Results ({searchResults.length} papers):
                </span>

                {searchResults.map((paper, idx) => {
                  const key = `search-${paper.doi || paper.pmid || idx}`;
                  const isAbstractOpen = expandedAbstracts[key];

                  return (
                    <div
                      key={key}
                      className="border border-border/80 rounded-lg p-3 bg-muted/10 hover:border-primary/40 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                          {paper.title}
                        </h4>
                      </div>

                      <div className="text-[11px] text-muted-foreground truncate">
                        {paper.authors}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        {paper.journal && (
                          <span className="text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 truncate max-w-[150px]">
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
                      </div>

                      {/* Actions Toolbar */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-1">
                        <div className="flex items-center gap-1.5">
                          {paper.isCitedInTrial ? (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-500/20 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Cited
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLinkToTrial(paper)}
                              disabled={isPending}
                              className="px-2 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Plus className="w-3 h-3" /> Cite in Trial
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleInsertIntoNotebook({
                                id: paper.id,
                                title: paper.title,
                                authors: paper.authors,
                                journal: paper.journal,
                                pubYear: paper.pubYear,
                                doi: paper.doi,
                                pmid: paper.pmid,
                                pmcid: paper.pmcid,
                                url: paper.url,
                                pdfUrl: paper.pdfUrl,
                                isOpenAccess: paper.isOpenAccess,
                                citationCount: paper.citedByCount,
                              })
                            }
                            className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded border border-border transition-colors flex items-center gap-1"
                            title="Drop citation card into TipTap notebook"
                          >
                            <Quote className="w-3 h-3" /> Note
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {paper.pdfUrl && (
                            <a
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Download Open Access PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {paper.abstractText && (
                            <button
                              type="button"
                              onClick={() => toggleAbstract(key)}
                              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                              title="Toggle Abstract"
                            >
                              {isAbstractOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {isAbstractOpen && paper.abstractText && (
                        <div className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded border border-border/40 leading-relaxed mt-1">
                          {paper.abstractText}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Type a biomedical keyword, author name, or DOI above to search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legal & Open Access Notice Footer */}
      <div className="p-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 text-muted-foreground/70" />
        <span className="truncate">
          Europe PMC / PubMed metadata. Open Access articles under respective CC licenses.
        </span>
      </div>
    </div>
  );
}
