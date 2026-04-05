'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardService, healthRecordService, feedingActivityService } from '@/services/firestore.service';
import type { DashboardStats, Livestock, HealthRecord, FeedingActivity } from '@/types/livestock.types';

const HEALTH_COLORS = ['#10b981', '#f59e0b', '#f97316', '#64748b'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLivestock, setRecentLivestock] = useState<Livestock[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<FeedingActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const formatMYR = (amount: number): string => `MYR ${amount.toLocaleString('en-MY')}`;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, checkups, feedings] = await Promise.all([
        dashboardService.getStatsWithLivestock(),
        healthRecordService.getUpcomingCheckups().catch(() => []),
        feedingActivityService.getRecent(5).catch(() => []),
      ]);

      setStats(statsData.stats);
      setRecentLivestock(statsData.recentLivestock);
      setRecentFeedings(feedings);
      setUpcomingCheckups(checkups);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setStats({
        totalLivestock: 0,
        healthyCount: 0,
        sickCount: 0,
        deceasedCount: 0,
        activeBreedingCount: 0,
        pendingSalesCount: 0,
        totalRevenue: 0,
        averageWeight: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
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

  const focusItems = [
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
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 card-shadow">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Dashboard Overview</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Ringkasan operasi ladang</h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Paparan utama untuk pantau status ternakan, jualan, rawatan dan aktiviti harian tanpa elemen hero yang berat.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
              title="Refresh Data"
            >
              <RefreshIcon />
              Refresh data
            </button>
            <Link
              href="/admin/health"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <PulseIcon />
              Review health queue
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <HeroMetric label="Total livestock" value={`${totalLivestock}`} helper="Animals currently tracked" />
          <HeroMetric label="Healthy rate" value={`${healthyRate}%`} helper="Overall herd condition" />
          <HeroMetric label="Need attention" value={`${attentionRate}%`} helper="Treatment + checkup load" accent />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {focusItems.map((item) => (
          <InsightCard key={item.label} {...item} />
        ))}
      </section>

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
                  <p className="font-semibold text-slate-900">{checkup.livestockId}</p>
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

function HeroMetric({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${accent ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent ? 'text-amber-700' : 'text-slate-900'}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
    </div>
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

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
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
