'use client';

import { useState, useTransition } from 'react';
import { addStorageLocation } from '@/actions/adminActions';
import { Loader2, Box, FolderTree, QrCode } from 'lucide-react';
import type { StorageLocation } from '@prisma/client';
import { BarcodeLabel, type BarcodeLabelItem } from '@/components/admin/BarcodeLabel';

type PopulatedLocation = StorageLocation & {
  children: StorageLocation[];
  items: { id: string; name: string }[];
};

export function StorageManager({ locations }: { locations: PopulatedLocation[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<BarcodeLabelItem | null>(null);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addStorageLocation(formData);
      if (!res.success) setError(res.error || 'Failed to add location');
      else setShowAdd(false);
    });
  };

  const topLevelLocations = locations.filter((l) => !l.parentId);

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Storage Map</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage physical storage hierarchy (Freezers, Racks, Boxes)</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-muted hover:bg-accent text-foreground border border-border rounded-lg transition-colors font-medium shadow-sm"
        >
          <FolderTree className="w-4 h-4" /> Add Location
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card border border-border p-5 rounded-xl shadow-sm flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Location Name</label>
            <input required name="name" placeholder="e.g. -80°C Freezer A" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
            <select name="type" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500">
              <option value="FREEZER">Freezer / Fridge</option>
              <option value="RACK">Rack / Shelf</option>
              <option value="BOX">Box / Plate</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Parent Location (Optional)</label>
            <select name="parentId" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500">
              <option value="">None (Top Level)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
              ))}
            </select>
          </div>
          <button disabled={isPending} type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 shadow-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topLevelLocations.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
            No storage locations defined yet.
          </div>
        )}
        {topLevelLocations.map((loc) => (
          <LocationNode
            key={loc.id}
            location={loc}
            allLocations={locations}
            onSelectLabel={setSelectedLabel}
          />
        ))}
      </div>

      {selectedLabel && (
        <BarcodeLabel
          item={selectedLabel}
          onClose={() => setSelectedLabel(null)}
        />
      )}
    </div>
  );
}

function LocationNode({
  location,
  allLocations,
  onSelectLabel,
}: {
  location: PopulatedLocation;
  allLocations: PopulatedLocation[];
  onSelectLabel: (item: BarcodeLabelItem) => void;
}) {
  // Find children since our simple prisma include only went one level deep
  const children = allLocations.filter((l) => l.parentId === location.id);
  
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-foreground">{location.name}</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-mono">
            {location.type}
          </span>
        </div>
        <button
          onClick={() =>
            onSelectLabel({
              id: location.id,
              name: location.name,
              barcode: location.barcode,
              subtitle: `${location.type} · ${location.items.length} items`,
              type: 'storage',
            })
          }
          title="Print Location QR label"
          className="p-1 rounded text-muted-foreground hover:text-indigo-500 hover:bg-accent transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {location.items.length > 0 && (
        <div className="mb-3 space-y-1">
          {location.items.map((item) => (
            <div key={item.id} className="text-xs text-foreground flex items-center gap-2 pl-2">
              <div className="w-1 h-1 rounded-full bg-indigo-500" />
              {item.name}
            </div>
          ))}
        </div>
      )}

      {children.length > 0 && (
        <div className="space-y-2 pl-4 border-l border-border/40 ml-2 mt-2">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              allLocations={allLocations}
              onSelectLabel={onSelectLabel}
            />
          ))}
        </div>
      )}
      
      {children.length === 0 && location.items.length === 0 && (
        <p className="text-xs text-muted-foreground italic pl-2">Empty</p>
      )}
    </div>
  );
}
