'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Plus,
  Search,
  ShieldCheck,
  Syringe,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  DEFAULT_VACCINE_TYPES,
  vaccinationService,
  vaccineTypeService,
  calcNextDueAt,
} from '@/services/vaccination.service';
import { livestockService } from '@/services/firestore.service';
import type { VaccinationRecord, VaccineStatus } from '@/types/vaccination.types';
import type { Livestock } from '@/types/livestock.types';

const INTERVAL_OPTIONS = [
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
];

type FilterStatus = 'all' | VaccineStatus;
type AnimalFilter = 'all' | 'cow' | 'goat';
type EnrichedVaccinationRecord = VaccinationRecord & {
  animalPhotoUrl?: string;
  animalProfileId?: string;
};

const statusTabs: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
];

const animalTabs: { value: AnimalFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cow', label: 'Cow' },
  { value: 'goat', label: 'Goat' },
];

export default function VaccinationPage() {
  const [records, setRecords] = useState<EnrichedVaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState('all');
  const [filterAnimalType, setFilterAnimalType] = useState<AnimalFilter>('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<EnrichedVaccinationRecord | null>(null);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [vaccineTypes, setVaccineTypes] = useState<string[]>(DEFAULT_VACCINE_TYPES);
  const [newVaccineType, setNewVaccineType] = useState('');
  const [addingVaccineType, setAddingVaccineType] = useState(false);
  const [vaccineTypeError, setVaccineTypeError] = useState('');

  const [form, setForm] = useState({
    animalId: '',
    animalTagId: '',
    animalName: '',
    animalType: 'cow',
    vaccineType: DEFAULT_VACCINE_TYPES[0],
    batchNumber: '',
    dosage: '',
    administeredBy: '',
    administeredAt: new Date().toISOString().slice(0, 10),
    intervalDays: 180,
    notes: '',
    kandangId: '',
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);

    vaccineTypeService.getAll()
      .then((types) => {
        if (!alive) return;
        setVaccineTypes(types);
        setForm((f) => types.includes(f.vaccineType) ? f : { ...f, vaccineType: types[0] || DEFAULT_VACCINE_TYPES[0] });
      })
      .catch((error) => console.error(error));

    const unsubscribe = vaccinationService.watchAll(
      async (data) => {
        if (!alive) return;
        try {
          const livestock = await livestockService.getAll();
          if (!alive) return;
          const enriched = enrichVaccinationRecords(data, livestock);
          enriched.sort(sortVaccinationRecords);
          setRecords(enriched);
        } catch (e) {
          console.error(e);
        } finally {
          if (alive) setLoading(false);
        }
      },
      (error) => {
        console.error(error);
        if (alive) setLoading(false);
      },
    );

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const counts = useMemo(() => ({
    overdue: records.filter((r) => r.status === 'overdue').length,
    scheduled: records.filter((r) => r.status === 'scheduled').length,
    completed: records.filter((r) => r.status === 'completed').length,
  }), [records]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterType !== 'all' && r.vaccineType !== filterType) return false;
      if (filterAnimalType !== 'all' && r.animalType !== filterAnimalType) return false;
      if (term) {
        const haystack = [
          r.animalName,
          r.animalId,
          r.animalTagId,
          r.animalType,
          r.vaccineType,
          r.batchNumber,
          r.administeredBy,
          r.kandangId,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [records, filterStatus, filterType, filterAnimalType, search]);

  const hasFilters = filterStatus !== 'all' || filterType !== 'all' || filterAnimalType !== 'all' || search.trim() !== '';

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setFilterAnimalType('all');
    setSearch('');
  };

  const statusCount = (value: FilterStatus) => {
    if (value === 'all') return records.length;
    if (value === 'overdue') return counts.overdue;
    if (value === 'scheduled') return counts.scheduled;
    return counts.completed;
  };

  const resetForm = () => {
    setForm({
      animalId: '',
      animalTagId: '',
      animalName: '',
      animalType: 'cow',
      vaccineType: vaccineTypes[0] || DEFAULT_VACCINE_TYPES[0],
      batchNumber: '',
      dosage: '',
      administeredBy: '',
      administeredAt: new Date().toISOString().slice(0, 10),
      intervalDays: 180,
      notes: '',
      kandangId: '',
    });
  };

  const startNewRecord = () => {
    setEditingRecord(null);
    resetForm();
    setShowForm((v) => !v);
  };

  const startEditRecord = (record: VaccinationRecord) => {
    setEditingRecord(record);
    setSelectedRecord(null);
    setForm({
      animalId: record.animalId,
      animalTagId: record.animalTagId || '',
      animalName: record.animalName || '',
      animalType: record.animalType || 'cow',
      vaccineType: record.vaccineType,
      batchNumber: record.batchNumber || '',
      dosage: record.dosage || '',
      administeredBy: record.administeredBy || '',
      administeredAt: toDateInput(record.administeredAt),
      intervalDays: intervalFromRecord(record),
      notes: record.notes || '',
      kandangId: record.kandangId || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const administeredAt = new Date(form.administeredAt);
      const nextDueAt = form.intervalDays > 0 ? calcNextDueAt(administeredAt, form.intervalDays) : undefined;
      const payload: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        animalId: form.animalId,
        animalTagId: form.animalTagId || undefined,
        animalName: form.animalName || undefined,
        animalType: form.animalType || undefined,
        vaccineType: form.vaccineType,
        batchNumber: form.batchNumber || undefined,
        dosage: form.dosage || undefined,
        administeredBy: form.administeredBy || undefined,
        administeredAt,
        nextDueAt,
        status: 'completed',
        notes: form.notes || undefined,
        kandangId: form.kandangId || undefined,
      };

      if (editingRecord) {
        await vaccinationService.update(editingRecord.id, {
          ...payload,
          status: editingRecord.status,
        });
      } else {
        await vaccinationService.create(payload);
      }

      setShowForm(false);
      setEditingRecord(null);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDone = async (record: VaccinationRecord) => {
    setMarkingDone(record.id);
    try {
      const now = new Date();
      const nextDueAt = record.nextDueAt
        ? calcNextDueAt(now, Math.round((record.nextDueAt.getTime() - record.administeredAt.getTime()) / dayMs))
        : undefined;
      await vaccinationService.markDone(record.id, now, nextDueAt, record.administeredBy);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingDone(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vaccination record?')) return;
    setDeleting(id);
    try {
      await vaccinationService.delete(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  const handleAddVaccineType = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newVaccineType.trim();
    if (!cleaned) return;

    setAddingVaccineType(true);
    setVaccineTypeError('');
    try {
      const updated = await vaccineTypeService.add(cleaned);
      const savedName = updated.find((type) => type.toLowerCase() === cleaned.toLowerCase()) || cleaned;
      setVaccineTypes(updated);
      setForm((f) => ({ ...f, vaccineType: savedName }));
      setNewVaccineType('');
    } catch (err) {
      console.error(err);
      setVaccineTypeError('Unable to add vaccine item.');
    } finally {
      setAddingVaccineType(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">Health Management</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Vaccination Tracker</h1>
          <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">Jadual vaksin semua ternakan - overdue, scheduled, dan history.</p>
        </div>
        <div className="relative self-start sm:self-auto">
          <div className="group relative">
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              aria-label="Vaccination actions"
            >
              <Plus className="h-5 w-5" strokeWidth={2.7} />
            </button>

            <div className="invisible absolute right-0 z-30 mt-2 w-80 translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <button
                type="button"
                onClick={startNewRecord}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Syringe className="h-4 w-4" strokeWidth={2.5} />
                </span>
                Log Vaccination
              </button>

              <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 p-2">
                <p className="px-1 pb-2 text-xs font-extrabold uppercase tracking-wide text-slate-500">Add Vaccine Item</p>
                <form onSubmit={handleAddVaccineType} className="flex items-center gap-2">
                  <input
                    value={newVaccineType}
                    onChange={(e) => setNewVaccineType(e.target.value)}
                    placeholder="e.g. HS Vaccine"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    type="submit"
                    disabled={addingVaccineType || newVaccineType.trim() === ''}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200"
                  >
                    {addingVaccineType ? 'Adding...' : 'Add'}
                  </button>
                </form>
                {vaccineTypeError && <p className="mt-2 px-1 text-xs font-bold text-red-600">{vaccineTypeError}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <SummaryCard
          label="Overdue"
          count={counts.overdue}
          tone="red"
          iconSrc="/VaccinationTracker/Overdue.png"
          active={filterStatus === 'overdue'}
          onClick={() => setFilterStatus('overdue')}
        />
        <SummaryCard
          label="Upcoming / Scheduled"
          count={counts.scheduled}
          tone="amber"
          iconSrc="/VaccinationTracker/Upcoming.png"
          active={filterStatus === 'scheduled'}
          onClick={() => setFilterStatus('scheduled')}
        />
        <SummaryCard
          label="Completed"
          count={counts.completed}
          tone="emerald"
          iconSrc="/VaccinationTracker/CompletedVaccinations.png"
          active={filterStatus === 'completed'}
          onClick={() => setFilterStatus('completed')}
        />
      </div>

      {showForm && (
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-emerald-50/60 px-5 py-4">
            <h2 className="text-base font-bold text-slate-950">{editingRecord ? 'Edit Vaccination' : 'Log New Vaccination'}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Record vaccine dose, batch, vet, and the next due interval.</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            <FormField label="Animal Firestore ID *">
              <input required value={form.animalId} onChange={(e) => setForm((f) => ({ ...f, animalId: e.target.value }))} placeholder="Firestore doc ID" className={inputClass} />
            </FormField>
            <FormField label="Animal Tag">
              <input value={form.animalTagId} onChange={(e) => setForm((f) => ({ ...f, animalTagId: e.target.value }))} placeholder="00001" className={inputClass} />
            </FormField>
            <FormField label="Animal Name">
              <input value={form.animalName} onChange={(e) => setForm((f) => ({ ...f, animalName: e.target.value }))} placeholder="e.g. Goat 1" className={inputClass} />
            </FormField>
            <FormField label="Animal Type">
              <SelectShell>
                <select value={form.animalType} onChange={(e) => setForm((f) => ({ ...f, animalType: e.target.value }))} className={selectClass}>
                  <option value="cow">Cow</option>
                  <option value="goat">Goat</option>
                  <option value="sheep">Sheep</option>
                </select>
              </SelectShell>
            </FormField>
            <FormField label="Vaccine Type *">
              <SelectShell>
                <select required value={form.vaccineType} onChange={(e) => setForm((f) => ({ ...f, vaccineType: e.target.value }))} className={selectClass}>
                  {vaccineTypes.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </SelectShell>
            </FormField>
            <FormField label="Batch Number">
              <input value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="e.g. LOT-2024-001" className={inputClass} />
            </FormField>
            <FormField label="Dosage">
              <input value={form.dosage} onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 2ml IM" className={inputClass} />
            </FormField>
            <FormField label="Administered By">
              <input value={form.administeredBy} onChange={(e) => setForm((f) => ({ ...f, administeredBy: e.target.value }))} placeholder="Vet / Staff name" className={inputClass} />
            </FormField>
            <FormField label="Date Administered *">
              <input required type="date" value={form.administeredAt} onChange={(e) => setForm((f) => ({ ...f, administeredAt: e.target.value }))} className={inputClass} />
            </FormField>
            <FormField label="Next Due Interval">
              <SelectShell>
                <select value={form.intervalDays} onChange={(e) => setForm((f) => ({ ...f, intervalDays: Number(e.target.value) }))} className={selectClass}>
                  <option value={0}>No repeat</option>
                  {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
                </select>
              </SelectShell>
            </FormField>
            <FormField label="Kandang ID">
              <input value={form.kandangId} onChange={(e) => setForm((f) => ({ ...f, kandangId: e.target.value }))} placeholder="Optional" className={inputClass} />
            </FormField>
            <FormField label="Notes">
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className={inputClass} />
            </FormField>
            <div className="flex gap-3 pt-1 sm:col-span-2 xl:col-span-3">
              <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Record'}
              </button>
              <button type="button" onClick={closeForm} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  filterStatus === tab.value
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  filterStatus === tab.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {statusCount(tab.value)}
                </span>
              </button>
            ))}

            <SelectShell className="ml-1 w-44 flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full appearance-none rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All vaccines</option>
                {vaccineTypes.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </SelectShell>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            {animalTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterAnimalType(tab.value)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filterAnimalType === tab.value
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {tab.value === 'all'
                  ? 'All Animals'
                  : tab.value === 'cow'
                    ? '🐄 Cow'
                    : '🐐 Goat'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="hidden grid-cols-[1.1fr_1fr_1fr_0.65fr_0.9fr_0.7fr] gap-5 px-5 pb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500 lg:grid">
          <span>Animal</span>
          <span>Vaccine & Batch</span>
          <span>Given / Due</span>
          <span>Status</span>
          <span>Vet</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onLog={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => (
              <RecordRow
                key={record.id}
                record={record}
                markingDone={markingDone === record.id}
                deleting={deleting === record.id}
                onOpen={() => setSelectedRecord(record)}
                onMarkDone={() => handleMarkDone(record)}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRecord && (
        <VaccinationDetailDrawer
          record={selectedRecord}
          markingDone={markingDone === selectedRecord.id}
          deleting={deleting === selectedRecord.id}
          onClose={() => setSelectedRecord(null)}
          onEdit={() => startEditRecord(selectedRecord)}
          onMarkDone={async () => {
            await handleMarkDone(selectedRecord);
            setSelectedRecord(null);
          }}
          onDelete={async () => {
            await handleDelete(selectedRecord.id);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  tone,
  iconSrc,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone: 'red' | 'amber' | 'emerald';
  iconSrc: string;
  active: boolean;
  onClick: () => void;
}) {
  const styles = {
    red: {
      ring: 'ring-2 ring-red-200 border-red-300',
      value: 'text-red-600',
    },
    amber: {
      ring: 'ring-2 ring-amber-200 border-amber-300',
      value: 'text-amber-600',
    },
    emerald: {
      ring: 'ring-2 ring-emerald-200 border-emerald-300',
      value: 'text-emerald-600',
    },
  }[tone];

  return (
    <button
      onClick={onClick}
      className={`flex h-full flex-col gap-4 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:p-5 ${
        active ? styles.ring : 'border-slate-200'
      }`}
    >
      <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 sm:h-24 sm:w-24">
        <img
          src={iconSrc}
          alt={label}
          className="h-16 w-16 object-contain mix-blend-multiply sm:h-20 sm:w-20"
        />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className={`text-3xl font-extrabold leading-none tabular-nums sm:text-4xl ${styles.value}`}>
          {count}
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-500 sm:text-base">{label}</p>
      </div>
    </button>
  );
}

function RecordRow({
  record,
  markingDone,
  deleting,
  onOpen,
  onMarkDone,
  onDelete,
}: {
  record: EnrichedVaccinationRecord;
  markingDone: boolean;
  deleting: boolean;
  onOpen: () => void;
  onMarkDone: () => void;
  onDelete: () => void;
}) {
  const due = getDueMeta(record);
  const rowAccent = record.status === 'overdue' ? 'before:bg-red-600' : record.status === 'scheduled' ? 'before:bg-amber-500' : 'before:bg-emerald-500';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-400 before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r-full ${rowAccent}`}
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_0.65fr_0.9fr_0.7fr] lg:items-center lg:gap-5">
        <div className="flex min-w-0 items-center gap-3">
          <AnimalAvatar record={record} />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-950">{animalDisplayName(record)}</p>
            <p className="truncate text-xs font-medium capitalize text-slate-500">{record.animalType || 'Animal'} {record.animalTagId ? `- #${record.animalTagId}` : ''}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-extrabold text-slate-950">{record.vaccineType}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {record.dosage && <span className="text-xs font-medium text-slate-500">{record.dosage}</span>}
            {record.batchNumber && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
                {record.batchNumber}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Syringe className="h-3.5 w-3.5" strokeWidth={2} />
            Given {formatDate(record.administeredAt)}
          </p>
          <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${due.className}`}>
            {due.icon}
            {due.label}
          </p>
        </div>

        <div>
          <StatusBadge status={record.status} />
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Vet</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{record.administeredBy || '-'}</p>
        </div>

        <div className="flex items-center justify-start gap-2 lg:justify-end">
          {record.status !== 'completed' && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onMarkDone();
              }}
              disabled={markingDone}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                record.status === 'overdue' ? 'bg-red-700 shadow-red-900/10 hover:bg-red-800' : 'bg-emerald-700 shadow-emerald-900/10 hover:bg-emerald-800'
              }`}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              {markingDone ? 'Done...' : 'Done'}
            </button>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={deleting}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={`Delete ${animalDisplayName(record)} vaccination record`}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: VaccineStatus }) {
  const styles: Record<VaccineStatus, string> = {
    overdue: 'bg-red-50 text-red-700 ring-red-100',
    scheduled: 'bg-amber-50 text-amber-700 ring-amber-100',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold capitalize ring-1 ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'overdue' ? 'bg-red-600' : status === 'scheduled' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      {status}
    </span>
  );
}

function AnimalAvatar({ record, large = false }: { record: EnrichedVaccinationRecord; large?: boolean }) {
  const isGoat = record.animalType?.toLowerCase() === 'goat';
  const size = large ? 'h-24 w-24 text-3xl' : 'h-11 w-11 text-lg';
  const shape = large ? 'rounded-2xl' : 'rounded-full';
  const tone = isGoat
    ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
    : 'border-amber-200 bg-amber-100 text-amber-800';

  if (record.animalPhotoUrl) {
    return (
      <img
        src={record.animalPhotoUrl}
        alt={animalDisplayName(record)}
        className={`shrink-0 border border-slate-200 object-cover shadow-sm ring-2 ring-white ${shape} ${size}`}
      />
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center border ${shape} ${size} ${tone}`}>
      {isGoat ? '🐐' : '🐄'}
    </div>
  );
}

function VaccinationDetailDrawer({
  record,
  markingDone,
  deleting,
  onClose,
  onEdit,
  onMarkDone,
  onDelete,
}: {
  record: EnrichedVaccinationRecord;
  markingDone: boolean;
  deleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onMarkDone: () => void;
  onDelete: () => void;
}) {
  const due = getDueMeta(record);
  const isOverdue = record.status === 'overdue';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close vaccination detail"
        className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              Vaccination Record
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <AnimalAvatar record={record} large />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-extrabold text-slate-950">
                {animalDisplayName(record)}
              </h2>
              <p className="mt-0.5 text-sm font-medium capitalize text-slate-500">
                {record.animalType || 'Animal'} {record.animalTagId ? `- #${record.animalTagId}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status={record.status} />
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${due.className}`}>
              {due.icon}
              {due.label}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">
          <div className={`h-1 rounded-full ${isOverdue ? 'bg-red-200' : 'bg-emerald-200'}`} />

          <section className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Vaccine Details
            </p>
            <h3 className="mt-3 text-xl font-extrabold text-slate-950">
              {record.vaccineType}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.dosage && (
                <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  {record.dosage}
                </span>
              )}
              {record.batchNumber && (
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                  {record.batchNumber}
                </span>
              )}
            </div>
          </section>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <DetailPanel
              icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label="Date Administered"
              value={formatDate(record.administeredAt)}
            />
            <DetailPanel
              icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label="Next Due Date"
              value={record.nextDueAt ? formatDate(record.nextDueAt) : '-'}
              danger={isOverdue}
            />
            <DetailPanel
              icon={<UserRound className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label="Administered By"
              value={record.administeredBy || '-'}
            />
            <DetailPanel
              icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.3} />}
              label="Animal Type"
              value={capitalize(record.animalType || 'Animal')}
            />
          </div>

          <section className="mt-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
              Timeline
            </p>
            <div className="mt-4 space-y-4">
              <TimelineItem
                tone="green"
                title="Vaccine administered"
                subtitle={`${formatDate(record.administeredAt)}${record.administeredBy ? ` - ${record.administeredBy}` : ''}`}
              />
              <TimelineItem
                tone={isOverdue ? 'red' : 'green'}
                title={`Status: ${capitalize(record.status)}`}
                subtitle={isOverdue ? 'Needs rescheduling' : 'Record is up to date'}
              />
              <TimelineItem
                tone={isOverdue ? 'red' : 'amber'}
                title="Next due"
                subtitle={record.nextDueAt ? `${formatDate(record.nextDueAt)} - ${due.label}` : 'No repeat scheduled'}
              />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            Edit
          </button>
          {record.status === 'completed' ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-xl bg-red-50 px-3 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onMarkDone}
              disabled={markingDone}
              className="rounded-xl bg-emerald-800 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {markingDone ? 'Saving...' : 'Mark Done'}
            </button>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );
}

function DetailPanel({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 shadow-sm ring-1 ring-slate-100 ${danger ? 'bg-red-50' : 'bg-white'}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {icon}
        {label}
      </p>
      <p className={`mt-2 text-sm font-extrabold ${danger ? 'text-red-700' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

function TimelineItem({
  tone,
  title,
  subtitle,
}: {
  tone: 'green' | 'amber' | 'red';
  title: string;
  subtitle: string;
}) {
  const color = tone === 'green' ? 'bg-emerald-600' : tone === 'amber' ? 'bg-amber-500' : 'bg-red-600';

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="mt-1 h-full w-px bg-slate-200" />
      </div>
      <div className="min-w-0 pb-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Syringe className="h-7 w-7" strokeWidth={2} />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-800">No vaccination records found.</p>
      <p className="mt-1 text-sm text-slate-500">Try clearing filters or log a new vaccination record.</p>
      <button onClick={onLog} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800">
        Log Vaccination
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_0.65fr_0.9fr_0.7fr] lg:items-center lg:gap-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded-full bg-slate-200" />
                <div className="h-3 w-24 rounded-full bg-slate-100" />
              </div>
            </div>
            {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-5 rounded-full bg-slate-100" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function SelectShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function enrichVaccinationRecords(records: VaccinationRecord[], livestock: Livestock[]): EnrichedVaccinationRecord[] {
  return records.map((record) => {
    const animal = findMatchingAnimal(record, livestock);
    if (!animal) return record;

    return {
      ...record,
      animalTagId: cleanDisplayValue(record.animalTagId) || cleanDisplayValue(animal.animalId) || cleanDisplayValue(animal.tagId),
      animalName: cleanDisplayValue(record.animalName) || cleanDisplayValue(animal.name),
      animalType: cleanDisplayValue(record.animalType) || animal.type,
      animalPhotoUrl: animal.photoUrl,
      animalProfileId: animal.id,
    };
  });
}

function findMatchingAnimal(record: VaccinationRecord, livestock: Livestock[]) {
  const recordKeys = new Set([
    ...animalMatchKeys(record.animalId),
    ...animalMatchKeys(record.animalTagId),
    ...animalMatchKeys(record.animalName),
  ]);

  if (recordKeys.size === 0) return undefined;

  return livestock.find((animal) => {
    const animalKeys = [
      ...animalMatchKeys(animal.id),
      ...animalMatchKeys(animal.animalId),
      ...animalMatchKeys(animal.tagId),
      ...animalMatchKeys(animal.rfid),
      ...animalMatchKeys(animal.name),
    ];

    return animalKeys.some((key) => recordKeys.has(key));
  });
}

function animalMatchKeys(value?: string) {
  const cleaned = cleanDisplayValue(value);
  if (!cleaned) return [];

  const compact = cleaned.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
  const withoutTypePrefix = compact.replace(/^(cow|cattle|goat|sheep|lembu|kambing|biri)[-_#]*/i, '');

  return Array.from(new Set([compact, withoutTypePrefix].filter(isUsefulMatchKey)));
}

function cleanDisplayValue(value?: string) {
  const cleaned = value?.trim();
  if (!cleaned || cleaned.toLowerCase() === 'n/a' || cleaned.toLowerCase() === 'unknown') return undefined;
  return cleaned;
}

function isUsefulMatchKey(value: string) {
  return value !== '' && value !== 'n/a' && value !== 'unknown';
}

function getDueMeta(record: VaccinationRecord) {
  if (record.status === 'completed') {
    return {
      label: record.nextDueAt ? `Next ${formatDate(record.nextDueAt)}` : 'Completed',
      className: 'bg-emerald-50 text-emerald-700',
      icon: <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.3} />,
    };
  }

  const dueDate = record.nextDueAt ?? record.administeredAt;
  const days = Math.ceil((dueDate.getTime() - Date.now()) / dayMs);

  if (days < 0 || record.status === 'overdue') {
    return {
      label: `${Math.max(Math.abs(days), 1)}d overdue`,
      className: 'bg-red-50 text-red-700',
      icon: <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.3} />,
    };
  }

  return {
    label: days === 0 ? 'Due today' : `Due in ${days}d`,
    className: 'bg-amber-50 text-amber-700',
    icon: <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.3} />,
  };
}

function getSortDate(record: VaccinationRecord) {
  return record.nextDueAt ?? record.administeredAt;
}

function sortVaccinationRecords(a: VaccinationRecord, b: VaccinationRecord) {
  const order: Record<VaccineStatus, number> = { overdue: 0, scheduled: 1, completed: 2 };
  if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
  return getSortDate(a).getTime() - getSortDate(b).getTime();
}

function animalDisplayName(record: VaccinationRecord) {
  if (record.animalTagId) return `${capitalize(record.animalType || 'Animal')} ${record.animalTagId}`;
  if (record.animalName) return record.animalName;
  return record.animalId;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function intervalFromRecord(record: VaccinationRecord) {
  if (!record.nextDueAt) return 0;
  const diffDays = Math.max(0, Math.round((record.nextDueAt.getTime() - record.administeredAt.getTime()) / dayMs));
  const known = INTERVAL_OPTIONS.find((option) => option.days === diffDays);
  return known?.days ?? 0;
}

const dayMs = 24 * 60 * 60 * 1000;
const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100';
const selectClass = `${inputClass} appearance-none pr-9`;
