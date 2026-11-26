'use client';
// src/components/editor/nodes/CitationNode.tsx
// TipTap custom node for scientific literature & research paper citations.
// Renders an immutable, publication-grade citation card directly in the notebook sheet.

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  ExternalLink,
  FileText,
  Copy,
  Check,
  Search,
  X,
  Quote,
} from 'lucide-react';
import {
  searchExternalLiterature,
  fetchTrialPapers,
  linkPaperToTrial,
  type LiteratureSearchResult,
} from '@/actions/literatureActions';
import { useNotebookStore } from '@/store/useNotebookStore';

export const CitationExtension = Node.create({
  name: 'citationBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      paperId: { default: null },
      title: { default: '' },
      authors: { default: '' },
      journal: { default: null },
      pubYear: { default: null },
      doi: { default: null },
      pmid: { default: null },
      pmcid: { default: null },
      url: { default: null },
      pdfUrl: { default: null },
      isOpenAccess: { default: false },
      citationCount: { default: 0 },
      notes: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="citationBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'citationBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CitationNodeView);
  },
});

function CitationNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const isSealed = !!activeTrial?.checksum;

  const {
    title,
    authors = '',
    journal,
    pubYear,
    doi,
    pmid,
    url,
    pdfUrl,
    isOpenAccess,
    notes = '',
  } = node.attrs;

  const authorArray: string[] = Array.isArray(authors)
    ? authors
    : typeof authors === 'string'
    ? authors.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(!title);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LiteratureSearchResult[]>([]);
  const [recentPapers, setRecentPapers] = useState<Awaited<ReturnType<typeof fetchTrialPapers>>>([]);

  // Load trial's cited papers if any to provide quick selection
  useEffect(() => {
    if (!title && cloudTrialId) {
      fetchTrialPapers(cloudTrialId)
        .then((papers) => setRecentPapers(papers))
        .catch(console.error);
    }
  }, [title, cloudTrialId]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchExternalLiterature(query, 1, 6);
      setResults(res.results);
    } catch (e) {
      console.error('Literature search failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaper = async (paper: LiteratureSearchResult) => {
    updateAttributes({
      paperId: paper.id || null,
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
      notes: '',
    });
    setIsSearching(false);

    // If active trial exists, also record citation link in database
    if (cloudTrialId) {
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
      } catch (e) {
        console.error('Failed to link paper to trial DB:', e);
      }
    }
  };

  const handleCopyAPA = () => {
    const authorStr =
      authorArray.length > 0
        ? authorArray.slice(0, 3).join(', ') + (authorArray.length > 3 ? ' et al.' : '')
        : (typeof authors === 'string' && authors ? authors : 'Unknown Author');
    const yearStr = pubYear ? `(${pubYear}).` : '';
    const journalStr = journal ? `${journal}.` : '';
    const doiStr = doi ? `https://doi.org/${doi}` : (url || '');
    const citation = `${authorStr} ${yearStr} ${title}. ${journalStr} ${doiStr}`.trim();

    navigator.clipboard.writeText(citation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Unconfigured / Search Mode ──
  if (isSearching || !title) {
    return (
      <NodeViewWrapper className="my-3">
        <div className="border border-border/80 bg-background/95 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Insert Scientific Citation</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Europe PMC</span>
            </div>
            {!isSealed && (
              <button
                type="button"
                onClick={deleteNode}
                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                title="Remove Citation Block"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Europe PMC by title, author, DOI, or keyword (e.g., 'CRISPR Cas9 biosensor')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-muted-foreground">Quick Topics:</span>
            {['Microfluidics', 'Optogenetics', 'CRISPR Cas9', 'ECG Artifact Removal', 'Biocompatible Polymers'].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setQuery(kw);
                  searchExternalLiterature(kw, 1, 6).then((res) => setResults(res.results)).catch(console.error);
                }}
                className="text-[10px] bg-muted hover:bg-accent text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/50 transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Search Results list */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto pt-2 border-t border-border/50">
              {results.map((res, i) => (
                <div
                  key={res.doi || res.pmid || i}
                  className="p-2.5 rounded border border-border/60 bg-muted/20 hover:bg-accent/40 hover:border-primary/40 transition-all flex flex-col gap-1 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-foreground line-clamp-1">{res.title}</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPaper(res)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded border border-primary/20 shrink-0 transition-colors"
                    >
                      Cite This
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate max-w-[200px]">
                      {res.authors}
                    </span>
                    {res.journal && <span>• {res.journal}</span>}
                    {res.pubYear && <span>({res.pubYear})</span>}
                    {res.isOpenAccess && (
                      <span className="text-emerald-500 font-medium bg-emerald-500/10 px-1 rounded">OA</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trial cited papers quick select */}
          {recentPapers.length > 0 && results.length === 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Already Cited in this Experiment:
              </span>
              <div className="space-y-1">
                {recentPapers.map((tp) => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() =>
                      handleSelectPaper({
                        id: tp.paper.id,
                        title: tp.paper.title,
                        authors: tp.paper.authors,
                        journal: tp.paper.journal || '',
                        pubYear: tp.paper.pubYear,
                        doi: tp.paper.doi,
                        pmid: tp.paper.pmid,
                        pmcid: tp.paper.pmcid,
                        abstractText: tp.paper.abstract,
                        url: tp.paper.url || '',
                        pdfUrl: tp.paper.pdfUrl,
                        isOpenAccess: tp.paper.isOpenAccess,
                        citedByCount: tp.paper.citationCount,
                        tags: tp.paper.tags || [],
                        isSavedInLab: true,
                        isCitedInTrial: true,
                      })
                    }
                    className="w-full text-left p-1.5 text-xs rounded hover:bg-muted text-foreground flex items-center justify-between border border-transparent hover:border-border"
                  >
                    <span className="truncate max-w-[360px]">{tp.paper.title}</span>
                    <span className="text-[10px] text-primary shrink-0 ml-2">Select</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  // ── Publication-Grade Rendered Citation Card ──
  const authorDisplay =
    authorArray.length > 0
      ? authorArray.slice(0, 3).join(', ') + (authorArray.length > 3 ? ` +${authorArray.length - 3} others` : '')
      : (typeof authors === 'string' && authors ? authors : 'Author(s) unlisted');

  return (
    <NodeViewWrapper className="my-3">
      <div className="group relative border border-border/90 bg-card rounded-lg p-3.5 shadow-sm hover:border-primary/40 transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="mt-0.5 p-1 rounded bg-primary/10 text-primary shrink-0">
              <Quote className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                {title}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {authorDisplay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              aria-label="Copy APA citation"
              onClick={handleCopyAPA}
              className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
              title="Copy APA Citation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {doi && (
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open DOI resolver"
                className="p-1 text-muted-foreground hover:text-primary rounded hover:bg-muted transition-colors"
                title="Open DOI resolver"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Open-Access Full-Text PDF"
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                title="Open Open-Access Full-Text PDF"
              >
                <FileText className="w-3.5 h-3.5" />
              </a>
            )}
            {!isSealed && (
              <button
                type="button"
                onClick={deleteNode}
                className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10 transition-colors"
                title="Remove citation block"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Metadata Badges */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
          {journal && (
            <span className="font-medium text-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
              {journal}
            </span>
          )}
          {pubYear && (
            <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 font-mono">
              {pubYear}
            </span>
          )}
          {isOpenAccess && (
            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
              Open Access
            </span>
          )}
          {doi && (
            <span className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono truncate max-w-[180px]">
              DOI: {doi}
            </span>
          )}
          {pmid && (
            <span className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-mono">
              PMID: {pmid}
            </span>
          )}
        </div>

        {/* Optional Annotation Notes */}
        {notes && (
          <div className="mt-2.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground italic bg-muted/20 px-2 py-1.5 rounded">
            &ldquo;{notes}&rdquo;
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
