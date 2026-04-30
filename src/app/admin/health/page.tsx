'use client';

import { useEffect, useState } from 'react';
import { healthRecordService, livestockService } from '@/services/firestore.service';
import type { HealthRecord, Livestock } from '@/types/livestock.types';

type FilterType = 'all' | 'vaccination' | 'treatment' | 'checkup' | 'diagnosis';

const ic = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [r, l] = await Promise.all([healthRecordService.getRecent(90), livestockService.getAll()]);
      setRecords(r);
      setLivestock(l);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? records : records.filter((r) => r.type === filter);

  const stats = {
    total: records.length,
    vaccinations: records.filter((r) => r.type === 'vaccination').length,
    treatments: records.filter((r) => r.type === 'treatment').length,
    checkups: records.filter((r) => r.type === 'checkup').length,
  };

  if (loading) return <HealthSkeleton />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Livestock Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Health Records</h2>
          <p className="mt-0.5 text-sm text-slate-500">Rekod kesihatan, rawatan dan pemeriksaan semua ternakan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 self-start sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Record
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Records" value={stats.total} tone="slate" icon={<ClipboardIcon />} />
        <StatCard label="Vaccinations" value={stats.vaccinations} tone="blue" icon={<VaccineIcon />} />
        <StatCard label="Treatments" value={stats.treatments} tone="rose" icon={<PillIcon />} />
        <StatCard label="Checkups" value={stats.checkups} tone="emerald" icon={<StethIcon />} />
      </div>

      {/* Filter tabs + records */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        {/* Tabs bar */}
        <div className="flex items-center gap-1 border-b border-slate-200 px-5 pt-4 overflow-x-auto">
          {([
            { value: 'all', label: 'All Records' },
            { value: 'vaccination', label: 'Vaccinations' },
            { value: 'treatment', label: 'Treatments' },
            { value: 'checkup', label: 'Checkups' },
            { value: 'diagnosis', label: 'Diagnosis' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-shrink-0 border-b-2 px-3.5 py-3 text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Records */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<StethIcon className="h-8 w-8 text-slate-400" />}
            title="No health records found"
            description="Start tracking your livestock health by adding a new record."
            action={<button onClick={() => setShowAddModal(true)} className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition">+ Add First Record</button>}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((record) => (
              <HealthRow key={record.id} record={record} livestock={livestock} />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddHealthRecordModal livestock={livestock} onClose={() => setShowAddModal(false)} onSuccess={loadData} />
      )}
    </div>
  );
}

function HealthRow({ record, livestock }: { record: HealthRecord; livestock: Livestock[] }) {
  const animal = livestock.find((l) => l.id === record.livestockId);
  const displayId = animal?.animalId ?? record.livestockId;
  const typeConfig = {
    vaccination: { icon: <VaccineIcon className="h-[18px] w-[18px] text-blue-600" />,   bg: 'bg-blue-50',   ring: 'ring-blue-100',   label: 'Vaccination', labelCls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'   },
    treatment:   { icon: <PillIcon className="h-[18px] w-[18px] text-rose-500" />,      bg: 'bg-rose-50',   ring: 'ring-rose-100',   label: 'Treatment',   labelCls: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'   },
    checkup:     { icon: <StethIcon className="h-[18px] w-[18px] text-emerald-600" />,  bg: 'bg-emerald-50',ring: 'ring-emerald-100',label: 'Checkup',     labelCls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'},
    diagnosis:   { icon: <DiagnosisIcon className="h-[18px] w-[18px] text-amber-600" />,bg: 'bg-amber-50',  ring: 'ring-amber-100',  label: 'Diagnosis',   labelCls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'  },
  };
  const cfg = typeConfig[record.type as keyof typeof typeConfig] ?? typeConfig.checkup;

  const statusStyle: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-sky-100 text-sky-700',
    ongoing: 'bg-amber-100 text-amber-700',
  };

  const isOverdue = record.nextCheckup && new Date(record.nextCheckup) < new Date() && record.status !== 'completed';

  return (
    <div className="grid gap-4 px-5 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[minmax(360px,1fr)_160px_150px_190px_128px] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${cfg.bg} ${cfg.ring}`}>
          {cfg.icon}
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-bold tracking-tight text-slate-950">{displayId}</span>
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle[record.status] ?? 'bg-slate-100 text-slate-600'}`}>
              {record.status}
            </span>
            <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${cfg.labelCls}`}>
              {cfg.label}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 lg:line-clamp-1">{record.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:contents">
        <MetaItem label="Date" value={new Date(record.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} />
        <MetaItem label="Vet" value={record.veterinarian || '-'} />
        <MetaItem label="Medication" value={record.medication || '-'} />
        {record.nextCheckup ? (
          <div className={`rounded-lg px-3 py-2 text-left ring-1 ${isOverdue ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-75">Next Checkup</p>
            <p className="mt-0.5 text-sm font-bold">
              {new Date(record.nextCheckup).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-left text-slate-400 ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wide">Next Checkup</p>
            <p className="mt-0.5 text-sm font-semibold">-</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100 lg:bg-transparent lg:px-0 lg:py-0 lg:ring-0">
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: 'slate' | 'blue' | 'rose' | 'emerald'; icon: React.ReactNode }) {
  const cfg = {
    slate:   { iconBg: 'bg-slate-50',   iconRing: 'ring-slate-200',   val: 'text-slate-950',  sub: 'text-slate-500'  },
    blue:    { iconBg: 'bg-blue-50',    iconRing: 'ring-blue-100',    val: 'text-blue-700',   sub: 'text-slate-500'   },
    rose:    { iconBg: 'bg-rose-50',    iconRing: 'ring-rose-100',    val: 'text-rose-700',   sub: 'text-slate-500'   },
    emerald: { iconBg: 'bg-emerald-50', iconRing: 'ring-emerald-100', val: 'text-emerald-700',sub: 'text-slate-500'},
  };
  const c = cfg[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${c.sub}`}>{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums leading-none ${c.val}`}>{value}</p>
        </div>
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${c.iconBg} ${c.iconRing}`}>
          {icon}
        </div>
      </div>
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

function HealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-64 rounded-[28px] bg-slate-200" />
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────

// Document with lines — Total Records
function ClipboardIcon({ className = 'h-5 w-5 text-slate-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

// Shield with checkmark — Vaccination (immunity/protection)
function VaccineIcon({ className = 'h-5 w-5 text-blue-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-3.036-1.116-5.8-2.944-7.893z" />
    </svg>
  );
}

// Medical cross in circle — Treatment
function PillIcon({ className = 'h-5 w-5 text-rose-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Stethoscope — Checkup
function StethIcon({ className = 'h-5 w-5 text-emerald-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3c-1.2 5.4-6 6-6 10a6 6 0 0012 0c0-4-4.8-4.6-6-10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19a3 3 0 006 0v-1" />
      <circle cx="18" cy="18" r="1.5" strokeWidth={1.8} />
    </svg>
  );
}

// Magnifying glass + document — Diagnosis
function DiagnosisIcon({ className = 'h-5 w-5 text-amber-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l4 4v5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17m-3 0a3 3 0 106 0 3 3 0 00-6 0M21 21l-1.5-1.5" />
    </svg>
  );
}

// ── Add Modal ──────────────────────────────────────────────────

function AddHealthRecordModal({ livestock, onClose, onSuccess }: { livestock: Livestock[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ livestockId: '', type: 'checkup', description: '', date: new Date().toISOString().split('T')[0], veterinarian: '', medication: '', dosage: '', nextCheckup: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await healthRecordService.create({
        ...form,
        date: new Date(form.date),
        nextCheckup: form.nextCheckup ? new Date(form.nextCheckup) : undefined,
        status: 'completed',
      } as Omit<HealthRecord, 'id' | 'createdAt'>);
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
            <h2 className="text-lg font-bold text-slate-900">Add Health Record</h2>
            <p className="text-sm text-slate-500">Log pemeriksaan atau rawatan ternakan</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Livestock *</label>
              <select required value={form.livestockId} onChange={(e) => setForm({ ...form, livestockId: e.target.value })} className={ic}>
                <option value="">Select animal</option>
                {livestock.map((a) => <option key={a.id} value={a.id}>{a.tagId} — {a.breed}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Type *</label>
              <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={ic}>
                <option value="checkup">Checkup</option>
                <option value="vaccination">Vaccination</option>
                <option value="treatment">Treatment</option>
                <option value="diagnosis">Diagnosis</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Description *</label>
            <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the health record..." className={ic} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Veterinarian</label>
              <input type="text" value={form.veterinarian} onChange={(e) => setForm({ ...form, veterinarian: e.target.value })} placeholder="Dr. Name" className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Medication</label>
              <input type="text" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} placeholder="Medication name" className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Next Checkup</label>
              <input type="date" value={form.nextCheckup} onChange={(e) => setForm({ ...form, nextCheckup: e.target.value })} className={ic} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Record'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
