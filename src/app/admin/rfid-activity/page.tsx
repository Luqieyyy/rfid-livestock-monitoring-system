'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MovementLog {
  id: string;
  rfid_tag: string;
  animal_id: string | null;
  animal_name: string | null;
  animal_type: string | null;
  breed: string | null;
  location: string | null;
  scan_result: 'success' | 'not_found';
  device_name: string;
  date_key: string;
  timestamp: Timestamp | null;
  error: string | null;
}

interface DayStats {
  totalScans: number;
  successScans: number;
  unknownScans: number;
  uniqueAnimals: number;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: Timestamp | null): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function computeStats(logs: MovementLog[]): DayStats {
  const uniqueAnimals = new Set(logs.filter(l => l.animal_id).map(l => l.animal_id)).size;
  const byType: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  logs.forEach(l => {
    if (l.animal_type) byType[l.animal_type] = (byType[l.animal_type] || 0) + 1;
    if (l.location) byLocation[l.location] = (byLocation[l.location] || 0) + 1;
  });
  return {
    totalScans: logs.length,
    successScans: logs.filter(l => l.scan_result === 'success').length,
    unknownScans: logs.filter(l => l.scan_result === 'not_found').length,
    uniqueAnimals,
    byType,
    byLocation,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RfidActivityPage() {
  const db = getFirebaseDb();

  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()));
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'success' | 'not_found'>('all');

  const loadLogs = useCallback(async (dateKey: string) => {
    setLoading(true);
    try {
      const ref = collection(db, 'rfid_movement_logs');
      const q = query(
        ref,
        where('date_key', '==', dateKey),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const snap = await getDocs(q);
      const data: MovementLog[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MovementLog, 'id'>),
      }));
      setLogs(data);
      setStats(computeStats(data));
    } catch (err) {
      console.error('Error loading RFID movement logs:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadLogs(selectedDate);
  }, [selectedDate, loadLogs]);

  const filteredLogs = logs.filter(l =>
    filterType === 'all' ? true : l.scan_result === filterType
  );

  const typeEmoji: Record<string, string> = { cow: '🐄', goat: '🐐', sheep: '🐑' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFID Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Auto-log setiap imbasan RFID — daily movement report</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600">Tarikh:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={() => loadLogs(selectedDate)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Memuatkan log aktiviti...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Jumlah Imbasan"
                value={stats.totalScans}
                icon="📡"
                color="bg-blue-50 border-blue-100"
                valueColor="text-blue-700"
              />
              <StatCard
                label="Haiwan Dikenal"
                value={stats.successScans}
                icon="✅"
                color="bg-emerald-50 border-emerald-100"
                valueColor="text-emerald-700"
              />
              <StatCard
                label="Tag Tidak Daftar"
                value={stats.unknownScans}
                icon="⚠️"
                color="bg-amber-50 border-amber-100"
                valueColor="text-amber-700"
              />
              <StatCard
                label="Haiwan Unik"
                value={stats.uniqueAnimals}
                icon="🐄"
                color="bg-purple-50 border-purple-100"
                valueColor="text-purple-700"
              />
            </div>
          )}

          {/* Breakdown: Type & Location */}
          {stats && (Object.keys(stats.byType).length > 0 || Object.keys(stats.byLocation).length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* By Type */}
              {Object.keys(stats.byType).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Imbasan Ikut Jenis</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-xl w-8">{typeEmoji[type] ?? '🐾'}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium text-gray-700">{type}</span>
                            <span className="font-bold text-gray-900">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(count / stats.totalScans) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Location */}
              {Object.keys(stats.byLocation).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Imbasan Ikut Kandang</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.byLocation).sort((a, b) => b[1] - a[1]).map(([loc, count]) => (
                      <div key={loc} className="flex items-center gap-3">
                        <span className="text-xl w-8">📍</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{loc}</span>
                            <span className="font-bold text-gray-900">{count}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${(count / stats.totalScans) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Menunjukkan <span className="font-semibold text-gray-900">{filteredLogs.length}</span> daripada {logs.length} rekod untuk <span className="font-semibold">{selectedDate}</span>
            </p>
            <div className="flex gap-2">
              {(['all', 'success', 'not_found'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    filterType === f
                      ? f === 'all'
                        ? 'bg-gray-800 text-white'
                        : f === 'success'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'success' ? '✅ Dikenal' : '⚠️ Tidak Daftar'}
                </button>
              ))}
            </div>
          </div>

          {/* Log Timeline */}
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiada rekod RFID</h3>
              <p className="text-gray-500">Belum ada imbasan RFID untuk tarikh <strong>{selectedDate}</strong></p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${
                      log.scan_result === 'not_found' ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Status dot */}
                    <div className="mt-1 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        log.scan_result === 'success' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} />
                    </div>

                    {/* Animal info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {log.animal_type && (
                          <span className="text-base">{typeEmoji[log.animal_type] ?? '🐾'}</span>
                        )}
                        <p className="font-semibold text-gray-900 truncate">
                          {log.animal_name ?? (
                            <span className="text-amber-700">Tag Tidak Daftar</span>
                          )}
                        </p>
                        {log.breed && (
                          <span className="text-xs text-gray-400 capitalize">{log.breed}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.rfid_tag}</span>
                        {log.location && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>{log.location}
                          </span>
                        )}
                        {log.device_name && (
                          <span className="flex items-center gap-1">
                            <span>📶</span>{log.device_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-700">{formatTime(log.timestamp)}</p>
                      <p className="text-xs text-gray-400">{formatDate(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  valueColor,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  valueColor: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
