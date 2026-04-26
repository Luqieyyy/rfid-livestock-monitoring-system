'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import type { Livestock, HealthRecord, FeedingActivity } from '@/types/livestock.types';

const HEALTH_COLORS = ['#10b981', '#f59e0b', '#f97316', '#64748b'];

export default function AdminDashboard() {
  const {
    stats,
    livestock,
    recentLivestock,
    recentFeedings,
    upcomingCheckups,
    rfidActivity,
    loading,
    lastUpdated,
  } = useDashboardRealtime();

  const formatMYR = (amount: number): string => `MYR ${amount.toLocaleString('en-MY')}`;

  if (loading) {
    return <DashboardSkeleton />;
  }

  const totalLivestock = stats?.totalLivestock || 0;
  const healthyRate = totalLivestock ? Math.round(((stats?.healthyCount || 0) / totalLivestock) * 100) : 0;
  const attentionRate = totalLivestock
    ? Math.round((((stats?.sickCount || 0) + upcomingCheckups.length) / totalLivestock) * 100)
    : 0;
  const revenuePerHead = totalLivestock ? (stats?.totalRevenue || 0) / totalLivestock : 0;
  const feedLoggedToday = recentFeedings.filter((feeding) => isSameDay(feeding.fedAt, new Date())).length;

  const healthDistribution = [
    { name: 'Healthy', value: stats?.healthyCount || 0 },
    { name: 'Treatment', value: stats?.sickCount || 0 },
    { name: 'Quarantine / Watch', value: upcomingCheckups.length },
    { name: 'Deceased', value: stats?.deceasedCount || 0 },
  ].filter((item) => item.value > 0);

  const operationsData = [
    { name: 'Healthy', value: stats?.healthyCount || 0 },
    { name: 'Treatment', value: stats?.sickCount || 0 },
    { name: 'Breeding', value: stats?.activeBreedingCount || 0 },
    { name: 'Sales', value: stats?.pendingSalesCount || 0 },
    { name: 'Checkups', value: upcomingCheckups.length },
  ];

  const livestockTypeData = [
    {
      label: 'Cows',
      value: recentLivestock.filter((animal) => animal.type === 'cow').length,
      tone: 'bg-emerald-500',
    },
    {
      label: 'Goats',
      value: recentLivestock.filter((animal) => animal.type === 'goat').length,
      tone: 'bg-sky-500',
    },
    {
      label: 'Others',
      value: recentLivestock.filter((animal) => animal.type !== 'cow' && animal.type !== 'goat').length,
      tone: 'bg-slate-400',
    },
  ].filter((item) => item.value > 0);

  const focusItems: Array<{
    label: string;
    value: string;
    helper: string;
    tone: 'emerald' | 'amber' | 'cyan' | 'violet';
  }> = [
    {
      label: 'Health stability',
      value: `${healthyRate}%`,
      helper: `${stats?.healthyCount || 0} of ${totalLivestock} livestock in healthy status`,
      tone: 'emerald',
    },
    {
      label: 'Cases needing follow-up',
      value: `${(stats?.sickCount || 0) + upcomingCheckups.length}`,
      helper: `${stats?.sickCount || 0} treatment cases and ${upcomingCheckups.length} scheduled checkups`,
      tone: 'amber',
    },
    {
      label: 'Revenue per head',
      value: formatMYR(revenuePerHead),
      helper: 'Completed sales revenue spread across total livestock',
      tone: 'cyan',
    },
    {
      label: 'Feed logs today',
      value: `${feedLoggedToday}`,
      helper: `${recentFeedings.length} recent feeding records loaded on dashboard`,
      tone: 'violet',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Dashboard Overview</span>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live
            </div>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Ringkasan operasi ladang</h2>
          {lastUpdated && (
            <p className="mt-0.5 text-xs text-slate-400">
              Dikemaskini {lastUpdated.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
        <Link
          href="/admin/health"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 self-start sm:self-auto"
        >
          <PulseIcon />
          Review health queue
        </Link>
      </div>

      {/* ── IoT Smart Farm Monitor ── TOP SECTION ──────────────── */}
      <IoTMonitorSection />

      {/* Hero KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <HeroMetric
          label="Total Livestock"
          value={`${totalLivestock}`}
          helper="Animals currently tracked"
          icon={<LivestockKpiIcon />}
          tone="slate"
        />
        <HeroMetric
          label="Healthy Rate"
          value={`${healthyRate}%`}
          helper={`${stats?.healthyCount || 0} of ${totalLivestock} in healthy status`}
          icon={<HealthKpiIcon />}
          tone="emerald"
        />
        <HeroMetric
          label="Need Attention"
          value={`${attentionRate}%`}
          helper={`${(stats?.sickCount || 0) + upcomingCheckups.length} cases require action`}
          icon={<AlertKpiIcon />}
          tone={attentionRate > 0 ? 'amber' : 'slate'}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {focusItems.map((item) => (
          <InsightCard key={item.label} {...item} />
        ))}
      </section>

      {/* ── Sales & Farm Analytics ───────────────────────────── */}
      <SalesAnalyticsSection totalRevenue={stats?.totalRevenue || 0} totalLivestock={totalLivestock} healthyCount={stats?.healthyCount || 0} sickCount={stats?.sickCount || 0} />

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Operational snapshot</h3>
              <p className="mt-1 text-sm text-slate-500">Perbandingan beban kerja utama untuk health, breeding dan sales.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Live from current records
            </span>
          </div>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={operationsData} barSize={26}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {operationsData.map((entry, index) => (
                    <Cell key={entry.name} fill={['#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#334155'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Livestock health mix</h3>
            <p className="mt-1 text-sm text-slate-500">Pie chart untuk nampak pecahan status ternakan dengan cepat.</p>
          </div>
          <div className="h-[250px]">
            {healthDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {healthDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No health distribution data yet" compact />
            )}
          </div>
          <div className="mt-4 grid gap-3">
            {healthDistribution.length > 0 ? (
              healthDistribution.map((item, index) => (
                <LegendRow key={item.name} color={HEALTH_COLORS[index % HEALTH_COLORS.length]} label={item.name} value={item.value} />
              ))
            ) : (
              <p className="text-sm text-slate-500">Bila data ternakan masuk, pecahan status akan muncul di sini.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Farm overview</h3>
              <p className="mt-1 text-sm text-slate-500">KPI kewangan, berat purata dan komposisi ternakan terkini.</p>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">overview</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <OverviewTile
              title="Total revenue"
              value={formatMYR(stats?.totalRevenue || 0)}
              helper="Completed payments only"
              icon={<Image src="/sales_myr.png" alt="revenue" width={44} height={44} className="h-11 w-11 object-contain" />}
              tone="emerald"
            />
            <OverviewTile
              title="Average weight"
              value={`${(stats?.averageWeight || 0).toFixed(1)} kg`}
              helper="Across tracked livestock"
              icon={<Image src="/avg_weight.png" alt="weight" width={44} height={44} className="h-11 w-11 object-contain" />}
              tone="sky"
            />
            <OverviewTile
              title="Deceased"
              value={`${stats?.deceasedCount || 0}`}
              helper="Historical loss count"
              icon={<Image src="/deceased.png" alt="deceased" width={44} height={44} className="h-11 w-11 object-contain" />}
              tone="slate"
            />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">Recent livestock mix</h4>
                <p className="text-sm text-slate-500">Komposisi daripada ternakan paling baru dimuatkan pada dashboard.</p>
              </div>
              <span className="text-sm font-medium text-slate-600">{recentLivestock.length} records</span>
            </div>
            {livestockTypeData.length > 0 ? (
              <div className="space-y-4">
                {livestockTypeData.map((item) => {
                  const width = recentLivestock.length ? (item.value / recentLivestock.length) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500">{item.value}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState message="No recent livestock records yet" compact />
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quick actions</h3>
              <p className="mt-1 text-sm text-slate-500">Shortcut untuk operasi admin yang paling kerap.</p>
            </div>
          </div>
          <div className="grid gap-3">
            <QuickActionButton href="/admin/livestock" icon="livestock" label="Add Livestock" sublabel="Register a new animal into the system" />
            <QuickActionButton href="/admin/health" icon="health" label="Record Health" sublabel="Update treatment, diagnosis or vaccination" />
            <QuickActionButton href="/admin/breeding" icon="breeding" label="New Breeding" sublabel="Track mating plan and expected delivery" />
            <QuickActionButton href="/admin/sales" icon="sales" label="Record Sale" sublabel="Capture buyer details and payment status" />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ActivityPanel
          title="Recent livestock"
          href="/admin/livestock"
          items={recentLivestock}
          emptyMessage="No livestock data yet"
          renderItem={(animal: Livestock) => (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
                  <AnimalIcon />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{animal.animalId || animal.id}</p>
                  <p className="text-sm text-slate-500 capitalize">
                    {animal.breed} • {animal.type}
                  </p>
                </div>
              </div>
              <StatusBadge status={animal.status} />
            </div>
          )}
        />

        <ActivityPanel
          title="Recent feeding"
          href="/admin/feeding"
          items={recentFeedings}
          emptyMessage="No feeding activities yet"
          renderItem={(feeding: FeedingActivity) => (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100">
                  <FeedIcon />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{feeding.livestockAnimalId || feeding.livestockId}</p>
                  <p className="text-sm text-slate-500">
                    {feeding.feedType} • {feeding.quantity} {feeding.unit}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {new Date(feeding.fedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-500">{feeding.farmerName}</p>
              </div>
            </div>
          )}
        />

        <ActivityPanel
          title="Upcoming checkups"
          href="/admin/health"
          items={upcomingCheckups}
          emptyMessage="No upcoming checkups"
          renderItem={(checkup: HealthRecord) => (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {livestock.find((l) => l.id === checkup.livestockId)?.animalId ?? checkup.livestockId}
                  </p>
                  <p className="text-sm capitalize text-slate-500">{checkup.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {checkup.nextCheckup ? new Date(checkup.nextCheckup).toLocaleDateString('en-MY') : 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Scheduled</p>
              </div>
            </div>
          )}
        />
      </section>

      {/* RFID Live Activity Feed */}
      {rfidActivity.length > 0 && (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                <RfidIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">RFID Scan Activity</h3>
                <p className="text-sm text-slate-500">Terkini dari Flutter app — scan ternakan secara real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 border border-violet-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
              </span>
              Live
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rfidActivity.slice(0, 6).map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <RfidIcon small />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{scan.name || scan.animalId}</p>
                  <p className="text-xs text-slate-500 capitalize">{scan.type} · {scan.breed || 'Unknown breed'}</p>
                  <p className="text-xs text-violet-600 font-mono mt-0.5">{scan.rfid}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-slate-700">
                    {scan.scannedAt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {scan.scannedAt.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats && stats.sickCount > 0 && (
        <section className="rounded-[28px] border border-red-100 bg-gradient-to-r from-red-50 to-orange-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertIcon />
              </div>
              <div>
                <h4 className="font-semibold text-red-800">Health alert</h4>
                <p className="mt-1 text-sm text-red-700">
                  {stats.sickCount} animal{stats.sickCount > 1 ? 's are' : ' is'} currently under treatment. Semak rekod health untuk tindakan susulan.
                </p>
              </div>
            </div>
            <Link href="/admin/health" className="text-sm font-medium text-red-700 transition hover:text-red-800">
              View records →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IoT Smart Farm Monitor — dummy data, ready to swap with live Firebase reads
// ─────────────────────────────────────────────────────────────────────────────

type SensorReading = {
  temp: number;       // °C
  humidity: number;   // %
  nh3: number;        // ppm
  feedLevel: number;  // % remaining
  weight: number;     // kg (latest smart-lane reading)
  lastSeen: Date;
  online: boolean;
};

type AlertLevel = 'normal' | 'warning' | 'critical';

function getSensorAlert(reading: SensorReading): { level: AlertLevel; messages: string[] } {
  const msgs: string[] = [];
  let level: AlertLevel = 'normal';

  if (reading.temp > 35) { msgs.push(`Suhu terlalu tinggi (${reading.temp}°C)`); level = 'critical'; }
  else if (reading.temp > 32) { msgs.push(`Suhu melebihi had selesa (${reading.temp}°C)`); if (level === 'normal') level = 'warning'; }

  if (reading.humidity > 85) { msgs.push(`Kelembapan tinggi (${reading.humidity}%)`); if (level !== 'critical') level = 'warning'; }

  if (reading.nh3 > 35) { msgs.push(`NH₃ bahaya (${reading.nh3} ppm) — perlu ventilasi segera`); level = 'critical'; }
  else if (reading.nh3 > 20) { msgs.push(`NH₃ tinggi (${reading.nh3} ppm) — kandang perlu dibersihkan`); if (level === 'normal') level = 'warning'; }

  if (reading.feedLevel < 15) { msgs.push(`Feed hampir habis (${reading.feedLevel}%)`); if (level === 'normal') level = 'warning'; }

  return { level, messages: msgs };
}

const DUMMY_SENSORS: Record<string, SensorReading> = {
  'Kandang A': { temp: 29.4, humidity: 72, nh3: 12, feedLevel: 68, weight: 184.2, lastSeen: new Date(), online: true },
  'Kandang B': { temp: 33.1, humidity: 88, nh3: 26, feedLevel: 11, weight: 176.5, lastSeen: new Date(), online: true },
  'Kandang C': { temp: 27.8, humidity: 65, nh3: 8,  feedLevel: 54, weight: 201.0, lastSeen: new Date(), online: true },
};

type HistoryPoint = {
  time: string;
  tempA: number; tempB: number; tempC: number;
  humA: number; humB: number; humC: number;
  nh3A: number; nh3B: number; nh3C: number;
};

const HISTORY_MAX = 20;

function buildSeedHistory(): HistoryPoint[] {
  const now = Date.now();
  return Array.from({ length: 15 }, (_, i) => {
    const t = new Date(now - (14 - i) * 4000);
    return {
      time: t.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      tempA: +(29.4 + (Math.random() - 0.5) * 1.5).toFixed(1),
      tempB: +(33.1 + (Math.random() - 0.5) * 1.5).toFixed(1),
      tempC: +(27.8 + (Math.random() - 0.5) * 1.5).toFixed(1),
      humA: Math.round(72 + (Math.random() - 0.5) * 4),
      humB: Math.round(88 + (Math.random() - 0.5) * 4),
      humC: Math.round(65 + (Math.random() - 0.5) * 4),
      nh3A: +(12 + (Math.random() - 0.5) * 3).toFixed(1),
      nh3B: +(26 + (Math.random() - 0.5) * 3).toFixed(1),
      nh3C: +(8 + (Math.random() - 0.5) * 3).toFixed(1),
    };
  });
}

function IoTMonitorSection() {
  const [sensors, setSensors] = useState<Record<string, SensorReading>>(DUMMY_SENSORS);
  const [history, setHistory] = useState<HistoryPoint[]>(buildSeedHistory);
  const [activeMetric, setActiveMetric] = useState<'temp' | 'humidity' | 'nh3'>('temp');

  // Simulate live fluctuation — swap this with real Firestore listener later
  useEffect(() => {
    const id = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSensors(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          const s = next[key];
          next[key] = {
            ...s,
            temp:     +(s.temp     + (Math.random() - 0.5) * 0.4).toFixed(1),
            humidity: Math.min(100, Math.max(40, +(s.humidity + (Math.random() - 0.5) * 1.0).toFixed(0))),
            nh3:      Math.max(0, +(s.nh3 + (Math.random() - 0.5) * 1.5).toFixed(1)),
            lastSeen: new Date(),
          };
        }
        setHistory(h => {
          const entry: HistoryPoint = {
            time: timeStr,
            tempA: +next['Kandang A'].temp.toFixed(1),
            tempB: +next['Kandang B'].temp.toFixed(1),
            tempC: +next['Kandang C'].temp.toFixed(1),
            humA: next['Kandang A'].humidity,
            humB: next['Kandang B'].humidity,
            humC: next['Kandang C'].humidity,
            nh3A: +next['Kandang A'].nh3.toFixed(1),
            nh3B: +next['Kandang B'].nh3.toFixed(1),
            nh3C: +next['Kandang C'].nh3.toFixed(1),
          };
          const updated = [...h, entry];
          return updated.length > HISTORY_MAX ? updated.slice(-HISTORY_MAX) : updated;
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const allAlerts = Object.entries(sensors).flatMap(([name, s]) =>
    getSensorAlert(s).messages.map(m => ({ kandang: name, msg: m, level: getSensorAlert(s).level }))
  );

  const criticalCount = allAlerts.filter(a => a.level === 'critical').length;
  const warningCount  = allAlerts.filter(a => a.level === 'warning').length;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">IoT Smart Farm Monitor</h3>
            <p className="text-xs text-slate-400">DHT22 · MQ-137 NH₃ · Smart Feed · Smart Weigh Lane</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700">
              ⚠ {warningCount} Warning
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              All Normal
            </span>
          )}
        </div>
      </div>

      {/* Alert banner */}
      {allAlerts.length > 0 && (
        <div className={`rounded-2xl border px-5 py-4 flex flex-col gap-2 ${
          criticalCount > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
            {criticalCount > 0 ? '🚨 Tindakan segera diperlukan' : '⚠️ Perhatian diperlukan'}
          </p>
          <div className="flex flex-wrap gap-2">
            {allAlerts.map((a, i) => (
              <span key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                a.level === 'critical'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                <span className="font-semibold">{a.kandang}:</span> {a.msg}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sensor cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.entries(sensors).map(([name, s]) => {
          const { level } = getSensorAlert(s);
          return <SensorCard key={name} name={name} reading={s} level={level} />;
        })}
      </div>

      {/* Sensor Trend Charts */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Sensor Trend Analytics</h4>
            <p className="text-xs text-slate-400">Real-time sensor history — updates every 4 saat · semua kandang dalam satu graf</p>
          </div>
          <div className="flex gap-1.5">
            {(['temp', 'humidity', 'nh3'] as const).map(m => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeMetric === m
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m === 'temp' ? 'Suhu °C' : m === 'humidity' ? 'Humidity %' : 'NH₃ ppm'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {activeMetric === 'temp' && <>
                <Line type="monotone" dataKey="tempA" name="Kandang A" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="tempB" name="Kandang B" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="tempC" name="Kandang C" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </>}
              {activeMetric === 'humidity' && <>
                <Line type="monotone" dataKey="humA" name="Kandang A" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="humB" name="Kandang B" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="humC" name="Kandang C" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </>}
              {activeMetric === 'nh3' && <>
                <Line type="monotone" dataKey="nh3A" name="Kandang A" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="nh3B" name="Kandang B" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="nh3C" name="Kandang C" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sales & Farm Analytics Section
// ─────────────────────────────────────────────────────────────────────────────

const MONTHLY_SALES_SEED = [
  { month: 'Nov', revenue: 3200, livestock: 48 },
  { month: 'Dis', revenue: 4150, livestock: 51 },
  { month: 'Jan', revenue: 2900, livestock: 49 },
  { month: 'Feb', revenue: 5400, livestock: 54 },
  { month: 'Mac', revenue: 4800, livestock: 53 },
  { month: 'Apr', revenue: 6100, livestock: 59 },
];

function SalesAnalyticsSection({
  totalRevenue,
  totalLivestock,
  healthyCount,
  sickCount,
}: {
  totalRevenue: number;
  totalLivestock: number;
  healthyCount: number;
  sickCount: number;
}) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'livestock'>('revenue');

  const bestMonth = MONTHLY_SALES_SEED.reduce((best, m) => m.revenue > best.revenue ? m : best, MONTHLY_SALES_SEED[0]);
  const avgRevenue = Math.round(MONTHLY_SALES_SEED.reduce((s, m) => s + m.revenue, 0) / MONTHLY_SALES_SEED.length);
  const growthPct = MONTHLY_SALES_SEED.length >= 2
    ? Math.round(((MONTHLY_SALES_SEED.at(-1)!.revenue - MONTHLY_SALES_SEED.at(-2)!.revenue) / MONTHLY_SALES_SEED.at(-2)!.revenue) * 100)
    : 0;

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Farm Analytics</h3>
          <p className="mt-1 text-sm text-slate-500">Track jualan bulanan, trend ternakan dan prestasi ladang secara keseluruhan.</p>
        </div>
        <div className="flex gap-1.5">
          {(['revenue', 'livestock'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'revenue' ? 'Revenue (MYR)' : 'Livestock Count'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3">
          <p className="text-xs text-emerald-600 font-medium">Total Revenue</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">MYR {totalRevenue.toLocaleString('en-MY')}</p>
        </div>
        <div className="rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3">
          <p className="text-xs text-sky-600 font-medium">Avg / Bulan</p>
          <p className="mt-1 text-xl font-bold text-sky-700">MYR {avgRevenue.toLocaleString('en-MY')}</p>
        </div>
        <div className="rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3">
          <p className="text-xs text-violet-600 font-medium">Best Month</p>
          <p className="mt-1 text-xl font-bold text-violet-700">{bestMonth.month} · MYR {bestMonth.revenue.toLocaleString('en-MY')}</p>
        </div>
        <div className={`rounded-2xl px-4 py-3 border ${growthPct >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className={`text-xs font-medium ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>MoM Growth</p>
          <p className={`mt-1 text-xl font-bold ${growthPct >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'revenue' ? (
            <AreaChart data={MONTHLY_SALES_SEED} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                formatter={(v: number) => [`MYR ${v.toLocaleString('en-MY')}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          ) : (
            <AreaChart data={MONTHLY_SALES_SEED} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="livestockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
                formatter={(v: number) => [v, 'Livestock']}
              />
              <Area type="monotone" dataKey="livestock" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#livestockGrad)" dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Health breakdown mini bar */}
      <div className="mt-5 rounded-2xl bg-slate-50 px-5 py-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Livestock Health Breakdown</span>
          <span className="text-slate-400 text-xs">{totalLivestock} total</span>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5">
          {totalLivestock > 0 && <>
            <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${(healthyCount / totalLivestock) * 100}%` }} title={`Healthy: ${healthyCount}`} />
            <div className="bg-amber-400 transition-all" style={{ width: `${(sickCount / totalLivestock) * 100}%` }} title={`Sick: ${sickCount}`} />
            <div className="bg-slate-300 rounded-r-full flex-1" title="Others" />
          </>}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Healthy {healthyCount}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Treatment {sickCount}</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" />Others {Math.max(0, totalLivestock - healthyCount - sickCount)}</span>
        </div>
      </div>
    </section>
  );
}

function SensorCard({ name, reading: s, level }: { name: string; reading: SensorReading; level: AlertLevel }) {
  const borderMap = { normal: 'border-slate-200', warning: 'border-amber-300', critical: 'border-red-300' };
  const glowMap   = { normal: '', warning: 'shadow-amber-100', critical: 'shadow-red-100' };

  const tempColor  = s.temp > 35 ? 'text-red-600' : s.temp > 32 ? 'text-amber-600' : 'text-emerald-600';
  const humColor   = s.humidity > 85 ? 'text-amber-600' : 'text-sky-600';
  const nh3Color   = s.nh3 > 35 ? 'text-red-600' : s.nh3 > 20 ? 'text-amber-600' : 'text-emerald-600';
  const feedColor  = s.feedLevel < 15 ? 'text-red-600' : s.feedLevel < 30 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${borderMap[level]} ${glowMap[level]}`}>
      {/* Card header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${s.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="text-sm font-semibold text-slate-800">{name}</span>
        </div>
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
          level === 'critical' ? 'bg-red-100 text-red-600'
          : level === 'warning' ? 'bg-amber-100 text-amber-600'
          : 'bg-emerald-100 text-emerald-600'
        }`}>
          {level === 'normal' ? 'Normal' : level === 'warning' ? 'Warning' : 'Critical'}
        </span>
      </div>

      {/* Sensor rows */}
      <div className="space-y-3">
        {/* Temp + Humidity row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">TEMPERATURE</p>
            <p className={`text-xl font-bold tabular-nums ${tempColor}`}>{s.temp}°C</p>
            <TrendBar value={s.temp} min={20} max={40} color={s.temp > 35 ? '#ef4444' : s.temp > 32 ? '#f59e0b' : '#10b981'} />
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">HUMIDITY</p>
            <p className={`text-xl font-bold tabular-nums ${humColor}`}>{s.humidity}%</p>
            <TrendBar value={s.humidity} min={30} max={100} color={s.humidity > 85 ? '#f59e0b' : '#0ea5e9'} />
          </div>
        </div>

        {/* NH3 */}
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-slate-400 font-medium">NH₃ AMMONIA</p>
            <span className={`text-[10px] font-semibold ${nh3Color}`}>
              {s.nh3 > 35 ? 'BAHAYA' : s.nh3 > 20 ? 'TINGGI' : 'SELAMAT'}
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-xl font-bold tabular-nums ${nh3Color}`}>{s.nh3}</p>
            <p className="text-xs text-slate-400 mb-0.5">ppm</p>
          </div>
          {/* NH3 segmented bar */}
          <div className="mt-2 flex gap-0.5 h-1.5 rounded-full overflow-hidden">
            <div className="flex-1 bg-emerald-400 rounded-l-full" />
            <div className={`flex-1 ${s.nh3 > 20 ? 'bg-amber-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 ${s.nh3 > 35 ? 'bg-red-500' : 'bg-slate-200'} rounded-r-full`} />
          </div>
          <div className="flex justify-between text-[9px] text-slate-300 mt-0.5">
            <span>0</span><span>20</span><span>35+</span>
          </div>
        </div>

        {/* Feed level + Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">SMART FEED</p>
            <p className={`text-xl font-bold tabular-nums ${feedColor}`}>{s.feedLevel}%</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  s.feedLevel < 15 ? 'bg-red-500' : s.feedLevel < 30 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${s.feedLevel}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">WEIGH LANE</p>
            <p className="text-xl font-bold tabular-nums text-violet-600">{s.weight}</p>
            <p className="text-[10px] text-slate-400">kg avg</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-300 text-right">
        Kemaskini {s.lastSeen.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
    </div>
  );
}

function TrendBar({ value, min, max, color }: { value: number; min: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return (
    <div className="mt-1.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function useCountUp(target: number, duration = 900): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;
    startRef.current = null;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return current;
}

function HeroMetric({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone: 'slate' | 'emerald' | 'amber';
}) {
  // Extract numeric portion for animation, preserve suffix (%, etc.)
  const match = value.match(/^(\d+(\.\d+)?)(.*)/);
  const numericPart = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[3] : '';
  const animated = useCountUp(numericPart ?? 0);
  const displayValue = numericPart !== null ? `${animated}${suffix}` : value;

  const toneMap = {
    slate: { wrap: 'border-slate-200 bg-white', iconWrap: 'bg-slate-100', value: 'text-slate-900' },
    emerald: { wrap: 'border-emerald-100 bg-emerald-50/60', iconWrap: 'bg-emerald-100', value: 'text-emerald-700' },
    amber: { wrap: 'border-amber-100 bg-amber-50/60', iconWrap: 'bg-amber-100', value: 'text-amber-700' },
  };
  const t = toneMap[tone];

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${t.wrap}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconWrap}`}>
        {icon}
      </div>
      <p className={`mt-4 text-3xl font-bold tabular-nums ${t.value}`}>{displayValue}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 rounded-full bg-slate-200" />
          <div className="h-7 w-56 rounded-xl bg-slate-200" />
          <div className="h-3 w-40 rounded-full bg-slate-100" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-slate-200" />
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="h-9 w-24 rounded-lg bg-slate-200" />
            <div className="h-3 w-28 rounded-full bg-slate-100" />
            <div className="h-3 w-40 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[24px] border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-3 w-32 rounded-full bg-slate-200" />
            <div className="h-9 w-20 rounded-lg bg-slate-200" />
            <div className="h-3 w-44 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="mb-6 h-6 w-48 rounded-lg bg-slate-200" />
          <div className="h-[290px] rounded-2xl bg-slate-100" />
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <div className="mb-6 h-6 w-36 rounded-lg bg-slate-200" />
          <div className="h-[290px] rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function LivestockKpiIcon() {
  return (
    <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HealthKpiIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertKpiIcon() {
  return (
    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function InsightCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'emerald' | 'amber' | 'cyan' | 'violet';
}) {
  const toneStyles = {
    emerald: 'from-emerald-500/15 to-teal-500/10 border-emerald-100',
    amber: 'from-amber-500/15 to-orange-500/10 border-amber-100',
    cyan: 'from-cyan-500/15 to-sky-500/10 border-cyan-100',
    violet: 'from-violet-500/15 to-fuchsia-500/10 border-violet-100',
  };

  return (
    <div className={`rounded-[24px] border bg-gradient-to-br p-5 ${toneStyles[tone]}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function OverviewTile({
  title,
  value,
  helper,
  icon,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'sky' | 'slate';
}) {
  const tones = {
    emerald: 'from-emerald-50 to-teal-50',
    sky: 'from-sky-50 to-indigo-50',
    slate: 'from-slate-100 to-slate-50',
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br p-5 ${tones[tone]}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70">
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function ActivityPanel<T>({
  title,
  href,
  items,
  emptyMessage,
  renderItem,
}: {
  title: string;
  href: string;
  items: T[];
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <Link href={href} className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700">
          View all →
        </Link>
      </div>
      {items.length > 0 ? <div className="space-y-4">{items.map((item, index) => <div key={index}>{renderItem(item)}</div>)}</div> : <EmptyState message={emptyMessage} compact />}
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
  sublabel,
}: {
  href: string;
  icon: string;
  label: string;
  sublabel: string;
}) {
  const icons: Record<string, JSX.Element> = {
    livestock: <AnimalIcon />,
    health: <PulseIcon />,
    breeding: <BreedingIcon />,
    sales: <SalesIcon />,
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
        {icons[icon] || icons.livestock}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{sublabel}</p>
      </div>
      <svg className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-100 text-emerald-700',
    sick: 'bg-red-100 text-red-700',
    quarantine: 'bg-amber-100 text-amber-700',
    deceased: 'bg-slate-200 text-slate-700',
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] || styles.healthy}`}>{status}</span>;
}

function EmptyState({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div className={`text-center ${compact ? 'py-4' : 'py-8'}`}>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function isSameDay(value: Date | string, compare: Date) {
  const date = new Date(value);
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

function AnimalIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function BreedingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FeedIcon() {
  return (
    <svg className="h-5 w-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function RfidIcon({ small }: { small?: boolean }) {
  const size = small ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <svg className={`${size} text-violet-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  );
}
