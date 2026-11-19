"use client";
import { useState, useEffect, useRef } from 'react';
import { Tag, Plus, X, Activity, Box, FileKey, History, Quote, PanelRightClose, MapPin, QrCode } from 'lucide-react';
import { useNotebookStore, RightDrawerMode } from '@/store/useNotebookStore';
import { TelemetryMonitor } from '@/components/hardware/TelemetryMonitor';
import { VersionHistory } from '@/components/editor/tools/VersionHistory';
import { SignaturePanel } from '@/components/editor/tools/SignaturePanel';
import { LiteraturePanel } from '@/components/literature/LiteraturePanel';
import type { MetadataEntry } from '@/types/inquestra';
import type { Role } from '@prisma/client';

import { fetchInventoryForSearch } from '@/actions/adminActions';
import { getTrialInventory } from '@/actions/reagentActions';
import { getCurrentUserProfile } from '@/actions/adminActions';
import { saveTrial, sealTrial } from '@/actions/trialActions';

export function RightDrawer() {
  const isRightDrawerOpen = useNotebookStore((s) => s.isRightDrawerOpen);
  const toggleRightDrawer = useNotebookStore((s) => s.toggleRightDrawer);
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const metadata = activeTrial?.metadata || [];
  const addMetadata = useNotebookStore((s) => s.addMetadata);
  const removeMetadata = useNotebookStore((s) => s.removeMetadata);
  const isSealed = !!activeTrial?.checksum;
  
  const rightDrawerMode = useNotebookStore((s) => s.rightDrawerMode);
  const setRightDrawerMode = useNotebookStore((s) => s.setRightDrawerMode);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Compliance: current user profile for SignaturePanel
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserProfile().then((p) => {
      if (p) {
        setUserRole(p.role);
        setUserEmail(p.email);
      }
    }).catch(console.error);
  }, []);
  
  // Inventory state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [linkedItems, setLinkedItems] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);

  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Fetch linked items and listen for live updates from notebook deductions
  useEffect(() => {
    async function loadLinked() {
      if (!activeTrial?.id || rightDrawerMode !== 'INVENTORY') return;
      setIsLoadingLinked(true);
      try {
        const items = await getTrialInventory(activeTrial.id);
        setLinkedItems(items);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingLinked(false);
      }
    }
    loadLinked();

    const handleInventoryUpdate = () => {
      loadLinked();
      // Also refresh stock levels in search results
      fetchInventoryForSearch(searchQueryRef.current).then(setSearchResults).catch(console.error);
    };

    window.addEventListener('inquestra:inventory-updated', handleInventoryUpdate);
    return () => window.removeEventListener('inquestra:inventory-updated', handleInventoryUpdate);
  }, [activeTrial?.id, rightDrawerMode]);

  // Debounced search (and initial load when empty)
  useEffect(() => {
    if (rightDrawerMode !== 'INVENTORY') return;
    
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await fetchInventoryForSearch(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, searchQuery ? 300 : 0);
    
    return () => clearTimeout(timer);
  }, [searchQuery, rightDrawerMode]);

  const insertReagentIntoDoc = (item: { name: string; unit: string }) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('inquestra:insert-reagent', {
          detail: { name: item.name, unit: item.unit },
        })
      );
    }
  };

  const handleAddTag = async () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;

    const entry: MetadataEntry = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      key,
      value,
    };
    addMetadata(entry);
    setNewKey('');
    setNewValue('');

    if (cloudTrialId) {
      const nextMetadata = [...metadata, entry];
      const setSaveStatus = useNotebookStore.getState().setSaveStatus;
      const setLastSavedAt = useNotebookStore.getState().setLastSavedAt;
      setSaveStatus('SAVING');
      try {
        const res = await saveTrial({
          trialId: cloudTrialId,
          title: activeTrial.title,
          content: activeTrial.content,
          metadata: nextMetadata,
          createRevision: false,
        });
        if (res.success) {
          setSaveStatus('SAVED');
          setLastSavedAt(res.savedAt || new Date().toISOString());
        }
      } catch (e) {
        console.error('Failed to persist metadata tag:', e);
      }
    }
  };

  const handleRemoveTag = async (id: string) => {
    removeMetadata(id);
    if (cloudTrialId) {
      const nextMetadata = metadata.filter((m) => m.id !== id);
      const setSaveStatus = useNotebookStore.getState().setSaveStatus;
      const setLastSavedAt = useNotebookStore.getState().setLastSavedAt;
      setSaveStatus('SAVING');
      try {
        const res = await saveTrial({
          trialId: cloudTrialId,
          title: activeTrial.title,
          content: activeTrial.content,
          metadata: nextMetadata,
          createRevision: false,
        });
        if (res.success) {
          setSaveStatus('SAVED');
          setLastSavedAt(res.savedAt || new Date().toISOString());
        }
      } catch (e) {
        console.error('Failed to remove metadata tag on server:', e);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTag();
  };

  return (
    <aside
      className={`bg-background/95 backdrop-blur-md border-l border-border flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out fixed inset-y-14 right-0 z-40 max-w-[90vw] lg:max-w-none lg:static lg:inset-auto lg:h-auto lg:z-10 ${
        isRightDrawerOpen
          ? 'w-[360px] translate-x-0 opacity-100 shadow-2xl lg:shadow-none'
          : 'w-0 border-l-0 opacity-0 pointer-events-none translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Drawer Mode Tabs */}
      <div className="flex border-b border-border bg-muted/30 items-center">
        <button 
          onClick={() => setRightDrawerMode('TELEMETRY')}
          className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'TELEMETRY' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live DAQ
        </button>
        <button 
          onClick={() => setRightDrawerMode('INVENTORY')}
          className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'INVENTORY' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Box className="w-3.5 h-3.5" />
          LIMS
        </button>
        <button 
          onClick={() => setRightDrawerMode('LITERATURE')}
          className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'LITERATURE' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          title="Literature & Citations (Europe PMC)"
        >
          <Quote className="w-3.5 h-3.5" />
          Papers
        </button>
        <button 
          onClick={() => setRightDrawerMode('COMPLIANCE')}
          className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'COMPLIANCE' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <FileKey className="w-3.5 h-3.5" />
          Compliance
        </button>
        <button 
          onClick={() => setRightDrawerMode('HISTORY')}
          className={`flex-1 py-2.5 text-[10px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'HISTORY' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
        {/* Close drawer button */}
        <button
          onClick={toggleRightDrawer}
          className="px-2.5 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 border-b-2 border-transparent transition-colors flex items-center justify-center shrink-0"
          title="Close telemetry drawer (Ctrl+J)"
          aria-label="Close telemetry drawer"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
        {rightDrawerMode === 'TELEMETRY' && (
          <div className="flex-1 overflow-y-auto">
            <TelemetryMonitor />
          </div>
        )}

        {rightDrawerMode === 'INVENTORY' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-border bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Lab Inventory</h3>
                <span className="text-[10px] text-muted-foreground font-mono">LIMS-lite</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Scan with a barcode gun or click <span className="text-emerald-500 font-medium">Use in Note</span> to link chemicals to your protocol.
              </p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Scan barcode or search reagent, lot #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length === 1) {
                      e.preventDefault();
                      insertReagentIntoDoc({
                        name: searchResults[0].name,
                        unit: searchResults[0].unit,
                      });
                      setSearchQuery('');
                    }
                  }}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors shadow-sm"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Linked to active trial */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Linked to This Trial</span>
                  <button
                    onClick={() => insertReagentIntoDoc({ name: '', unit: 'mL' })}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Reagent
                  </button>
                </div>
                
                {isLoadingLinked ? (
                  <p className="text-xs text-muted-foreground italic px-1">Loading linked items...</p>
                ) : linkedItems.length === 0 ? (
                  <div className="bg-background/50 border border-dashed border-border rounded-lg p-4 text-center">
                    <span className="text-xs text-muted-foreground block mb-2">No inventory logged for this trial yet.</span>
                    <button
                      onClick={() => insertReagentIntoDoc({ name: '', unit: 'mL' })}
                      className="px-2.5 py-1 text-xs bg-muted hover:bg-accent border border-border rounded text-foreground transition-colors inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Insert Reagent Log
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedItems.map((link) => (
                      <div key={link.id} className="bg-card border border-border rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-foreground">{link.inventoryItem.name}</span>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                            {link.quantityUsed} {link.unit} used
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-2">
                          <span className="uppercase tracking-wider font-mono text-[9px] bg-muted border border-border/60 px-1 py-0.5 rounded text-foreground">{link.inventoryItem.type}</span>
                          {link.inventoryItem.location && (
                            <span>• {link.inventoryItem.location.name}</span>
                          )}
                          {link.inventoryItem.lotNumber && (
                            <span className="font-mono text-muted-foreground">• Lot: {link.inventoryItem.lotNumber}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Inventory Search / Browse */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {searchQuery ? 'Search Results' : 'Lab Inventory (Available)'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{searchResults.length} items</span>
                </div>
                
                {isSearching ? (
                  <p className="text-xs text-muted-foreground italic px-1">Searching inventory...</p>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No inventory items found matching &quot;{searchQuery}&quot;.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-card border border-border hover:border-emerald-500/40 transition-colors rounded-lg p-3 group relative shadow-sm"
                      >
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded border ${
                            item.quantity < item.thresholdValue 
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                              : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground mb-3">
                          <span className="uppercase tracking-wider font-mono text-[9px] bg-muted border border-border/60 px-1 py-0.5 rounded text-foreground">
                            {item.type}
                          </span>
                          
                          {item.location && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {item.location.name}
                            </span>
                          )}
                          
                          {item.expirationDate && (
                            <span className={
                              ((new Date(item.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30
                                ? 'text-red-500 font-medium'
                                : 'text-muted-foreground'
                            }>
                              Exp: {new Date(item.expirationDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {item.lotNumber ? `Lot #${item.lotNumber}` : 'No lot #'}
                          </span>
                          <button
                            onClick={() => insertReagentIntoDoc({ name: item.name, unit: item.unit })}
                            className="px-2 py-1 text-[10px] font-medium bg-muted text-muted-foreground hover:bg-primary hover:text-white rounded border border-border transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3" /> Use in Note
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {rightDrawerMode === 'LITERATURE' && (
          <LiteraturePanel />
        )}

        {rightDrawerMode === 'COMPLIANCE' && (
          <div className="p-4 overflow-y-auto flex-1 space-y-6">
            {/* Electronic Signatures — live SignaturePanel */}
            <SignaturePanel
              trialId={cloudTrialId}
              isSynced={!!cloudTrialId}
              isSealed={isSealed}
              currentUserRole={userRole}
              currentUserEmail={userEmail}
              onRequestSeal={async () => {
                if (cloudTrialId) {
                  try {
                    const res = await sealTrial(cloudTrialId);
                    if (res.success) {
                      window.location.reload();
                    } else {
                      console.warn('Seal failed:', res.error);
                    }
                  } catch (err) {
                    console.error('Seal error:', err);
                  }
                }
              }}
            />

            {/* NIH FAIR Metadata */}
            <div className="border-t border-border/60 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  NIH FAIR Metadata
                </span>
              </div>
              <div className="space-y-2 mb-5">
                {metadata.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No metadata tags yet.</p>
                )}
                {metadata.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 group">
                    <div className="flex-1 bg-background border border-border rounded px-3 py-2 min-w-0 shadow-sm">
                      <span className="block text-[10px] font-mono text-muted-foreground truncate mb-0.5">{entry.key}</span>
                      <span className="block text-xs text-foreground break-words">{entry.value}</span>
                    </div>
                    {!isSealed && (
                      <button
                        onClick={() => handleRemoveTag(entry.id)}
                        className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!isSealed && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground block font-medium">Quick Categories:</span>
                    <div className="flex flex-wrap gap-1">
                      {['DAQ Run', 'Biomarker Assay', 'Protocol Execution', 'Calibration', 'Quality Control'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setNewKey('category');
                            setNewValue(cat);
                          }}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted/80 hover:bg-accent border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          +{cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Key (e.g. category, organism)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. DAQ Run, Homo sapiens)"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddTag}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-secondary hover:bg-secondary/80 border border-border text-xs text-secondary-foreground font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Metadata Tag
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {rightDrawerMode === 'HISTORY' && (
          <div className="flex-1 overflow-hidden flex flex-col bg-background">
            <VersionHistory trialId={activeTrial?.id ?? null} isSynced={!!cloudTrialId} />
          </div>
        )}
      </div>
    </aside>
  );
}
