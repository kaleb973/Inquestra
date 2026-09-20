'use client';
// src/components/admin/InventoryManager.tsx

import { useState, useTransition } from 'react';
import { addInventoryItem, updateInventoryStock, deleteInventoryItem } from '@/actions/adminActions';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { InventoryItem, StorageLocation } from '@prisma/client';

type PopulatedItem = InventoryItem & { location: { name: string } | null };

export function InventoryManager({ items, locations }: { items: PopulatedItem[], locations: StorageLocation[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addInventoryItem(formData);
      if (!res.success) setError(res.error || 'Failed to add item');
      else setShowAdd(false);
    });
  };

  const handleUpdate = async (id: string, newQty: string) => {
    const qty = parseFloat(newQty);
    if (isNaN(qty)) return;
    startTransition(async () => {
      await updateInventoryStock(id, qty);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    startTransition(async () => {
      await deleteInventoryItem(id);
    });
  };

  const isExpiringSoon = (date: Date | null) => {
    if (!date) return false;
    const daysLeft = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 30;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Reagents & Specimens</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <input required name="name" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select required name="type" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500">
                <option value="REAGENT">Reagent</option>
                <option value="CHEMICAL">Chemical</option>
                <option value="BIOLOGICAL">Biological</option>
                <option value="PLASMID">Plasmid</option>
                <option value="CELL_LINE">Cell Line</option>
                <option value="CONSUMABLE">Consumable</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Lot Number</label>
              <input name="lotNumber" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
              <input required type="number" step="any" name="quantity" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Unit</label>
              <input required name="unit" placeholder="mL, g..." className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Low Stock Alert</label>
              <input type="number" step="any" name="thresholdValue" defaultValue="0" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Expiry Date</label>
              <input type="date" name="expirationDate" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
              <select name="locationId" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500">
                <option value="">Unassigned</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border mt-2">
            <button disabled={isPending} type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 shadow-sm">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Item'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] bg-muted/40 font-semibold">
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Lot #</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Expiry</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No inventory items.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                <td className="px-5 py-3 text-foreground font-medium">
                  {item.name}
                  {(item.quantity < item.thresholdValue) && <span className="ml-2 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 rounded">LOW STOCK</span>}
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] bg-muted border border-border px-2 py-0.5 rounded text-foreground font-mono">
                    {item.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground font-mono">{item.lotNumber || '—'}</td>
                <td className="px-5 py-3 font-mono flex items-center">
                  <input 
                    type="number"
                    step="any"
                    defaultValue={item.quantity}
                    onBlur={(e) => { if (e.target.value !== String(item.quantity)) handleUpdate(item.id, e.target.value) }}
                    className="w-16 bg-transparent border-b border-transparent hover:border-border focus:border-indigo-500 focus:outline-none text-foreground mr-1 px-1 py-0.5 rounded-none"
                  />
                  <span className="text-muted-foreground text-xs">{item.unit}</span>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {item.location?.name || '—'}
                </td>
                <td className="px-5 py-3 text-xs">
                  {item.expirationDate ? (
                    <span className={isExpiringSoon(item.expirationDate) ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                      {new Date(item.expirationDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
