'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { getFirebaseDb } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import Image from 'next/image';
import AnimalProfileModal from '@/components/livestock/AnimalProfileModal';
import type { Livestock } from '@/types/livestock.types';

interface ConditionLog {
  id: string;
  logType?: 'animal' | 'farm';
  animalId?: string;
  animalDisplayName?: string;
  area?: string;
  areaLabel?: string;
  farmerId: string;
  farmerName: string;
  condition: 'Good' | 'Monitor' | 'Sick';
  notes: string;
  photoUrl?: string;
  timestamp: Timestamp;
  isReviewed: boolean;
}

const conditionConfig = {
  Good: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Monitor: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Sick: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

// Display labels differ depending on whether the log is about an animal or the farm/facility
const conditionLabel = (logType: 'animal' | 'farm' | undefined, condition: ConditionLog['condition']) => {
  if (logType === 'farm') {
    return condition === 'Good' ? 'Baik' : condition === 'Monitor' ? 'Perlu Perhatian' : 'Kerosakan';
  }
  return condition;
};

function getLogType(log: ConditionLog): 'animal' | 'farm' {
  return log.logType === 'farm' ? 'farm' : 'animal';
}

export default function ConditionLogsPage() {
  const [logs, setLogs] = useState<ConditionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Good' | 'Monitor' | 'Sick' | 'unreviewed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'animal' | 'farm'>('all');
  const [selectedLog, setSelectedLog] = useState<ConditionLog | null>(null);
  const [viewingAnimal, setViewingAnimal] = useState<Livestock | null>(null);
  const [loadingAnimal, setLoadingAnimal] = useState<string | null>(null);

  const openAnimalProfile = async (e: React.MouseEvent, animalId: string) => {
    e.stopPropagation();
    setLoadingAnimal(animalId);
    try {
      const db2 = getFirebaseDb();
      const q = query(collection(db2, 'animals'), where('animalId', '==', animalId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0];
        const raw = docData.data();
        const animal: Livestock = {
          id: docData.id,
          animalId: raw.animalId,
          tagId: raw.tagId || '',
          type: raw.type,
          breed: raw.breed || '',
          dateOfBirth: raw.dateOfBirth?.toDate ? raw.dateOfBirth.toDate() : new Date(raw.dateOfBirth || Date.now()),
          gender: raw.gender || 'male',
          status: raw.status || 'healthy',
          weight: raw.weight || 0,
          location: raw.location || '',
          purchaseDate: raw.purchaseDate?.toDate ? raw.purchaseDate.toDate() : undefined,
          purchasePrice: raw.purchasePrice,
          notes: raw.notes,
          createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate() : new Date(),
          updatedAt: raw.updatedAt?.toDate ? raw.updatedAt.toDate() : new Date(),
          photoUrl: raw.photoUrl,
          rfid: raw.rfid || '',
        };
        setViewingAnimal(animal);
      }
    } finally {
      setLoadingAnimal(null);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'condition_logs'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConditionLog));
      setLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const markReviewed = async (logId: string) => {
    await updateDoc(doc(db, 'condition_logs', logId), { isReviewed: true });
  };

  const filtered = logs.filter((l) => {
    if (typeFilter !== 'all' && getLogType(l) !== typeFilter) return false;
    if (filter === 'all') return true;
    if (filter === 'unreviewed') return !l.isReviewed;
    return l.condition === filter;
  });

  const stats = {
    total: logs.length,
    animal: logs.filter((l) => getLogType(l) === 'animal').length,
    farm: logs.filter((l) => getLogType(l) === 'farm').length,
    good: logs.filter((l) => l.condition === 'Good').length,
    monitor: logs.filter((l) => l.condition === 'Monitor').length,
    sick: logs.filter((l) => l.condition === 'Sick').length,
    unreviewed: logs.filter((l) => !l.isReviewed).length,
  };

  const formatTime = (ts: Timestamp | undefined) => {
    if (!ts) return '—';
    const d = ts.toDate();
    return d.toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Farmer Reports</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Condition Logs</h2>
        <p className="mt-0.5 text-sm text-slate-500">Laporan keadaan ternakan dan ladang daripada farmer — gambar dan nota pemerhatian.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
        <CondStatCard label="Total Logs" value={stats.total} val="text-slate-800" img="/ConditionLog/totallog.png" />
        <CondStatCard label="Animal Reports" value={stats.animal} val="text-emerald-700" img="/ConditionLog/goodcondition.png" />
        <CondStatCard label="Farm / Facility Reports" value={stats.farm} val="text-amber-700" img="/ConditionLog/monitor.png" />
        <CondStatCard label="Sick / Damaged" value={stats.sick} val="text-red-700" img="/ConditionLog/sick.png" />
      </div>

      {/* Unreviewed alert */}
      {stats.unreviewed > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-800">{stats.unreviewed} log belum disemak</p>
            <p className="text-xs text-amber-600">Sila semak laporan terkini daripada farmer.</p>
          </div>
          <button
            onClick={() => setFilter('unreviewed')}
            className="ml-auto text-xs font-semibold text-amber-700 underline"
          >
            View
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Type</span>
          {([
            { key: 'all', label: 'All' },
            { key: 'animal', label: `Animal (${stats.animal})` },
            { key: 'farm', label: `Farm / Facility (${stats.farm})` },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                typeFilter === t.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</span>
          {(['all', 'unreviewed', 'Good', 'Monitor', 'Sick'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                filter === f
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unreviewed' ? `Unreviewed (${stats.unreviewed})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-100 py-16">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500 font-medium">No logs found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((log) => {
            const cfg = conditionConfig[log.condition] ?? conditionConfig.Good;
            const isFarm = getLogType(log) === 'farm';
            return (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`relative rounded-2xl bg-white border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition group ${
                  !log.isReviewed ? 'border-amber-300' : 'border-slate-100'
                }`}
              >
                {/* Photo */}
                {log.photoUrl ? (
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      src={log.photoUrl}
                      alt="Condition"
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-44 w-full bg-slate-50 flex items-center justify-center">
                    <span className="text-4xl">{isFarm ? '🏚️' : '📷'}</span>
                  </div>
                )}

                {/* Type badge */}
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isFarm ? 'bg-slate-900/80 text-white' : 'bg-emerald-600/90 text-white'
                }`}>
                  {isFarm ? 'FARM / FACILITY' : 'ANIMAL'}
                </span>

                {/* Unreviewed badge */}
                {!log.isReviewed && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    NEW
                  </span>
                )}

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {isFarm ? (log.areaLabel || 'Farm / Facility') : (log.animalDisplayName || '—')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">by {log.farmerName}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {conditionLabel(log.logType, log.condition)}
                    </span>
                  </div>

                  {log.notes && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {log.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[11px] text-slate-400">{formatTime(log.timestamp)}</p>
                    {!isFarm && log.animalId && (
                      <button
                        onClick={(e) => openAnimalProfile(e, log.animalId!)}
                        disabled={loadingAnimal === log.animalId}
                        className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition disabled:opacity-50"
                      >
                        {loadingAnimal === log.animalId ? (
                          <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                        View Animal
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedLog.photoUrl && (
              <div className="relative h-64 w-full bg-slate-100 rounded-t-2xl overflow-hidden">
                <Image src={selectedLog.photoUrl} alt="Condition" fill className="object-cover" />
              </div>
            )}

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block mb-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    getLogType(selectedLog) === 'farm' ? 'bg-slate-900/80 text-white' : 'bg-emerald-600/90 text-white'
                  }`}>
                    {getLogType(selectedLog) === 'farm' ? 'FARM / FACILITY' : 'ANIMAL'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {getLogType(selectedLog) === 'farm' ? (selectedLog.areaLabel || 'Farm / Facility') : selectedLog.animalDisplayName}
                  </h3>
                  <p className="text-sm text-slate-400">Reported by {selectedLog.farmerName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${conditionConfig[selectedLog.condition]?.color}`}>
                  {conditionLabel(selectedLog.logType, selectedLog.condition)}
                </span>
              </div>

              {selectedLog.notes && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedLog.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{formatTime(selectedLog.timestamp)}</span>
                <span>{selectedLog.isReviewed ? '✅ Reviewed' : '⏳ Not reviewed'}</span>
              </div>

              <div className="flex gap-3">
                {!selectedLog.isReviewed && (
                  <button
                    onClick={async () => {
                      await markReviewed(selectedLog.id);
                      setSelectedLog({ ...selectedLog, isReviewed: true });
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button
                  onClick={() => setSelectedLog(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animal Profile Modal */}
      {viewingAnimal && (
        <AnimalProfileModal
          animal={viewingAnimal}
          onClose={() => setViewingAnimal(null)}
        />
      )}
    </div>
  );
}

function CondStatCard({ label, value, val, img }: {
  label: string; value: number; val: string; img: string;
}) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 sm:h-24 sm:w-24">
        <img src={img} alt={label} className="h-16 w-16 object-contain drop-shadow-sm sm:h-20 sm:w-20" />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className={`text-3xl font-extrabold tabular-nums leading-none sm:text-4xl ${val}`}>{value}</p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-500 sm:text-base">{label}</p>
      </div>
    </div>
  );
}
