'use client';

import { useEffect, useState } from 'react';
import { breedingRecordService, livestockService } from '@/services/firestore.service';
import type { BreedingRecord, Livestock } from '@/types/livestock.types';

const ic = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200';

const DUMMY_RECORDS: BreedingRecord[] = [
  {
    id: 'demo-1', motherId: 'COW-00003', fatherId: 'COW-00007',
    breedingDate: new Date('2026-01-15'),
    expectedDeliveryDate: new Date('2026-10-22'),
    status: 'pregnant',
    notes: 'Natural mating confirmed. First pregnancy for this pair. Weekly monitoring in progress.',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'demo-2', motherId: 'COW-00005', fatherId: 'COW-00009',
    breedingDate: new Date('2025-11-10'),
    expectedDeliveryDate: new Date('2026-08-17'),
    actualDeliveryDate: new Date('2026-02-18'),
    status: 'delivered', numberOfOffspring: 2,
    notes: 'Twin calves delivered successfully. Both dam and calves in good condition.',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'demo-3', motherId: 'COW-00008', fatherId: 'COW-00007',
    breedingDate: new Date('2026-03-20'),
    expectedDeliveryDate: new Date('2026-12-26'),
    status: 'planned',
    notes: 'Scheduled for supervised natural breeding. Vet clearance obtained.',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'demo-4', motherId: 'COW-00002', fatherId: 'COW-00011',
    breedingDate: new Date('2025-08-05'),
    expectedDeliveryDate: new Date('2026-05-12'),
    status: 'failed',
    notes: 'No conception after 2 attempts. Veterinary consultation recommended before next cycle.',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'demo-5', motherId: 'COW-00006', fatherId: 'COW-00007',
    breedingDate: new Date('2026-02-01'),
    expectedDeliveryDate: new Date('2026-11-08'),
    status: 'pregnant',
    notes: 'Second pregnancy. Previous calf (2025) weaned successfully.',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'demo-6', motherId: 'COW-00004', fatherId: 'COW-00009',
    breedingDate: new Date('2025-06-20'),
    expectedDeliveryDate: new Date('2026-03-27'),
    actualDeliveryDate: new Date('2025-12-28'),
    status: 'delivered', numberOfOffspring: 1,
    notes: 'Healthy single calf. Dam recovered well post-partum. Calf weight: 28kg.',
    createdAt: new Date(), updatedAt: new Date(),
  },
];

const STATUS_CFG = {
  planned: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', dot: 'bg-sky-500', card: 'border-sky-100 hover:border-sky-300' },
  pregnant: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-500', card: 'border-amber-100 hover:border-amber-300' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500', card: 'border-emerald-100 hover:border-emerald-300' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', dot: 'bg-red-500', card: 'border-red-100 hover:border-red-300' },
};

export default function BreedingPage() {
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [animalTypeFilter, setAnimalTypeFilter] = useState('all');
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

  const display = records.length > 0 ? records : DUMMY_RECORDS;
  const filtered = display.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (animalTypeFilter !== 'all') {
      const mother = livestock.find((l) => l.id === r.motherId || l.animalId === r.motherId || l.tagId === r.motherId);
      if (!mother || mother.type !== animalTypeFilter) return false;
    }
    return true;
  });

  const stats = {
    total: display.length,
    planned: display.filter((r) => r.status === 'planned').length,
    pregnant: display.filter((r) => r.status === 'pregnant').length,
    delivered: display.filter((r) => r.status === 'delivered').length,
    failed: display.filter((r) => r.status === 'failed').length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-1">Livestock Management</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Breeding Records</h2>
          <p className="mt-1 text-sm text-slate-500">Pantau rekod pembiakan, kehamilan dan kelahiran ternakan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 self-start sm:self-auto group"
        >
          <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Breeding Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} tone="slate" iconSrc="/Breeding/TotalRecords.png" />
        <StatCard label="Planned" value={stats.planned} tone="sky" iconSrc="/Breeding/Planned.png" />
        <StatCard label="Pregnant" value={stats.pregnant} tone="amber" iconSrc="/Breeding/Pregnant.png" />
        <StatCard label="Delivered" value={stats.delivered} tone="emerald" iconSrc="/Breeding/Delivered.png" />
        <StatCard label="Failed" value={stats.failed} tone="red" iconSrc="/Breeding/Failed.png" />
      </div>

      {/* Animal type filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Jenis:</span>
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          {(['all', 'cow', 'goat'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAnimalTypeFilter(t)}
              className={`px-4 py-2 text-sm font-medium transition ${animalTypeFilter === t ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {t === 'all' ? 'All' : t === 'cow' ? '🐄 Cow' : '🐐 Goat'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs + Cards */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Tab bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 pt-5 pb-0 overflow-x-auto scrollbar-hide">
          {(['all', 'planned', 'pregnant', 'delivered', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold border-b-2 capitalize transition-all duration-200 -mb-px ${
                filter === s ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 rounded-t-lg'
              }`}
            >
              {s === 'all' ? 'All Records' : s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<DnaIcon className="h-10 w-10 text-slate-300" />}
            title="No breeding records found"
            description="Start tracking your livestock breeding by adding a new record."
            action={
              <button onClick={() => setShowAddModal(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Add First Record
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 p-6 md:grid-cols-2">
            {filtered.map((record) => <BreedingCard key={record.id} record={record} livestock={livestock} />)}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBreedingModal livestock={livestock} onClose={() => setShowAddModal(false)} onSuccess={loadData} />
      )}
    </div>
  );
}

function BreedingCard({ record, livestock }: { record: BreedingRecord; livestock: Livestock[] }) {
  const mother = findLivestock(livestock, record.motherId);
  const father = record.fatherId ? findLivestock(livestock, record.fatherId) : undefined;
  const motherId = formatLivestockId(mother, record.motherId);
  const fatherId = record.fatherId ? formatLivestockId(father, record.fatherId) : 'Unknown';

  const cfg = STATUS_CFG[record.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.planned;

  const daysUntil =
    record.status === 'pregnant'
      ? Math.ceil((new Date(record.expectedDeliveryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  const gestationProgress = daysUntil !== null ? Math.max(0, Math.min(100, (1 - daysUntil / 280) * 100)) : 0;

  return (
    <div className={`group rounded-[20px] border p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-200 bg-white relative overflow-hidden ${cfg.card}`}>
      {/* Subtle indicator line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${cfg.bg.replace('bg-', 'bg-').replace('50', '400')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      {/* Top row */}
      <div className="flex items-start justify-between mb-5 pl-2">
        <div className="flex items-center gap-3.5">
          <div className="flex-shrink-0">
            <LivestockAvatar animal={mother} fallbackId={motherId} className="h-12 w-12" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-[15px] group-hover:text-emerald-700 transition-colors">Breeding #{record.id?.slice(-6).toUpperCase()}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{new Date(record.breedingDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          {record.status}
        </span>
      </div>

      {/* Parents */}
      <div className="grid grid-cols-1 gap-3 mb-5 pl-2 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-pink-50/80 px-3.5 py-3 border border-pink-100/50 group-hover:bg-pink-50 transition-colors">
          <LivestockAvatar animal={mother} fallbackId={motherId} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-1">Mother</p>
            <p className="text-sm font-bold text-pink-900 truncate">{motherId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-sky-50/80 px-3.5 py-3 border border-sky-100/50 group-hover:bg-sky-50 transition-colors">
          <LivestockAvatar animal={father} fallbackId={fatherId} className="h-10 w-10" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-1">Father</p>
            <p className="text-sm font-bold text-sky-900 truncate">{fatherId}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5 text-sm mb-5 pl-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Expected delivery</span>
          <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{new Date(record.expectedDeliveryDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        {record.actualDeliveryDate && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Actual delivery</span>
            <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md">{new Date(record.actualDeliveryDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
        {(record.numberOfOffspring ?? 0) > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Offspring</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{record.numberOfOffspring} born</span>
          </div>
        )}
      </div>

      {/* Gestation progress */}
      {daysUntil !== null && (
        <div className="rounded-[16px] bg-amber-50/80 p-3.5 border border-amber-100 ml-2 group-hover:shadow-sm transition-all">
          <div className="flex justify-between text-xs font-bold text-amber-800 mb-2.5">
            <span>Gestation Progress</span>
            <span className="bg-white px-2 py-0.5 rounded-full shadow-sm">{daysUntil > 0 ? `${daysUntil} days left` : 'Due today!'}</span>
          </div>
          <div className="h-2.5 rounded-full bg-amber-200/50 overflow-hidden shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-out relative" style={{ width: `${gestationProgress}%` }}>
               <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        </div>
      )}

      {record.notes && (
        <div className="mt-4 ml-2">
           <p className="text-[13px] leading-relaxed text-slate-600 bg-slate-50/80 border border-slate-100 rounded-xl px-3.5 py-3 group-hover:bg-slate-50 transition-colors">{record.notes}</p>
        </div>
      )}
    </div>
  );
}

function findLivestock(livestock: Livestock[], ref?: string) {
  if (!ref) return undefined;
  return livestock.find((animal) => animal.id === ref || animal.animalId === ref || animal.tagId === ref);
}

function formatLivestockId(animal: Livestock | undefined, fallback: string) {
  return animal?.animalId || animal?.tagId || fallback;
}

function LivestockAvatar({ animal, fallbackId, className }: { animal?: Livestock; fallbackId: string; className: string }) {
  if (animal?.photoUrl) {
    return (
      <img
        src={animal.photoUrl}
        alt={formatLivestockId(animal, fallbackId)}
        className={`${className} rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-200 transition-all duration-200 group-hover:ring-emerald-300`}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200`}>
      {fallbackId === 'Unknown' ? '?' : fallbackId.slice(-2)}
    </div>
  );
}

function StatCard({ label, value, tone, iconSrc }: { label: string; value: number; tone: 'slate' | 'sky' | 'amber' | 'emerald' | 'red'; iconSrc: string }) {
  const tones = {
    slate:   { val: 'text-slate-800'   },
    sky:     { val: 'text-sky-700'     },
    amber:   { val: 'text-amber-700'   },
    emerald: { val: 'text-emerald-700' },
    red:     { val: 'text-red-700'     },
  };
  const t = tones[tone];
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="shrink-0">
        <img src={iconSrc} alt={label} className="h-28 w-28 object-contain" />
      </div>
      <div className="min-w-0">
        <p className={`text-4xl font-extrabold tabular-nums leading-none ${t.val}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center py-20 text-center px-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-50 border border-slate-100 mb-5 shadow-sm">{icon}</div>
      <p className="text-lg font-bold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[1,2,3,4,5].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 border border-slate-200" />)}
      </div>
      <div className="h-96 rounded-[28px] bg-slate-100 border border-slate-200" />
    </div>
  );
}

function DnaIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">New Breeding Record</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Log rekod pembiakan ternakan baru</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-colors text-slate-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Mother (Female) <span className="text-red-500">*</span></label>
              <select required value={form.motherId} onChange={(e) => setForm({ ...form, motherId: e.target.value })} className={ic}>
                <option value="">Select mother</option>
                {females.map((a) => <option key={a.id} value={a.id}>{a.tagId} — {a.breed}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Father (Male)</label>
              <select value={form.fatherId} onChange={(e) => setForm({ ...form, fatherId: e.target.value })} className={ic}>
                <option value="">Optional</option>
                {males.map((a) => <option key={a.id} value={a.id}>{a.tagId} — {a.breed}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Breeding Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.breedingDate} onChange={(e) => setForm({ ...form, breedingDate: e.target.value })} className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Expected Delivery <span className="text-red-500">*</span></label>
              <input type="date" required value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} className={ic} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add any relevant veterinary or observation notes here..." className={ic} />
          </div>
          <div className="flex gap-3 pt-3">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none">
              {saving ? 'Saving Record...' : 'Save Record'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
