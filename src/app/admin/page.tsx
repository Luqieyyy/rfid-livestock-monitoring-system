'use client';

import { useEffect, useState } from 'react';
import { dashboardService, healthRecordService, feedingActivityService } from '@/services/firestore.service';
import type { DashboardStats, Livestock, HealthRecord, FeedingActivity } from '@/types/livestock.types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLivestock, setRecentLivestock] = useState<Livestock[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<FeedingActivity[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Set empty stats to allow page to render
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

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">Welcome to FarmSense</h2>
            <p className="text-emerald-100">Monitor your livestock with intelligent insights and real-time data.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-medium transition-all flex items-center gap-2"
              title="Refresh Data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <p className="text-sm text-emerald-100">Total Animals</p>
                <p className="text-3xl font-bold">{stats?.totalLivestock || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Healthy"
          value={stats?.healthyCount || 0}
          icon={<img src="/healthy.png" alt="healthy" className="w-40 h-40   object-contain" />}
          color="emerald"
          trend={stats?.healthyCount ? `${Math.round((stats.healthyCount / (stats.totalLivestock || 1)) * 100)}%` : '0%'}
        />
        <StatCard
          title="Under Treatment"
          value={stats?.sickCount || 0}
          icon={<img src="/undertreatment.jpg" alt="treatment" className="w-40 h-40 object-contain" />}
          color="amber"
          alert={stats?.sickCount ? stats.sickCount > 0 : false}
        />
        <StatCard
          title="Active Breeding"
          value={stats?.activeBreedingCount || 0}
          icon={<img src="/breadingicon.jpg" alt="breeding" className="w-40 h-40 object-contain" />}
          color="cyan"
        />
        <StatCard
          title="Pending Sales"
          value={stats?.pendingSalesCount || 0}
          icon={<img src="/sales.png" alt="sales" className="w-40 h-40 object-contain" />}
          color="violet"
        />
      </div>

      {/* Revenue & Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Farm Overview</h3>
            <span className="text-sm text-gray-500">Current Status</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img src="/sales_myr.png" alt="revenue" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${(stats?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img src="/avg_weight.png" alt="weight" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(stats?.averageWeight || 0).toFixed(1)} kg</p>
              <p className="text-sm text-gray-600 mt-1">Avg. Weight</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 flex items-center justify-center">
                  <img src="/deceased.png" alt="deceased" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats?.deceasedCount || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Deceased</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <QuickActionButton href="/admin/livestock" icon="livestock" label="Add Livestock" />
            <QuickActionButton href="/admin/health" icon="health" label="Record Health" />
            <QuickActionButton href="/admin/breeding" icon="breeding" label="New Breeding" />
            <QuickActionButton href="/admin/sales" icon="sales" label="Record Sale" />
          </div>
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Livestock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Livestock</h3>
            <a href="/admin/livestock" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </a>
          </div>
          {recentLivestock.length > 0 ? (
            <div className="space-y-4">
              {recentLivestock.map((animal: Livestock) => (
                <div key={animal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{animal.tagId}</p>
                      <p className="text-sm text-gray-500 capitalize">{animal.breed} • {animal.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={animal.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No livestock data yet" />
          )}
        </div>

        {/* Recent Feeding Activities */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Feeding</h3>
            <a href="/admin/feeding" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </a>
          </div>
          {recentFeedings.length > 0 ? (
            <div className="space-y-4">
              {recentFeedings.map((feeding) => (
                <div key={feeding.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{feeding.livestockTagId}</p>
                      <p className="text-sm text-gray-500">{feeding.feedType} • {feeding.quantity} {feeding.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(feeding.fedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-gray-500">{feeding.farmerName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No feeding activities yet" />
          )}
        </div>

        {/* Upcoming Checkups */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Checkups</h3>
            <a href="/admin/health" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </a>
          </div>
          {upcomingCheckups.length > 0 ? (
            <div className="space-y-4">
              {upcomingCheckups.map((checkup: HealthRecord) => (
                <div key={checkup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">ID: {checkup.livestockId}</p>
                      <p className="text-sm text-gray-500 capitalize">{checkup.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {checkup.nextCheckup ? new Date(checkup.nextCheckup).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">Scheduled</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No upcoming checkups" />
          )}
        </div>
      </div>

      {/* Alert Banner */}
      {stats && stats.sickCount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 mb-1">Health Alert</h4>
              <p className="text-red-700">
                {stats.sickCount} animal{stats.sickCount > 1 ? 's are' : ' is'} currently under treatment. 
                Please review their health records for immediate action.
              </p>
            </div>
            <a href="/admin/health" className="text-sm font-medium text-red-700 hover:text-red-800 whitespace-nowrap">
              View Records →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color, trend, alert }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'emerald' | 'amber' | 'cyan' | 'violet';
  trend?: string;
  alert?: boolean;
}) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-500 bg-emerald-50',
    amber: 'from-amber-500 to-orange-500 bg-amber-50',
    cyan: 'from-cyan-500 to-blue-500 bg-cyan-50',
    violet: 'from-violet-500 to-purple-500 bg-violet-50',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 card-shadow-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 flex items-center justify-center">
          {icon}
        </div>
        {alert && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {trend && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
    </div>
  );
}

function QuickActionButton({ href, icon, label }: { href: string; icon: string; label: string }) {
  const icons: Record<string, JSX.Element> = {
    livestock: <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    health: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    breeding: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    sales: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className="text-emerald-600">{icons[icon] || icons.livestock}</div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
      <svg className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-100 text-emerald-700',
    sick: 'bg-red-100 text-red-700',
    quarantine: 'bg-amber-100 text-amber-700',
    deceased: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.healthy}`}>
      {status}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function FlaskIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function ShoppingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
