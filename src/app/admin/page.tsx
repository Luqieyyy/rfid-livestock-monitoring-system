'use client';

import { useEffect, useState } from 'react';
import { dashboardService, healthRecordService } from '@/services/firestore.service';
import type { DashboardStats, Livestock, HealthRecord } from '@/types/livestock.types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLivestock, setRecentLivestock] = useState<Livestock[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch all data in parallel - but avoid duplicate livestock fetch
      const [statsData, checkups] = await Promise.all([
        dashboardService.getStatsWithLivestock(),
        healthRecordService.getUpcomingCheckups(),
      ]);
      setStats(statsData.stats);
      setRecentLivestock(statsData.recentLivestock);
      setUpcomingCheckups(checkups);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back! 👋</h2>
            <p className="text-emerald-100">Here&apos;s what&apos;s happening with your farm today.</p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-sm text-emerald-100">Total Animals</p>
              <p className="text-3xl font-bold">{stats?.totalLivestock || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Healthy"
          value={stats?.healthyCount || 0}
          icon={<CheckCircleIcon />}
          color="emerald"
          trend={stats?.healthyCount ? `${Math.round((stats.healthyCount / (stats.totalLivestock || 1)) * 100)}%` : '0%'}
        />
        <StatCard
          title="Under Treatment"
          value={stats?.sickCount || 0}
          icon={<HeartIcon />}
          color="amber"
          alert={stats?.sickCount ? stats.sickCount > 0 : false}
        />
        <StatCard
          title="Active Breeding"
          value={stats?.activeBreedingCount || 0}
          icon={<FlaskIcon />}
          color="cyan"
        />
        <StatCard
          title="Pending Sales"
          value={stats?.pendingSalesCount || 0}
          icon={<ShoppingIcon />}
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
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">${(stats?.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(stats?.averageWeight || 0).toFixed(1)} kg</p>
              <p className="text-sm text-gray-600 mt-1">Avg. Weight</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
            <QuickActionButton href="/admin/livestock" icon="🐄" label="Add Livestock" />
            <QuickActionButton href="/admin/health" icon="💊" label="Record Health" />
            <QuickActionButton href="/admin/breeding" icon="🧬" label="New Breeding" />
            <QuickActionButton href="/admin/sales" icon="💰" label="Record Sale" />
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
                      <span className="text-xl">
                        {animal.type === 'cattle' ? '🐄' : animal.type === 'goat' ? '🐐' : animal.type === 'sheep' ? '🐑' : '🐔'}
                      </span>
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
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color].split(' ')[1]}`}>
          <div className={`bg-gradient-to-br ${colors[color].split(' ').slice(0, 2).join(' ')} text-white p-2.5 rounded-lg`}>
            {icon}
          </div>
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
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
      <span className="text-xl">{icon}</span>
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
