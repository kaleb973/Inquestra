'use client';
// src/components/admin/InventoryManager.tsx

import { useState, useTransition } from 'react';
import { addInventoryItem, updateInventoryStock, deleteInventoryItem } from '@/actions/adminActions';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import type { Inventory } from '@prisma/client';

export function InventoryManager({ items }: { items: Inventory[] }) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Reagent Inventory</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {error && <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 text-sm rounded">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-muted border border-border p-4 rounded-lg flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Chemical Name</label>
            <input required name="chemical" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
            <input required type="number" step="any" name="quantity" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Unit</label>
            <input required name="unit" placeholder="mL, g..." className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Alert Threshold</label>
            <input required type="number" step="any" name="thresholdValue" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <button disabled={isPending} type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </button>
        </form>
      )}

      <div className="bg-muted border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-xs bg-background/50">
              <th className="px-5 py-3 font-medium">Chemical</th>
              <th className="px-5 py-3 font-medium">Quantity</th>
              <th className="px-5 py-3 font-medium">Threshold</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-600">No inventory items.</td></tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="hover:bg-neutral-800/30 transition-colors">
                <td className="px-5 py-3 text-neutral-200">
                  {item.chemical}
                  {item.alertFlag && <span className="ml-2 text-[10px] text-amber-400 border border-amber-900/50 bg-amber-950/30 px-1.5 py-0.5 rounded">LOW STOCK</span>}
                </td>
                <td className="px-5 py-3 font-mono">
                  <input 
                    type="number"
                    step="any"
                    defaultValue={item.quantity}
                    onBlur={(e) => { if (e.target.value !== String(item.quantity)) handleUpdate(item.id, e.target.value) }}
                    className="w-20 bg-transparent border-b border-transparent hover:border-border focus:border-emerald-500 focus:outline-none text-white mr-1 px-1"
                  />
                  <span className="text-muted-foreground">{item.unit}</span>
                </td>
                <td className="px-5 py-3 font-mono text-muted-foreground">{item.thresholdValue} {item.unit}</td>
                <td className="px-5 py-3 text-right space-x-2">
                  <button onClick={() => handleDelete(item.id)} disabled={isPending} className="text-muted-foreground hover:text-red-400 transition-colors p-1">
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
