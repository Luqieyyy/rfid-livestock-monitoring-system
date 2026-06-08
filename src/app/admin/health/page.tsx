'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { healthRecordService, livestockService } from '@/services/firestore.service';
import type { HealthRecord, Livestock } from '@/types/livestock.types';

type FilterType = 'all' | 'vaccination' | 'treatment' | 'checkup' | 'diagnosis';
type AnimalTypeFilter = 'all' | 'cow' | 'goat';

const ic = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

const TYPE_CONFIG = {
  vaccination: {
    label: 'Vaccination',
    border: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    dot: 'bg-blue-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  treatment: {
    label: 'Treatment',
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dot: 'bg-rose-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  checkup: {
    label: 'Checkup',
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    dot: 'bg-emerald-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  diagnosis: {
    label: 'Diagnosis',
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l4 4v5m-5 9a3 3 0 100-6 3 3 0 000 6zm3 0l1.5 1.5" />
      </svg>
    ),
  },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', dot: 'bg-emerald-500' },
  scheduled: { label: 'Scheduled', cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',           dot: 'bg-sky-500'     },
  ongoing:   { label: 'Ongoing',   cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',     dot: 'bg-amber-500'   },
};

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalTypeFilter>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

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

  const filtered = records.filter((r) => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (animalTypeFilter !== 'all') {
      const animal = livestock.find((l) => l.id === r.livestockId);
      if (!animal || animal.type !== animalTypeFilter) return false;
    }
    if (search.trim()) {
      const animal = livestock.find((l) => l.id === r.livestockId);
      const displayId = animal?.animalId ?? r.livestockId;
      const haystack = `${displayId} ${r.description} ${r.veterinarian ?? ''} ${r.medication ?? ''}`.toLowerCase();
      if (!haystack.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    total:       records.length,
    vaccination: records.filter(r => r.type === 'vaccination').length,
    treatment:   records.filter(r => r.type === 'treatment').length,
    checkup:     records.filter(r => r.type === 'checkup').length,
    diagnosis:   records.filter(r => r.type === 'diagnosis').length,
  };

  const overdueCount = records.filter(
    (r) => r.nextCheckup && new Date(r.nextCheckup) < new Date() && r.status !== 'completed'
  ).length;

  if (loading) return <HealthSkeleton />;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">Health Management</p>
          <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
          <p className="mt-0.5 text-sm text-slate-500">Rekod kesihatan, rawatan dan pemeriksaan semua ternakan.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {overdueCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {overdueCount} overdue checkup{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total Records"  value={counts.total}       valCls="text-slate-800"   iconSrc="/HealthRecordsicon/Totalrecords.png" />
        <StatCard label="Vaccinations"   value={counts.vaccination} valCls="text-blue-700"    iconSrc="/HealthRecordsicon/vaccination.png" />
        <StatCard label="Treatments"     value={counts.treatment}   valCls="text-rose-700"    iconSrc="/HealthRecordsicon/Treatments.png" />
        <StatCard label="Checkups"       value={counts.checkup}     valCls="text-emerald-700" iconSrc="/HealthRecordsicon/Checkups.png" />
      </div>

      {/* ── Search + filter bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition"
          />
        </div>

        {/* Type tabs + Animal type pills, same row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
          {(
            [
              { value: 'all',         label: 'All',        count: counts.total       },
              { value: 'vaccination', label: 'Vaccination', count: counts.vaccination },
              { value: 'treatment',   label: 'Treatment',  count: counts.treatment   },
              { value: 'checkup',     label: 'Checkup',    count: counts.checkup     },
              { value: 'diagnosis',   label: 'Diagnosis',  count: counts.diagnosis   },
            ] as { value: FilterType; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                filter === tab.value
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                filter === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            {(['all', 'cow', 'goat'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setAnimalTypeFilter(t)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  animalTypeFilter === t
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t === 'all' ? 'All Animals' : t === 'cow' ? '🐄 Cow' : '🐐 Goat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Record list ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4 text-slate-400">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-semibold text-slate-800">No records found</p>
          <p className="mt-1 text-sm text-slate-400 max-w-xs">Start by adding a health record for your livestock.</p>
          <button onClick={() => setShowAddModal(true)} className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add First Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((record) => (
            <HealthCard
              key={record.id}
              record={record}
              livestock={livestock}
              onOpen={() => setSelectedRecord(record)}
            />
          ))}
        </div>
      )}

      {(showAddModal || editingRecord) && (
        <AddHealthRecordModal
          livestock={livestock}
          record={editingRecord}
          onClose={() => { setShowAddModal(false); setEditingRecord(null); }}
          onSuccess={loadData}
        />
      )}

      {selectedRecord && (
        <RecordDetailDrawer
          record={selectedRecord}
          livestock={livestock}
          onClose={() => setSelectedRecord(null)}
          onChanged={loadData}
          onEdit={() => { setEditingRecord(selectedRecord); setSelectedRecord(null); }}
        />
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────

function StatCard({ label, value, valCls, iconSrc }: {
  label: string;
  value: number;
  valCls: string;
  iconSrc: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
      <div className="shrink-0">
        <img src={iconSrc} alt={label} className="h-16 w-16 object-contain drop-shadow-sm" />
      </div>
      <div>
        <p className={`text-3xl font-extrabold tabular-nums leading-none ${valCls}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── Health Card ──────────────────────────────────────────────────

function HealthCard({ record, livestock, onOpen }: { record: HealthRecord; livestock: Livestock[]; onOpen: () => void }) {
  const router = useRouter();
  const animal = livestock.find((l) => l.id === record.livestockId);
  const displayId = animal?.animalId ?? record.livestockId;

  const cfg = TYPE_CONFIG[record.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.checkup;
  const sc  = STATUS_CONFIG[record.status] ?? { label: record.status, cls: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200', dot: 'bg-slate-400' };

  const isOverdue = record.nextCheckup && new Date(record.nextCheckup) < new Date() && record.status !== 'completed';

  const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div
      onClick={onOpen}
      className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
    >
      {/* Top row: avatar + id + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/admin/livestock?open=${displayId}`); }}
            className="flex-shrink-0 focus:outline-none group"
            title={`View ${displayId}`}
          >
            {animal?.photoUrl ? (
              <img
                src={animal.photoUrl}
                alt={displayId}
                className="h-11 w-11 rounded-xl object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-emerald-400 transition"
              />
            ) : (
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xs font-bold text-white ${cfg.dot} group-hover:brightness-110 transition`}>
                {displayId.slice(-2)}
              </div>
            )}
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">#{displayId}</p>
            <p className="text-xs text-slate-400 capitalize">{animal?.type || 'Unknown'}</p>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${sc.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
            {sc.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 line-clamp-2">{record.description}</p>

      {/* Meta */}
      <div className="border-t border-slate-50 pt-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date</span>
            <span className="text-sm font-medium text-slate-700">{fmt(record.date)}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Vet</span>
            <span className="text-sm text-slate-700 whitespace-nowrap">
              {record.veterinarian || <span className="text-slate-300">—</span>}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Medication</span>
            <span className="text-sm text-slate-700 whitespace-nowrap">
              {record.medication || <span className="text-slate-300">—</span>}
            </span>
          </div>
        </div>

        {record.nextCheckup && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Next Checkup</span>
            <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${
              isOverdue
                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}>
              {isOverdue && '! '}
              {fmt(record.nextCheckup)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Record Detail Drawer ─────────────────────────────────────────

function RecordDetailDrawer({ record, livestock, onClose, onChanged, onEdit }: {
  record: HealthRecord;
  livestock: Livestock[];
  onClose: () => void;
  onChanged: () => void;
  onEdit: () => void;
}) {
  const [working, setWorking] = useState(false);
  const animal = livestock.find((l) => l.id === record.livestockId);
  const displayId = animal?.animalId ?? record.livestockId;

  const cfg = TYPE_CONFIG[record.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.checkup;
  const sc  = STATUS_CONFIG[record.status] ?? { label: record.status, cls: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200', dot: 'bg-slate-400' };

  const isOverdue = record.nextCheckup && new Date(record.nextCheckup) < new Date() && record.status !== 'completed';
  const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

  const markComplete = async () => {
    setWorking(true);
    try {
      await healthRecordService.update(record.id, { status: 'completed' });
      onChanged();
      onClose();
    } catch (e) { console.error(e); }
    finally { setWorking(false); }
  };

  const timeline = [
    {
      key: 'created',
      label: 'Record created',
      detail: `${fmt(record.date)} · ${record.veterinarian || 'No veterinarian listed'}`,
      dot: 'bg-slate-400',
    },
    {
      key: 'status',
      label: `Status: ${sc.label}`,
      detail: 'Auto-updated on creation',
      dot: sc.dot,
    },
    ...(record.nextCheckup ? [{
      key: 'next',
      label: 'Next checkup',
      detail: `${fmt(record.nextCheckup)}${isOverdue ? ' · Overdue' : ''}`,
      dot: isOverdue ? 'bg-red-500' : 'bg-amber-500',
    }] : []),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Record Detail</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Identity */}
          <div className="flex items-center gap-3">
            {animal?.photoUrl ? (
              <img src={animal.photoUrl} alt={displayId} className="h-12 w-12 rounded-xl object-cover border border-slate-200" />
            ) : (
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold text-white ${cfg.dot}`}>
                {displayId.slice(-2)}
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-slate-900">#{displayId}</p>
              <p className="text-sm text-slate-500 capitalize">{animal?.type || 'Unknown'} · Record #{record.id.slice(0, 6)}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${sc.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Overdue
              </span>
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Description / Notes</p>
            <p className="mt-1.5 text-sm text-slate-700">{record.description}</p>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Date Administered
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fmt(record.date)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Veterinarian
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{record.veterinarian || '—'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Medication
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{record.medication || 'None prescribed'}</p>
            </div>
            <div className={`rounded-2xl border p-3.5 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-slate-200'}`}>
              <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Next Checkup
              </p>
              <p className={`mt-1 text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-slate-800'}`}>
                {record.nextCheckup ? fmt(record.nextCheckup) : '—'}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
            <div className="space-y-4">
              {timeline.map((t) => (
                <div key={t.key} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${t.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                    <p className="text-xs text-slate-500">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Close
          </button>
          <button onClick={onEdit} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
          </button>
          <button
            onClick={markComplete}
            disabled={working || record.status === 'completed'}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {working ? 'Updating...' : record.status === 'completed' ? 'Completed' : 'Complete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Skeleton ─────────────────────────────────────────────────────

function HealthSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-10 rounded-xl bg-slate-200" />
      <div className="space-y-2.5">
        {[1,2,3,4,5].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-200" />)}
      </div>
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────

function AddHealthRecordModal({ livestock, record, onClose, onSuccess }: { livestock: Livestock[]; record?: HealthRecord | null; onClose: () => void; onSuccess: () => void }) {
  const isEditing = !!record;
  const toDateInput = (d?: string | Date) => d ? new Date(d).toISOString().split('T')[0] : '';

  const [form, setForm] = useState({
    livestockId: record?.livestockId ?? '',
    type: (record?.type ?? 'checkup') as string,
    description: record?.description ?? '',
    date: record ? toDateInput(record.date) : new Date().toISOString().split('T')[0],
    veterinarian: record?.veterinarian ?? '',
    medication: record?.medication ?? '',
    dosage: record?.dosage ?? '',
    nextCheckup: toDateInput(record?.nextCheckup),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        date: new Date(form.date),
        nextCheckup: form.nextCheckup ? new Date(form.nextCheckup) : undefined,
      };
      if (isEditing && record) {
        await healthRecordService.update(record.id, payload as Partial<HealthRecord>);
      } else {
        await healthRecordService.create({ ...payload, status: 'completed' } as Omit<HealthRecord, 'id' | 'createdAt'>);
      }
      onSuccess();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Health Record' : 'Add Health Record'}</h2>
            <p className="text-sm text-slate-500">{isEditing ? 'Kemaskini rekod kesihatan ternakan' : 'Log pemeriksaan atau rawatan ternakan'}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Date *</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Veterinarian</label>
              <input type="text" value={form.veterinarian} onChange={(e) => setForm({ ...form, veterinarian: e.target.value })} placeholder="Dr. Name" className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              {saving ? 'Saving...' : isEditing ? 'Update Record' : 'Save Record'}
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
