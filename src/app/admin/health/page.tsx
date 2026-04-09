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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Records" value={stats.total} tone="slate" icon={<ClipboardIcon />} />
        <StatCard label="Vaccinations" value={stats.vaccinations} tone="blue" icon={<VaccineIcon />} />
        <StatCard label="Treatments" value={stats.treatments} tone="red" icon={<PillIcon />} />
        <StatCard label="Checkups" value={stats.checkups} tone="emerald" icon={<StethIcon />} />
      </div>

      {/* Filter tabs + records */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs bar */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-5 pb-0 overflow-x-auto">
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
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                filter === tab.value
                  ? 'border-emerald-500 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
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
    vaccination: { icon: <VaccineIcon className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Vaccination' },
    treatment: { icon: <PillIcon className="h-5 w-5 text-red-500" />, bg: 'bg-red-50', label: 'Treatment' },
    checkup: { icon: <StethIcon className="h-5 w-5 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Checkup' },
    diagnosis: { icon: <ClipboardIcon className="h-5 w-5 text-amber-600" />, bg: 'bg-amber-50', label: 'Diagnosis' },
  };
  const cfg = typeConfig[record.type as keyof typeof typeConfig] ?? typeConfig.checkup;

  const statusStyle: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-sky-100 text-sky-700',
    ongoing: 'bg-amber-100 text-amber-700',
  };

  const isOverdue = record.nextCheckup && new Date(record.nextCheckup) < new Date() && record.status !== 'completed';

  return (
    <div className="flex flex-col gap-4 px-6 py-5 hover:bg-slate-50/60 transition-colors sm:flex-row sm:items-center">
      {/* Type icon */}
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${cfg.bg}`}>
        {cfg.icon}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900 text-sm">{displayId}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle[record.status] ?? 'bg-slate-100 text-slate-600'}`}>
            {record.status}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-1">{record.description}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-5 text-sm flex-shrink-0">
        <MetaItem label="Date" value={new Date(record.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} />
        {record.veterinarian && <MetaItem label="Vet" value={record.veterinarian} />}
        {record.medication && <MetaItem label="Medication" value={record.medication} />}
        {record.nextCheckup && (
          <div className={`rounded-xl px-3 py-2 text-center ${isOverdue ? 'bg-red-50' : 'bg-amber-50'}`}>
            <p className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>Next Checkup</p>
            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-amber-700'}`}>
              {new Date(record.nextCheckup).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: 'slate' | 'blue' | 'red' | 'emerald'; icon: React.ReactNode }) {
  const tones = {
    slate: { wrap: 'border-slate-200 bg-white', iconBg: 'bg-slate-100', val: 'text-slate-900' },
    blue: { wrap: 'border-blue-100 bg-blue-50/50', iconBg: 'bg-blue-100', val: 'text-blue-700' },
    red: { wrap: 'border-red-100 bg-red-50/50', iconBg: 'bg-red-100', val: 'text-red-700' },
    emerald: { wrap: 'border-emerald-100 bg-emerald-50/50', iconBg: 'bg-emerald-100', val: 'text-emerald-700' },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-2xl border p-5 ${t.wrap}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>{icon}</div>
      <p className={`mt-4 text-3xl font-bold tabular-nums ${t.val}`}>{value}</p>
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

function ClipboardIcon({ className = 'h-5 w-5 text-slate-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function VaccineIcon({ className = 'h-5 w-5 text-blue-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}
function PillIcon({ className = 'h-5 w-5 text-red-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}
function StethIcon({ className = 'h-5 w-5 text-emerald-600' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
