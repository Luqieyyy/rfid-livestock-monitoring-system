'use client';

import Link from 'next/link';
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
import { useIoTRealtime } from '@/hooks/useIoTRealtime';
import type { KandangData } from '@/hooks/useIoTRealtime';
import type { Livestock, HealthRecord, FeedingActivity } from '@/types/livestock.types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const HEALTH_COLORS = ['#059669', '#d97706', '#ea580c', '#64748b'];

const card =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_4px_16px_rgba(15,23,42,0.04)]';

// ─── Main dashboard ───────────────────────────────────────────────────────────
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

  if (loading) return <DashboardSkeleton />;

  const totalLivestock = stats?.totalLivestock || 0;
  const healthyRate = totalLivestock
    ? Math.round(((stats?.healthyCount || 0) / totalLivestock) * 100)
    : 0;

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

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Farm Analytics Dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Ringkasan Operasi Ladang</h1>
          {lastUpdated && (
            <p className="mt-0.5 text-xs text-slate-400">
              Dikemaskini{' '}
              {lastUpdated.toLocaleTimeString('en-MY', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </p>
          )}
        </div>
        <Link
          href="/admin/health"
          className="flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-colors"
        >
          <PulseIcon className="h-3.5 w-3.5 text-rose-500" />
          Review health queue
        </Link>
      </div>

      {/* ── SECTION 1: Sales Analytics ─────────────────────────────── */}
      <OverviewKpiStrip
        totalLivestock={totalLivestock}
        healthyRate={healthyRate}
        sickCount={stats?.sickCount || 0}
        checkupsCount={upcomingCheckups.length}
        totalRevenue={stats?.totalRevenue || 0}
      />

      <section>
        <SectionLabel>Sales Analytics</SectionLabel>
        <SalesAnalyticsSection
          totalRevenue={stats?.totalRevenue || 0}
          totalLivestock={totalLivestock}
          healthyCount={stats?.healthyCount || 0}
          sickCount={stats?.sickCount || 0}
        />
      </section>

      {/* ── SECTION 2: Livestock Health ────────────────────────────── */}
      <section>
        <SectionLabel>Livestock Health</SectionLabel>

        {/* Charts row */}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          {/* Operational bar */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Operational Breakdown</p>
              <span className="text-[11px] text-slate-400">Live</span>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationsData} barSize={28}>
                  <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} width={24} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.05)' }}
                    contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 2, 2]}>
                    {operationsData.map((entry, index) => (
                      <Cell key={entry.name} fill={['#059669', '#d97706', '#06b6d4', '#7c3aed', '#475569'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Health donut */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-slate-800">Health Distribution</p>
            <div className="h-[150px]">
              {healthDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {healthDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={HEALTH_COLORS[index % HEALTH_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No data yet" compact />
              )}
            </div>
            <div className="mt-3 divide-y divide-slate-50">
              {healthDistribution.map((item, index) => {
                const total = healthDistribution.reduce((s, i) => s + i.value, 0);
                return (
                  <div key={item.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: HEALTH_COLORS[index % HEALTH_COLORS.length] }} />
                      <span className="text-xs text-slate-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">
                        {Math.round((item.value / total) * 100)}%
                      </span>
                      <span className="w-5 text-right text-xs font-semibold tabular-nums text-slate-800">
                        {item.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: IoT Monitoring ──────────────────────────────── */}
      <section>
        <SectionLabel>IoT Monitoring</SectionLabel>
        <IoTMonitorSection />
      </section>

      {/* ── Activity + Quick actions ───────────────────────────────── */}
      <section>
        <SectionLabel>Activity</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.75fr]">
          <ActivityPanel
            title="Recent livestock"
            href="/admin/livestock"
            items={recentLivestock}
            emptyMessage="No livestock data yet"
            renderItem={(animal: Livestock) => (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <AnimalIcon className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{animal.animalId || animal.id}</p>
                    <p className="text-xs capitalize text-slate-400">{animal.breed} · {animal.type}</p>
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
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FeedIcon className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{feeding.livestockAnimalId || feeding.livestockId}</p>
                    <p className="text-xs text-slate-400">{feeding.feedType} · {feeding.quantity} {feeding.unit}</p>
                  </div>
                </div>
                <p className="text-xs tabular-nums text-slate-500">
                  {new Date(feeding.fedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
          />

          <ActivityPanel
            title="Upcoming checkups"
            href="/admin/health"
            items={upcomingCheckups}
            emptyMessage="No upcoming checkups"
            renderItem={(checkup: HealthRecord) => (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {livestock.find((l) => l.id === checkup.livestockId)?.animalId ?? checkup.livestockId}
                    </p>
                    <p className="text-xs capitalize text-slate-400">{checkup.type}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {checkup.nextCheckup ? new Date(checkup.nextCheckup).toLocaleDateString('en-MY') : 'N/A'}
                </p>
              </div>
            )}
          />

          {/* Quick actions */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-800">Quick Actions</p>
            <div className="space-y-1.5">
              <QuickActionButton href="/admin/livestock" icon="livestock" label="Add Livestock" sublabel="Register new animal" accentColor="emerald" />
              <QuickActionButton href="/admin/health" icon="health" label="Record Health" sublabel="Treatment or vaccination" accentColor="rose" />
              <QuickActionButton href="/admin/breeding" icon="breeding" label="New Breeding" sublabel="Mating plan & delivery" accentColor="violet" />
              <QuickActionButton href="/admin/sales" icon="sales" label="Record Sale" sublabel="Buyer & payment details" accentColor="sky" />
            </div>
          </div>
        </div>
      </section>

      {/* ── RFID Live Activity ─────────────────────────────────────── */}
      {rfidActivity.length > 0 && (
        <section>
          <SectionLabel>RFID Scan Activity</SectionLabel>
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-3">
              {rfidActivity.slice(0, 6).map((scan) => (
                <div key={scan.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <RfidIcon className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{scan.name || scan.animalId}</p>
                    <p className="text-xs capitalize text-slate-400">{scan.type} · {scan.breed || 'Unknown'}</p>
                    <p className="font-mono text-[10px] text-violet-500">{scan.rfid}</p>
                  </div>
                  <p className="shrink-0 text-xs tabular-nums text-slate-400">
                    {scan.scannedAt.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Health alert ───────────────────────────────────────────── */}
      {stats && stats.sickCount > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <AlertIcon className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">{stats.sickCount} haiwan</span> sedang dalam rawatan. Semak rekod health.
            </p>
          </div>
          <Link href="/admin/health" className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
            View →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section primitives
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{children}</h2>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function OverviewKpiStrip({
  totalLivestock,
  healthyRate,
  sickCount,
  checkupsCount,
  totalRevenue,
}: {
  totalLivestock: number;
  healthyRate: number;
  sickCount: number;
  checkupsCount: number;
  totalRevenue: number;
}) {
  return (
    <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-5">
      <OverviewKpiCell
        label="Total Animals"
        value={totalLivestock.toLocaleString('en-MY')}
        helper="Tracked livestock"
        icon={<AnimalIcon className="h-4 w-4" />}
      />
      <OverviewKpiCell
        label="Healthy Rate"
        value={`${healthyRate}%`}
        helper="Current herd condition"
        tone="emerald"
        icon={<PulseIcon className="h-4 w-4" />}
      />
      <OverviewKpiCell
        label="Under Treatment"
        value={sickCount.toLocaleString('en-MY')}
        helper="Needs follow-up"
        tone={sickCount > 0 ? 'amber' : 'slate'}
        icon={<AlertIcon className="h-4 w-4" />}
      />
      <OverviewKpiCell
        label="Pending Checkups"
        value={checkupsCount.toLocaleString('en-MY')}
        helper="Scheduled reviews"
        icon={<CalendarIcon className="h-4 w-4" />}
      />
      <OverviewKpiCell
        label="Revenue"
        value={`MYR ${totalRevenue.toLocaleString('en-MY')}`}
        helper="Completed payments"
        tone="emerald"
        icon={<SalesIcon className="h-4 w-4" />}
      />
    </div>
  );
}

function OverviewKpiCell({
  label,
  value,
  helper,
  icon,
  tone = 'slate',
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber';
}) {
  const toneClass = {
    slate: { icon: 'bg-slate-100 text-slate-500', value: 'text-slate-900' },
    emerald: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
    amber: { icon: 'bg-amber-50 text-amber-600', value: 'text-amber-600' },
  }[tone];

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:odd:border-r xl:border-b-0 xl:border-r xl:last:border-r-0">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClass.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className={`mt-0.5 truncate text-lg font-semibold tabular-nums ${toneClass.value}`}>{value}</p>
        <p className="truncate text-[11px] text-slate-400">{helper}</p>
      </div>
    </div>
  );
}

function StatCell({
  label, value, sub, tone,
}: {
  label: string; value: string; sub?: string; tone?: 'emerald' | 'amber';
}) {
  const valueColor = tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-800';
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] text-slate-400">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <p className={`text-xl font-semibold tabular-nums ${valueColor}`}>{value}</p>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IoT Smart Farm Monitor
// ─────────────────────────────────────────────────────────────────────────────

type SensorReading = {
  temp: number;
  humidity: number;
  nh3: number;
  feedLevel: number;
  weight: number;
  lastSeen: Date;
  online: boolean;
};

type AlertLevel = 'normal' | 'warning' | 'critical';

function getSensorAlert(reading: SensorReading): { level: AlertLevel; messages: string[] } {
  const msgs: string[] = [];
  let level: AlertLevel = 'normal';

  if (reading.temp > 35) {
    msgs.push(`Suhu terlalu tinggi (${reading.temp}°C)`);
    level = 'critical';
  } else if (reading.temp > 32) {
    msgs.push(`Suhu melebihi had selesa (${reading.temp}°C)`);
    if (level === 'normal') level = 'warning';
  }

  if (reading.humidity > 85) {
    msgs.push(`Kelembapan tinggi (${reading.humidity}%)`);
    if (level !== 'critical') level = 'warning';
  }

  if (reading.nh3 > 35) {
    msgs.push(`NH₃ bahaya (${reading.nh3} ppm) — perlu ventilasi segera`);
    level = 'critical';
  } else if (reading.nh3 > 20) {
    msgs.push(`NH₃ tinggi (${reading.nh3} ppm) — kandang perlu dibersihkan`);
    if (level === 'normal') level = 'warning';
  }

  if (reading.feedLevel < 15) {
    msgs.push(`Feed hampir habis (${reading.feedLevel}%)`);
    if (level === 'normal') level = 'warning';
  }

  return { level, messages: msgs };
}

type HistoryPoint = {
  time: string;
  tempA: number; tempB: number;
  humA: number; humB: number;
  nh3A: number; nh3B: number;
};

const HISTORY_MAX = 20;

// Map raw ADC (0–4095) to a ppm-like scale that aligns with existing alert thresholds:
// ADC <1000 (~GOOD) → <12.5 ppm (below warning at 20), ADC 1000–2000 (~MOD) → 12.5–25 (above 20),
// ADC 2000–3000 (~POOR) → 25–37.5 (above 20, near critical at 35), ADC >3000 (~DNGR) → >37.5
function airRawToPpm(airRaw: number): number {
  return +((airRaw / 80)).toFixed(1);
}

function kandangToSensorReading(data: KandangData, online: boolean): SensorReading {
  return {
    temp:      data.temperature,
    humidity:  data.humidity,
    nh3:       airRawToPpm(data.airRaw),
    feedLevel: 50,   // placeholder — no feed sensor yet
    weight:    0,    // placeholder — weigh lane not connected to RTDB yet
    lastSeen:  new Date(data.updatedAt || Date.now()),
    online,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildSensorComparison(sensors: Record<string, SensorReading>) {
  const kandangA = sensors['Kandang 1'];
  const kandangB = sensors['Kandang 2'] ?? kandangA; // fall back to K1 data if K2 not ready yet

  return [
    {
      metric: 'Temp',
      kandangA: clampScore(((kandangA.temp - 20) / 20) * 100),
      kandangB: clampScore(((kandangB.temp - 20) / 20) * 100),
      rawA: `${kandangA.temp}C`,
      rawB: `${kandangB.temp}C`,
    },
    {
      metric: 'Humidity',
      kandangA: clampScore(kandangA.humidity),
      kandangB: clampScore(kandangB.humidity),
      rawA: `${kandangA.humidity}%`,
      rawB: `${kandangB.humidity}%`,
    },
    {
      metric: 'NH3',
      kandangA: clampScore((kandangA.nh3 / 40) * 100),
      kandangB: clampScore((kandangB.nh3 / 40) * 100),
      rawA: `${kandangA.nh3} ppm`,
      rawB: `${kandangB.nh3} ppm`,
    },
    {
      metric: 'Feed',
      kandangA: clampScore(kandangA.feedLevel),
      kandangB: clampScore(kandangB.feedLevel),
      rawA: `${kandangA.feedLevel}%`,
      rawB: `${kandangB.feedLevel}%`,
    },
  ];
}

function IoTMonitorSection() {
  const iot = useIoTRealtime();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [activeMetric, setActiveMetric] = useState<'temp' | 'humidity' | 'nh3'>('temp');
  const [alertOpen, setAlertOpen] = useState(true);

  // Build sensors map from real RTDB data
  const sensors: Record<string, SensorReading> = {};
  if (iot.kandang1) sensors['Kandang 1'] = kandangToSensorReading(iot.kandang1, iot.mainController.active);
  if (iot.kandang2) sensors['Kandang 2'] = kandangToSensorReading(iot.kandang2, iot.mainController.active);

  // Append a history point whenever RTDB data updates
  useEffect(() => {
    if (!iot.kandang1 && !iot.kandang2) return;
    const timeStr = new Date().toLocaleTimeString('en-MY', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const k1 = iot.kandang1;
    const k2 = iot.kandang2;
    const entry: HistoryPoint = {
      time: timeStr,
      tempA: k1 ? k1.temperature : 0,
      tempB: k2 ? k2.temperature : 0,
      humA:  k1 ? k1.humidity    : 0,
      humB:  k2 ? k2.humidity    : 0,
      nh3A:  k1 ? airRawToPpm(k1.airRaw) : 0,
      nh3B:  k2 ? airRawToPpm(k2.airRaw) : 0,
    };
    setHistory((h) => {
      const updated = [...h, entry];
      return updated.length > HISTORY_MAX ? updated.slice(-HISTORY_MAX) : updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iot.kandang1?.updatedAt, iot.kandang2?.updatedAt]);

  // Show waiting state until first RTDB data arrives
  if (Object.keys(sensors).length === 0) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-10 text-sm text-slate-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-300" />
        Waiting for IoT data from ESP32...
      </div>
    );
  }

  const allAlerts = Object.entries(sensors).flatMap(([name, s]) =>
    getSensorAlert(s).messages.map((m) => ({
      kandang: name,
      msg: m,
      level: getSensorAlert(s).level,
    }))
  );
  const criticalAlerts = allAlerts.filter((a) => a.level === 'critical');
  const warningAlerts  = allAlerts.filter((a) => a.level === 'warning');
  const criticalCount  = criticalAlerts.length;
  const warningCount   = warningAlerts.length;
  const sensorComparison = buildSensorComparison(sensors);

  const metricLabels = { temp: 'Suhu °C', humidity: 'Humidity %', nh3: 'NH₃ ppm' } as const;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <IoTIcon className="h-3.5 w-3.5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">IoT Smart Farm Monitor</p>
            <p className="text-[11px] text-slate-400">DHT22 · MQ-137 NH₃ · Smart Feed · Weigh Lane</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DeviceStatusBadge label="ESP32 Main" active={iot.mainController.active} />
          <DeviceStatusBadge label="Feeder"     active={iot.feeder.active} />
          {criticalCount > 0 && (
            <button
              onClick={() => setAlertOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {criticalCount} Critical
            </button>
          )}
          {warningCount > 0 && (
            <button
              onClick={() => setAlertOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {warningCount} Warning
            </button>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All Normal
            </span>
          )}
        </div>
      </div>

      {/* Alert panel */}
      {allAlerts.length > 0 && alertOpen && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-slate-700">
              {criticalCount > 0 ? 'Active Alerts — Action Required' : 'Active Warnings'}
            </p>
            <button onClick={() => setAlertOpen(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid divide-y divide-slate-50 md:grid-cols-2 md:divide-x md:divide-y-0">
            {[...criticalAlerts, ...warningAlerts].map((a, i) => (
              <div key={i} className={`flex items-center gap-2.5 border-b border-slate-50 px-4 py-2.5 last:border-b-0 md:last:border-b ${a.level === 'critical' ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-amber-400'}`}>
                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide ${a.level === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                  {a.level}
                </span>
                <span className="text-slate-400">·</span>
                <span className="min-w-0 truncate text-xs text-slate-700">
                  <span className="font-medium">{a.kandang}</span> — {a.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-enclosure comparison */}
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Kandang Comparison</p>
            <p className="text-[11px] text-slate-400">Latest readings from both enclosures</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Kandang 1
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Kandang 2
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {sensorComparison.map((item) => (
            <ComparisonMetricRow key={item.metric} item={item} />
          ))}
        </div>
      </div>

      {/* Sensor cards grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(sensors).map(([name, s]) => {
          const { level } = getSensorAlert(s);
          return <SensorCard key={name} name={name} reading={s} level={level} />;
        })}
      </div>

      {/* Sensor trend chart */}
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Sensor Trend</p>
            <p className="text-[11px] text-slate-400">Live · 4s interval · all enclosures</p>
          </div>
          <div className="flex overflow-hidden rounded border border-slate-200">
            {(['temp', 'humidity', 'nh3'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1.5 text-[11px] font-medium transition-colors border-r border-slate-200 last:border-0 ${
                  activeMetric === m
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(sensors).flatMap(([name, s]) => [
            <SensorSummaryPill key={`${name}-temp`} label={`${name} temp`} value={`${s.temp}C`} level={s.temp > 32 ? 'warning' : 'normal'} />,
            <SensorSummaryPill key={`${name}-nh3`} label={`${name} NH3`} value={`${s.nh3} ppm`} level={s.nh3 > 20 ? 'warning' : 'normal'} />,
          ])}
        </div>
        <div className="h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
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
                contentStyle={{
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                }}
              />
              <Legend
                iconType="plainline"
                iconSize={14}
                wrapperStyle={{ fontSize: 11, paddingTop: 10, color: '#64748b' }}
              />
              {activeMetric === 'temp' && (
                <>
                  <Line type="monotone" dataKey="tempA" name="Kandang 1" stroke="#059669" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="tempB" name="Kandang 2" stroke="#d97706" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </>
              )}
              {activeMetric === 'humidity' && (
                <>
                  <Line type="monotone" dataKey="humA" name="Kandang 1" stroke="#059669" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="humB" name="Kandang 2" stroke="#d97706" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </>
              )}
              {activeMetric === 'nh3' && (
                <>
                  <Line type="monotone" dataKey="nh3A" name="Kandang 1" stroke="#059669" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="nh3B" name="Kandang 2" stroke="#d97706" strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

// ─── Sensor card ──────────────────────────────────────────────────────────────
function SensorSummaryPill({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level: 'normal' | 'warning';
}) {
  const style =
    level === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`flex items-center justify-between rounded border px-3 py-2 ${style}`}>
      <span className="truncate text-[11px] font-medium text-slate-500">{label}</span>
      <span className="shrink-0 text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function ComparisonMetricRow({
  item,
}: {
  item: ReturnType<typeof buildSensorComparison>[number];
}) {
  return (
    <div className="grid gap-3 px-4 py-3 lg:grid-cols-[120px_1fr_1fr] lg:items-center">
      <div>
        <p className="text-xs font-semibold text-slate-700">{item.metric}</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">Normalized</p>
      </div>
      <ComparisonBar
        label="Kandang 1"
        value={item.rawA}
        score={item.kandangA}
        color="emerald"
      />
      <ComparisonBar
        label="Kandang 2"
        value={item.rawB}
        score={item.kandangB}
        color="amber"
      />
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  score,
  color,
}: {
  label: string;
  value: string;
  score: number;
  color: 'emerald' | 'amber';
}) {
  const barColor = color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600';
  const dotColor = color === 'emerald' ? 'bg-emerald-600' : 'bg-amber-600';

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-slate-800">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SensorCard({
  name,
  reading: s,
  level,
}: {
  name: string;
  reading: SensorReading;
  level: AlertLevel;
}) {
  const accentMap = {
    normal:   'border-l-emerald-500',
    warning:  'border-l-amber-400',
    critical: 'border-l-red-500',
  };
  const tempColor = s.temp > 35 ? 'text-red-600' : s.temp > 32 ? 'text-amber-600' : 'text-slate-800';
  const humColor  = s.humidity > 85 ? 'text-amber-600' : 'text-slate-800';
  const nh3Color  = s.nh3 > 35 ? 'text-red-600' : s.nh3 > 20 ? 'text-amber-600' : 'text-slate-800';
  const feedColor = s.feedLevel < 15 ? 'text-red-600' : s.feedLevel < 30 ? 'text-amber-600' : 'text-slate-800';

  const statusText = { normal: 'Normal', warning: 'Warning', critical: 'Critical' };
  const statusColor = {
    normal:   'text-emerald-600',
    warning:  'text-amber-600',
    critical: 'text-red-600',
  };

  return (
    <div className={`rounded-lg border border-slate-200 border-l-2 bg-white shadow-sm ${accentMap[level]}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${s.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="text-sm font-semibold text-slate-800">{name}</span>
        </div>
        <span className={`text-[11px] font-medium ${statusColor[level]}`}>
          {statusText[level]}
        </span>
      </div>

      {/* Metrics */}
      <div className="divide-y divide-slate-50">
        {/* Temp + Humidity */}
        <div className="grid grid-cols-2 divide-x divide-slate-100 px-0">
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 mb-1">Suhu</p>
            <p className={`text-lg font-semibold tabular-nums ${tempColor}`}>{s.temp}°C</p>
            <div className="mt-2 h-1 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, ((s.temp - 20) / 20) * 100)}%`,
                  backgroundColor: s.temp > 35 ? '#ef4444' : s.temp > 32 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 mb-1">Kelembapan</p>
            <p className={`text-lg font-semibold tabular-nums ${humColor}`}>{s.humidity}%</p>
            <div className="mt-2 h-1 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${s.humidity}%`,
                  backgroundColor: s.humidity > 85 ? '#f59e0b' : '#38bdf8',
                }}
              />
            </div>
          </div>
        </div>

        {/* NH₃ */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-slate-400">NH₃ Ammonia</p>
            <span className={`text-[10px] font-medium ${nh3Color}`}>
              {s.nh3 > 35 ? 'Bahaya' : s.nh3 > 20 ? 'Tinggi' : 'Selamat'}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-lg font-semibold tabular-nums ${nh3Color}`}>{s.nh3}</span>
            <span className="text-[11px] text-slate-400">ppm</span>
          </div>
          <div className="mt-2 flex h-1 gap-px">
            <div className="flex-1 bg-emerald-400 rounded-sm" />
            <div className={`flex-1 rounded-sm ${s.nh3 > 20 ? 'bg-amber-400' : 'bg-slate-200'}`} />
            <div className={`flex-1 rounded-sm ${s.nh3 > 35 ? 'bg-red-500' : 'bg-slate-200'}`} />
          </div>
          <div className="flex justify-between mt-0.5 text-[9px] text-slate-300">
            <span>0</span><span>20</span><span>35+</span>
          </div>
        </div>

        {/* Feed + Weight */}
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 mb-1">Smart Feed</p>
            <p className={`text-lg font-semibold tabular-nums ${feedColor}`}>{s.feedLevel}%</p>
            <div className="mt-2 h-1 bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${s.feedLevel}%`,
                  backgroundColor: s.feedLevel < 15 ? '#ef4444' : s.feedLevel < 30 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] text-slate-400 mb-1">Weigh Lane</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-semibold tabular-nums text-slate-800">{s.weight}</span>
              <span className="text-[11px] text-slate-400">kg avg</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-slate-50">
        <p className="text-[10px] text-slate-300 text-right">
          {s.lastSeen.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
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
  totalRevenue, totalLivestock, healthyCount, sickCount,
}: {
  totalRevenue: number; totalLivestock: number; healthyCount: number; sickCount: number;
}) {
  const [activeTab, setActiveTab] = useState<'revenue' | 'livestock'>('revenue');

  const bestMonth = MONTHLY_SALES_SEED.reduce(
    (best, m) => (m.revenue > best.revenue ? m : best),
    MONTHLY_SALES_SEED[0]
  );
  const avgRevenue = Math.round(
    MONTHLY_SALES_SEED.reduce((s, m) => s + m.revenue, 0) / MONTHLY_SALES_SEED.length
  );
  const growthPct =
    MONTHLY_SALES_SEED.length >= 2
      ? Math.round(
          ((MONTHLY_SALES_SEED.at(-1)!.revenue - MONTHLY_SALES_SEED.at(-2)!.revenue) /
            MONTHLY_SALES_SEED.at(-2)!.revenue) *
            100
        )
      : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Revenue & Livestock Trend</p>
        <div className="flex overflow-hidden rounded border border-slate-200">
          {(['revenue', 'livestock'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors border-r border-slate-200 last:border-0 ${
                activeTab === tab
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'revenue' ? 'Revenue (MYR)' : 'Livestock Count'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI mini row */}
      <div className="mb-4 grid grid-cols-2 divide-x divide-y overflow-hidden rounded border border-slate-100 sm:grid-cols-4 sm:divide-y-0">
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-slate-400">Total Revenue</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-emerald-600">MYR {totalRevenue.toLocaleString('en-MY')}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-slate-400">Avg / Month</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-slate-800">MYR {avgRevenue.toLocaleString('en-MY')}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-slate-400">Best Month</p>
          <p className="mt-1 text-base font-semibold tabular-nums text-slate-800">{bestMonth.month} · MYR {bestMonth.revenue.toLocaleString('en-MY')}</p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[11px] text-slate-400">MoM Growth</p>
          <p className={`mt-1 text-base font-semibold tabular-nums ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'revenue' ? (
            <AreaChart data={MONTHLY_SALES_SEED} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}
                formatter={(v: number) => [`MYR ${v.toLocaleString('en-MY')}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ fill: '#059669', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={MONTHLY_SALES_SEED} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="livestockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 8px 24px rgba(15,23,42,0.10)' }}
                formatter={(v: number) => [v, 'Livestock']}
              />
              <Area
                type="monotone"
                dataKey="livestock"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fill="url(#livestockGrad)"
                dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Components
// ─────────────────────────────────────────────────────────────────────────────

function DeviceStatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium
      ${active
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-red-200 bg-red-50 text-red-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`} />
      {active ? label : `${label} OFFLINE`}
    </span>
  );
}

function ActivityPanel<T>({
  title, href, items, emptyMessage, renderItem,
}: {
  title: string; href: string; items: T[]; emptyMessage: string; renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <Link href={href} className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors">
          View all →
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="divide-y divide-slate-50">
          {items.map((item, index) => (
            <div key={index}>{renderItem(item)}</div>
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} compact />
      )}
    </div>
  );
}

type AccentColor = 'emerald' | 'rose' | 'violet' | 'sky';

function QuickActionButton({
  href, icon, label, sublabel, accentColor,
}: {
  href: string; icon: string; label: string; sublabel: string; accentColor: AccentColor;
}) {
  const icons: Record<string, React.ReactNode> = {
    livestock: <AnimalIcon className="h-4 w-4" />,
    health:    <PulseIcon className="h-4 w-4" />,
    breeding:  <BreedingIcon className="h-4 w-4" />,
    sales:     <SalesIcon className="h-4 w-4" />,
  };

  const accents: Record<AccentColor, { dot: string; hover: string; iconBg: string; iconColor: string }> = {
    emerald: { dot: 'bg-emerald-500', hover: 'hover:border-emerald-200 hover:bg-emerald-50/60', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    rose:    { dot: 'bg-rose-500',    hover: 'hover:border-rose-200 hover:bg-rose-50/60',       iconBg: 'bg-rose-100',    iconColor: 'text-rose-600'    },
    violet:  { dot: 'bg-violet-500',  hover: 'hover:border-violet-200 hover:bg-violet-50/60',   iconBg: 'bg-violet-100',  iconColor: 'text-violet-600'  },
    sky:     { dot: 'bg-sky-500',     hover: 'hover:border-sky-200 hover:bg-sky-50/60',         iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'     },
  };
  const a = accents[accentColor];

  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 rounded border border-slate-200 bg-white px-3 py-2.5 transition-colors ${a.hover}`}
    >
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${a.iconBg} ${a.iconColor}`}>
        {icons[icon] || icons.livestock}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400">{sublabel}</p>
      </div>
      <svg
        className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy:   'bg-emerald-100 text-emerald-700 border-emerald-200',
    sick:      'bg-red-100 text-red-700 border-red-200',
    quarantine:'bg-amber-100 text-amber-700 border-amber-200',
    deceased:  'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status] || styles.healthy}`}
    >
      {status}
    </span>
  );
}

function LivePill({ color = 'emerald' }: { color?: 'emerald' | 'violet' }) {
  const c = {
    emerald: { wrap: 'bg-emerald-50 border-emerald-200 text-emerald-700', ping: 'bg-emerald-400', dot: 'bg-emerald-500' },
    violet:  { wrap: 'bg-violet-50 border-violet-200 text-violet-700', ping: 'bg-violet-400', dot: 'bg-violet-500' },
  }[color];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.wrap}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${c.ping}`} />
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${c.dot}`} />
      </span>
      Live
    </span>
  );
}

function EmptyState({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div className={`text-center ${compact ? 'py-6' : 'py-10'}`}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <svg className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

// ─── Dashboard skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-2.5 w-28 rounded-full bg-slate-200" />
          <div className="h-6 w-56 rounded-xl bg-slate-200" />
          <div className="h-2.5 w-36 rounded-full bg-slate-100" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-9 w-9 rounded-xl bg-slate-200" />
            <div className="mt-4 h-8 w-24 rounded-lg bg-slate-200" />
            <div className="mt-2 h-2.5 w-32 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="h-8 w-8 rounded-xl bg-slate-200" />
            <div className="mt-3 h-6 w-20 rounded-lg bg-slate-200" />
            <div className="mt-2 h-2.5 w-40 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function isSameDay(value: Date | string, compare: Date) {
  const date = new Date(value);
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

// ─── Icon Components ──────────────────────────────────────────────────────────

function IoTIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function AnimalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function PulseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function BreedingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function SalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function RfidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  );
}
