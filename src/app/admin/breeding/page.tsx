'use client';

import { useEffect, useState } from 'react';
import { breedingRecordService, livestockService } from '@/services/firestore.service';
import type { BreedingRecord, Livestock } from '@/types/livestock.types';

const ic = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

const STATUS_CFG = {
  planned: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', dot: 'bg-sky-500', card: 'border-sky-100' },
  pregnant: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', card: 'border-amber-100' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', card: 'border-emerald-100' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500', card: 'border-red-100' },
};

export default function BreedingPage() {
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [r, l] = await Promise.all([breedingRecordService.getAll(), livestockService.getAll()]);
      setRecords(r);
      setLivestock(l);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  const stats = {
    total: records.length,
    planned: records.filter((r) => r.status === 'planned').length,
    pregnant: records.filter((r) => r.status === 'pregnant').length,
    delivered: records.filter((r) => r.status === 'delivered').length,
    failed: records.filter((r) => r.status === 'failed').length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Livestock Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Breeding Records</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pantau rekod pembiakan, kehamilan dan kelahiran ternakan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 self-start sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Breeding Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} tone="slate" />
        <StatCard label="Planned" value={stats.planned} tone="sky" />
        <StatCard label="Pregnant" value={stats.pregnant} tone="amber" />
        <StatCard label="Delivered" value={stats.delivered} tone="emerald" />
        <StatCard label="Failed" value={stats.failed} tone="red" />
      </div>

      {/* Tabs + Cards */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-5 pb-0 overflow-x-auto">
          {(['all', 'planned', 'pregnant', 'delivered', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-all -mb-px ${
                filter === s ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'all' ? 'All Records' : s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<DnaIcon className="h-8 w-8 text-slate-400" />}
            title="No breeding records found"
            description="Start tracking your livestock breeding by adding a new record."
            action={
              <button onClick={() => setShowAddModal(true)} className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition">
                + Add First Record
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {filtered.map((record) => <BreedingCard key={record.id} record={record} />)}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBreedingModal livestock={livestock} onClose={() => setShowAddModal(false)} onSuccess={loadData} />
      )}
    </div>
  );
}

function BreedingCard({ record }: { record: BreedingRecord }) {
  const cfg = STATUS_CFG[record.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.planned;

  const daysUntil =
    record.status === 'pregnant'
      ? Math.ceil((new Date(record.expectedDeliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  const gestationProgress = daysUntil !== null ? Math.max(0, Math.min(100, (1 - daysUntil / 280) * 100)) : 0;

  return (
    <div className={`rounded-2xl border p-5 transition hover:shadow-md ${cfg.card} bg-white`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
            <DnaIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Breeding #{record.id?.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-slate-500">{new Date(record.breedingDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cfg.bg} ${cfg.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {record.status}
        </span>
      </div>

      {/* Parents */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-pink-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pink-500 mb-0.5">Mother</p>
          <p className="text-sm font-semibold text-pink-800 truncate">{record.motherId}</p>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-500 mb-0.5">Father</p>
          <p className="text-sm font-semibold text-sky-800 truncate">{record.fatherId || 'Unknown'}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-slate-500">Expected delivery</span>
          <span className="font-semibold text-slate-800">{new Date(record.expectedDeliveryDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {record.actualDeliveryDate && (
          <div className="flex justify-between">
            <span className="text-slate-500">Actual delivery</span>
            <span className="font-semibold text-slate-800">{new Date(record.actualDeliveryDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {(record.numberOfOffspring ?? 0) > 0 && (
          <div className="flex justify-between">
            <span className="text-slate-500">Offspring</span>
            <span className="font-semibold text-emerald-700">{record.numberOfOffspring} born</span>
          </div>
        )}
      </div>

      {/* Gestation progress */}
      {daysUntil !== null && (
        <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
          <div className="flex justify-between text-xs font-semibold text-amber-700 mb-2">
            <span>Gestation progress</span>
            <span>{daysUntil > 0 ? `${daysUntil} days left` : 'Due today!'}</span>
          </div>
          <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all" style={{ width: `${gestationProgress}%` }} />
          </div>
        </div>
      )}

      {record.notes && (
        <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">{record.notes}</p>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'sky' | 'amber' | 'emerald' | 'red' }) {
  const tones = {
    slate: { wrap: 'border-slate-200 bg-white', val: 'text-slate-900' },
    sky: { wrap: 'border-sky-100 bg-sky-50/50', val: 'text-sky-700' },
    amber: { wrap: 'border-amber-100 bg-amber-50/50', val: 'text-amber-700' },
    emerald: { wrap: 'border-emerald-100 bg-emerald-50/50', val: 'text-emerald-700' },
    red: { wrap: 'border-red-100 bg-red-50/50', val: 'text-red-700' },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-2xl border p-5 ${t.wrap}`}>
      <p className={`text-3xl font-bold tabular-nums ${t.val}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-16 text-center px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">{icon}</div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>
      {action}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-64 rounded-[28px] bg-slate-200" />
    </div>
  );
}

function DnaIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function AddBreedingModal({ livestock, onClose, onSuccess }: { livestock: Livestock[]; onClose: () => void; onSuccess: () => void }) {
  const females = livestock.filter((l) => l.gender === 'female');
  const males = livestock.filter((l) => l.gender === 'male');
  const [form, setForm] = useState({ motherId: '', fatherId: '', breedingDate: new Date().toISOString().split('T')[0], expectedDeliveryDate: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await breedingRecordService.create({
        motherId: form.motherId,
        fatherId: form.fatherId || undefined,
        breedingDate: new Date(form.breedingDate),
        expectedDeliveryDate: new Date(form.expectedDeliveryDate),
        status: 'planned',
        notes: form.notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Breeding Record</h2>
            <p className="text-sm text-slate-500">Log rekod pembiakan ternakan baru</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Mother (Female) *</label>
              <select required value={form.motherId} onChange={(e) => setForm({ ...form, motherId: e.target.value })} className={ic}>
                <option value="">Select mother</option>
                {females.map((a) => <option key={a.id} value={a.id}>{a.tagId} — {a.breed}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Father (Male)</label>
              <select value={form.fatherId} onChange={(e) => setForm({ ...form, fatherId: e.target.value })} className={ic}>
                <option value="">Optional</option>
                {males.map((a) => <option key={a.id} value={a.id}>{a.tagId} — {a.breed}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Breeding Date *</label>
              <input type="date" required value={form.breedingDate} onChange={(e) => setForm({ ...form, breedingDate: e.target.value })} className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Expected Delivery *</label>
              <input type="date" required value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} className={ic} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Notes</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." className={ic} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Record'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
