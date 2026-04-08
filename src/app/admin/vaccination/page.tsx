'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vaccinationService, calcNextDueAt } from '@/services/vaccination.service';
import type { VaccinationRecord, VaccineStatus } from '@/types/vaccination.types';

const VACCINE_TYPES = ['FMD', 'Brucellosis', 'Anthrax', 'Blackleg', 'LSD', 'PPR', 'Rabies', 'Other'];
const INTERVAL_OPTIONS = [
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year', days: 365 },
];

type FilterStatus = 'all' | VaccineStatus;

export default function VaccinationPage() {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    animalId: '',
    animalTagId: '',
    animalName: '',
    animalType: 'cow',
    vaccineType: 'FMD',
    batchNumber: '',
    dosage: '',
    administeredBy: '',
    administeredAt: new Date().toISOString().slice(0, 10),
    intervalDays: 180,
    notes: '',
    kandangId: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await vaccinationService.getAll();
      data.sort((a, b) => {
        // overdue first, then scheduled by due date, then completed last
        const order: Record<VaccineStatus, number> = { overdue: 0, scheduled: 1, completed: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (a.nextDueAt?.getTime() ?? a.administeredAt.getTime()) - (b.nextDueAt?.getTime() ?? b.administeredAt.getTime());
      });
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.vaccineType !== filterType) return false;
    return true;
  });

  const counts = {
    overdue: records.filter((r) => r.status === 'overdue').length,
    scheduled: records.filter((r) => r.status === 'scheduled').length,
    completed: records.filter((r) => r.status === 'completed').length,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const administeredAt = new Date(form.administeredAt);
      const nextDueAt = form.intervalDays > 0 ? calcNextDueAt(administeredAt, form.intervalDays) : undefined;
      await vaccinationService.create({
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
      });
      setShowForm(false);
      setForm((f) => ({ ...f, animalId: '', animalTagId: '', animalName: '', batchNumber: '', dosage: '', notes: '', kandangId: '' }));
      await load();
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
        ? calcNextDueAt(now, Math.round((record.nextDueAt.getTime() - record.administeredAt.getTime()) / (24 * 60 * 60 * 1000)))
        : undefined;
      await vaccinationService.markDone(record.id, now, nextDueAt);
      await load();
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
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Health Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Vaccination Tracker</h2>
          <p className="mt-0.5 text-sm text-slate-500">Jadual vaksin semua ternakan — overdue, scheduled, dan history.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 self-start sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Vaccination
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Overdue" count={counts.overdue} tone="red" onClick={() => setFilterStatus('overdue')} active={filterStatus === 'overdue'} />
        <SummaryCard label="Upcoming / Scheduled" count={counts.scheduled} tone="amber" onClick={() => setFilterStatus('scheduled')} active={filterStatus === 'scheduled'} />
        <SummaryCard label="Completed" count={counts.completed} tone="emerald" onClick={() => setFilterStatus('completed')} active={filterStatus === 'completed'} />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-slate-900">Log New Vaccination</h3>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Animal Firestore ID *">
              <input required value={form.animalId} onChange={(e) => setForm((f) => ({ ...f, animalId: e.target.value }))} placeholder="Firestore doc ID" className={inputClass} />
            </FormField>
            <FormField label="Animal Tag (e.g. 00001)">
              <input value={form.animalTagId} onChange={(e) => setForm((f) => ({ ...f, animalTagId: e.target.value }))} placeholder="00001" className={inputClass} />
            </FormField>
            <FormField label="Animal Name">
              <input value={form.animalName} onChange={(e) => setForm((f) => ({ ...f, animalName: e.target.value }))} placeholder="e.g. Biri-biri 1" className={inputClass} />
            </FormField>
            <FormField label="Animal Type">
              <select value={form.animalType} onChange={(e) => setForm((f) => ({ ...f, animalType: e.target.value }))} className={inputClass}>
                <option value="cow">Cow</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
              </select>
            </FormField>
            <FormField label="Vaccine Type *">
              <select required value={form.vaccineType} onChange={(e) => setForm((f) => ({ ...f, vaccineType: e.target.value }))} className={inputClass}>
                {VACCINE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
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
              <select value={form.intervalDays} onChange={(e) => setForm((f) => ({ ...f, intervalDays: Number(e.target.value) }))} className={inputClass}>
                <option value={0}>No repeat</option>
                {INTERVAL_OPTIONS.map((o) => <option key={o.days} value={o.days}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Kandang ID">
              <input value={form.kandangId} onChange={(e) => setForm((f) => ({ ...f, kandangId: e.target.value }))} placeholder="Optional" className={inputClass} />
            </FormField>
            <FormField label="Notes">
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className={inputClass} />
            </FormField>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                {submitting ? 'Saving...' : 'Save Record'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
          {(['all', 'overdue', 'scheduled', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${filterStatus === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300">
          <option value="all">All vaccines</option>
          {VACCINE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {(filterStatus !== 'all' || filterType !== 'all') && (
          <button onClick={() => { setFilterStatus('all'); setFilterType('all'); }} className="text-sm text-slate-500 hover:text-slate-700 transition">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-[28px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded-full bg-slate-200" />
                  <div className="h-3 w-64 rounded-full bg-slate-100" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <SyringeIcon className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">No vaccination records found.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition">
              Log first vaccination →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Animal</th>
                  <th className="px-6 py-3">Vaccine</th>
                  <th className="px-6 py-3">Administered</th>
                  <th className="px-6 py-3">Next Due</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">By</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{record.animalName || record.animalId}</p>
                      <p className="text-xs text-slate-500 capitalize">{record.animalType} {record.animalTagId ? `· #${record.animalTagId}` : ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">{record.vaccineType}</p>
                      {record.dosage && <p className="text-xs text-slate-500">{record.dosage}</p>}
                      {record.batchNumber && <p className="text-xs text-slate-400 font-mono">{record.batchNumber}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {record.administeredAt.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {record.nextDueAt ? (
                        <span className={`font-medium ${record.status === 'overdue' ? 'text-red-600' : 'text-slate-700'}`}>
                          {record.nextDueAt.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{record.administeredBy || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {record.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkDone(record)}
                            disabled={markingDone === record.id}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                          >
                            {markingDone === record.id ? '...' : 'Mark done'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deleting === record.id}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SummaryCard({ label, count, tone, onClick, active }: {
  label: string; count: number;
  tone: 'red' | 'amber' | 'emerald';
  onClick: () => void; active: boolean;
}) {
  const tones = {
    red: { base: 'border-red-100 bg-red-50', active: 'border-red-400 bg-red-50 ring-2 ring-red-200', value: 'text-red-700', dot: 'bg-red-500' },
    amber: { base: 'border-amber-100 bg-amber-50', active: 'border-amber-400 bg-amber-50 ring-2 ring-amber-200', value: 'text-amber-700', dot: 'bg-amber-500' },
    emerald: { base: 'border-emerald-100 bg-emerald-50', active: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200', value: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} className={`rounded-2xl border p-5 text-left transition ${active ? t.active : t.base + ' hover:border-slate-300'}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${t.dot}`} />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums ${t.value}`}>{count}</p>
    </button>
  );
}

function StatusBadge({ status }: { status: VaccineStatus }) {
  const styles: Record<VaccineStatus, string> = {
    overdue: 'bg-red-100 text-red-700',
    scheduled: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function SyringeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100';
