'use client';
// src/components/admin/EquipmentManager.tsx

import { useState, useTransition } from 'react';
import { addEquipment, updateEquipmentStatus } from '@/actions/adminActions';
import { Loader2, Plus, Calendar, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import type { Equipment } from '@prisma/client';
import { BarcodeLabel, type BarcodeLabelItem } from '@/components/admin/BarcodeLabel';

export function EquipmentManager({ items }: { items: Equipment[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<BarcodeLabelItem | null>(null);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addEquipment(formData);
      if (!res.success) setError(res.error || 'Failed to add equipment');
      else setShowAdd(false);
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: string, calibratedNow: boolean = false) => {
    startTransition(async () => {
      await updateEquipmentStatus(id, newStatus, calibratedNow);
    });
  };

  const isOverdue = (lastCalibrated: Date, freqDays: number) => {
    const nextDue = new Date(lastCalibrated);
    nextDue.setDate(nextDue.getDate() + freqDays);
    return new Date() > nextDue;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Lab Equipment Calibration</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Equipment
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm rounded">{error}</div>}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card border border-border p-5 rounded-xl shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Equipment Name</label>
            <input required name="name" placeholder="e.g. pH Meter" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Serial Number</label>
            <input name="serialNumber" className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Last Calibrated</label>
            <input required type="date" name="lastCalibrated" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Freq (Days)</label>
            <input required type="number" name="calibrationFreq" defaultValue={30} className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:border-purple-500" />
          </div>
          <div className="hidden">
            <input type="hidden" name="status" value="OPERATIONAL" />
          </div>
          <button disabled={isPending} type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 h-[38px]">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full">No equipment registered.</p>
        )}
        {items.map(item => {
          const overdue = isOverdue(new Date(item.lastCalibrated), item.calibrationFreq);
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex flex-col relative overflow-hidden shadow-sm">
              <div className={`absolute top-0 left-0 w-1 h-full ${item.status === 'BROKEN' ? 'bg-red-500' : overdue ? 'bg-amber-500' : 'bg-indigo-500'}`} />
              
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">SN: {item.serialNumber || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setSelectedLabel({
                        id: item.id,
                        name: item.name,
                        barcode: item.serialNumber ?? null,
                        subtitle: `Status: ${item.status}`,
                        type: 'equipment',
                      })
                    }
                    title="Print Equipment QR label"
                    className="p-1 rounded text-muted-foreground hover:text-purple-500 hover:bg-accent transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                  {item.status === 'BROKEN' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : overdue ? (
                    <Calendar className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-6 pl-2">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Last Calibrated:</span>
                  <span className="text-foreground font-medium">{new Date(item.lastCalibrated).toLocaleDateString()}</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Frequency:</span>
                  <span className="text-foreground font-medium">Every {item.calibrationFreq} days</span>
                </div>
              </div>

              <div className="mt-auto pl-2 flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(item.id, 'OPERATIONAL', true)}
                  disabled={isPending || (item.status === 'OPERATIONAL' && !overdue)}
                  className="flex-1 px-2 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-medium rounded transition-colors border border-border disabled:opacity-50"
                >
                  Log Calibration
                </button>
                <button
                  onClick={() => handleUpdateStatus(item.id, item.status === 'BROKEN' ? 'OPERATIONAL' : 'BROKEN')}
                  disabled={isPending}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors border ${
                    item.status === 'BROKEN' 
                      ? 'border-border bg-muted hover:bg-accent text-foreground' 
                      : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {item.status === 'BROKEN' ? 'Fix' : 'Mark Broken'}
                </button>
              </div>
            </div>
          )
        })}
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
