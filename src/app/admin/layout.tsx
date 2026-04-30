'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { useLayoutAlerts } from '@/hooks/useLayoutAlerts';
import type { Livestock, HealthRecord } from '@/types/livestock.types';

function NavIcon({ src, size = 18, opacity = 1 }: { src: string; size?: number; opacity?: number }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ filter: 'brightness(0) invert(1)', opacity, flexShrink: 0 }}
    />
  );
}

// New navigation structure with groups
const navigation = [
  { name: 'Dashboard', href: '/admin', iconSrc: '/icon/dashboard.png', type: 'single' },
  {
    name: 'Livestock Management',
    iconSrc: '/icon/livestockmanagement.png',
    type: 'group',
    children: [
      { name: 'Livestock Registry', href: '/admin/livestock', iconSrc: '/icon/livestockregistry.png' },
      { name: 'Health Records',     href: '/admin/health',     iconSrc: '/icon/healthrecords.png' },
      { name: 'Disease Detection',  href: '/admin/disease-detection', iconSrc: '/icon/healthrecords.png' },
      { name: 'Vaccination',        href: '/admin/vaccination', iconSrc: '/icon/vaccination.png' },
      { name: 'Breeding',           href: '/admin/breeding',   iconSrc: '/icon/breeding.png' },
      { name: 'Feeding',            href: '/admin/feeding',    iconSrc: '/icon/feeding.png' },
      { name: 'Condition Logs',     href: '/admin/condition-logs', iconSrc: '/icon/conditionlogs.png' },
    ],
  },
  { name: 'Sales',            href: '/admin/sales',  iconSrc: '/icon/sales.png', type: 'single' },
  { name: 'User Management', href: '/admin/staff', iconSrc: null, type: 'single' },
  {
    name: 'Admin Tools',
    iconSrc: null,
    type: 'group',
    children: [
      { name: 'Tools & Migration', href: '/admin/tools',            iconSrc: null },
      { name: 'IoT Wiring Arch',   href: '/admin/tools/iot-wiring', iconSrc: '/icon/conditionlogs.png' },
    ],
  },
];

// Fallback SVG icons for items without PNG assets
function StaffOrToolIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-emerald-300/80'}`;
  if (name === 'User Management') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (name === 'Admin Tools') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (name === 'Tools & Migration') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6M9 8h6M9 16h4" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}

type NotifItem = { id: string; type: 'sick' | 'checkup' | 'overdue'; title: string; subtitle: string; href: string };

function NotificationDropdown({
  notifRef, open, onToggle, unreadAlerts, livestock, upcomingCheckups,
}: {
  notifRef: React.RefObject<HTMLDivElement>;
  open: boolean;
  onToggle: () => void;
  unreadAlerts: number;
  livestock: Livestock[];
  upcomingCheckups: HealthRecord[];
}) {
  const today = new Date();
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const notifications: NotifItem[] = [
    // Sick / quarantine animals
    ...livestock
      .filter(l => l.status === 'sick' || l.status === 'quarantine')
      .map(l => ({
        id: `sick-${l.id}`,
        type: 'sick' as const,
        title: `${l.animalId} needs attention`,
        subtitle: `Status: ${l.status} — ${l.type}`,
        href: '/admin/health',
      })),
    // Overdue checkups
    ...upcomingCheckups
      .filter(r => r.nextCheckup && new Date(r.nextCheckup) < today && r.status !== 'completed')
      .map(r => ({
        id: `overdue-${r.id}`,
        type: 'overdue' as const,
        title: `Overdue checkup`,
        subtitle: `Animal ${r.livestockId} — was due ${new Date(r.nextCheckup!).toLocaleDateString('en-MY')}`,
        href: '/admin/health',
      })),
    // Upcoming checkups within 7 days
    ...upcomingCheckups
      .filter(r => r.nextCheckup && new Date(r.nextCheckup) >= today && new Date(r.nextCheckup) <= in7Days && r.status !== 'completed')
      .map(r => ({
        id: `upcoming-${r.id}`,
        type: 'checkup' as const,
        title: `Checkup due soon`,
        subtitle: `Animal ${r.livestockId} — ${new Date(r.nextCheckup!).toLocaleDateString('en-MY')}`,
        href: '/admin/health',
      })),
  ];

  const typeStyle = {
    sick:    { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-600',    icon: '🩺' },
    overdue: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-600', icon: '⚠️' },
    checkup: { dot: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-600',   icon: '📅' },
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadAlerts > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadAlerts > 9 ? '9+' : unreadAlerts}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {notifications.length > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {notifications.length} new
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm font-medium text-slate-700">All clear!</p>
                <p className="text-xs text-slate-400 mt-1">No alerts right now.</p>
              </div>
            ) : (
              notifications.map(n => {
                const s = typeStyle[n.type];
                return (
                  <Link
                    key={n.id}
                    href={n.href}
                    onClick={onToggle}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm ${s.badge}`}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{n.subtitle}</p>
                    </div>
                    <div className={`mt-2 h-2 w-2 flex-shrink-0 rounded-full ${s.dot}`} />
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link href="/admin/health" onClick={onToggle} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              View all health records →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { unreadAlerts, livestock, upcomingCheckups } = useLayoutAlerts();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Livestock Management': true,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('fs-sidebar-collapsed');
    if (saved !== null) setSidebarCollapsed(saved === 'true');
  }, []);

  // Toggle group open/close
  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Check if any child in group is active
  const isGroupActive = (children: any[]) => {
    return children.some(child => pathname === child.href);
  };

  const pageMap: Record<string, { label: string; section: string }> = {
    '/admin':               { section: 'Overview',           label: 'Dashboard' },
    '/admin/livestock':     { section: 'Livestock Management', label: 'Livestock Registry' },
    '/admin/health':        { section: 'Livestock Management', label: 'Health Records' },
    '/admin/disease-detection': { section: 'Livestock Management', label: 'Disease Detection Analysis' },
    '/admin/vaccination':   { section: 'Livestock Management', label: 'Vaccination Tracker' },
    '/admin/breeding':      { section: 'Livestock Management', label: 'Breeding Records' },
    '/admin/feeding':       { section: 'Livestock Management', label: 'Feeding Schedule' },
    '/admin/condition-logs':{ section: 'Livestock Management', label: 'Condition Logs' },
    '/admin/sales':         { section: 'Finance',            label: 'Sales' },
    '/admin/staff':         { section: 'Settings',           label: 'User Management' },
    '/admin/tools':             { section: 'Settings', label: 'Tools & Migration' },
    '/admin/tools/iot-wiring':  { section: 'Admin Tools', label: 'IoT Wiring Architecture' },
    '/admin/profile':           { section: 'Settings', label: 'Profile & Security' },
  };
  const currentPage = pageMap[pathname] ?? { section: 'Admin', label: 'FarmSense' };

  useEffect(() => {
    document.title = `${currentPage.label} | FarmSense`;
  }, [currentPage.label]);

  // TEMPORARY: Development mode - bypass auth for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const bypassAuth = isDevelopment && pathname.startsWith('/admin');

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!loading && !isLoginPage && !bypassAuth) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [user, loading, isLoginPage, router, bypassAuth]);

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (loading && !bypassAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (unless in development bypass mode)
  if (!bypassAuth && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 transition-[width,transform] duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          ${sidebarCollapsed ? 'md:w-[72px]' : 'w-72'}`}
        style={{ background: 'linear-gradient(180deg, #052e16 0%, #064e3b 60%, #065f46 100%)' }}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 70%)' }} />

        {/* Collapse/expand toggle */}
        <button
          onClick={() => setSidebarCollapsed(v => {
            const next = !v;
            localStorage.setItem('fs-sidebar-collapsed', String(next));
            return next;
          })}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 w-7 h-7 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-400 text-white shadow-xl border-2 border-emerald-900/40 transition-all hover:scale-110"
        >
          <svg className="w-3.5 h-3.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarCollapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            }
          </svg>
        </button>

        <div className="relative flex flex-col h-full">

          {/* Logo */}
          <div className={`pt-5 pb-4 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-center px-4'}`}>
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-lg transition-all">
                <img src="/farmsenselogo.png" alt="FarmSense" className="w-full h-full object-contain p-1" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <p className="text-[16px] font-extrabold leading-tight tracking-tight drop-shadow-sm">
                    <span className="text-white">Farm</span>
                    <span className="text-emerald-300">Sense</span>
                  </p>
                  <p className="text-[10px] text-emerald-300/70 font-semibold tracking-[0.15em] uppercase mt-0.5">Admin Panel</p>
                </div>
              )}
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-emerald-700/50 to-transparent mb-3" />

          {/* Navigation */}
          <nav className={`flex-1 space-y-0.5 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-emerald-800/60 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {navigation.map((item) => {

              if (item.type === 'single') {
                const isActive = pathname === item.href;
                return (
                  <div key={item.name} className="relative group/tooltip">
                    <Link
                      href={item.href!}
                      className={`relative flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {isActive && (
                        <span className={`absolute bg-emerald-400 rounded-full ${sidebarCollapsed ? 'left-1 top-1/2 -translate-y-1/2 w-[3px] h-5' : 'left-0 top-1/2 -translate-y-1/2 w-[3px] h-5'}`} />
                      )}
                      {item.iconSrc ? (
                        <NavIcon src={item.iconSrc} size={17} opacity={isActive ? 1 : 0.75} />
                      ) : (
                        <StaffOrToolIcon name={item.name} active={isActive} />
                      )}
                      {!sidebarCollapsed && <span className="flex-1 tracking-[-0.01em]">{item.name}</span>}
                      {isActive && !sidebarCollapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </Link>
                    {/* Styled tooltip for collapsed mode */}
                    {sidebarCollapsed && (
                      <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150">
                        {item.name}
                        <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95" />
                      </div>
                    )}
                  </div>
                );
              }

              if (item.type === 'group' && item.children) {
                const isOpen = openGroups[item.name];
                const groupActive = isGroupActive(item.children);

                if (sidebarCollapsed) {
                  return (
                    <div key={item.name} className="space-y-0.5 pt-1">
                      <div className="mx-2 h-px bg-emerald-700/30 mb-1" />
                      {item.children.map((child) => {
                        const isActive = pathname === child.href;
                        return (
                          <div key={child.name} className="relative group/tooltip">
                            <Link
                              href={child.href}
                              className={`relative flex items-center justify-center px-2 py-2.5 rounded-xl transition-all duration-150 ${
                                isActive
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/70 hover:text-white hover:bg-white/8'
                              }`}
                            >
                              {isActive && (
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-emerald-400" />
                              )}
                              {child.iconSrc && (
                                <NavIcon src={child.iconSrc} size={16} opacity={isActive ? 1 : 0.75} />
                              )}
                            </Link>
                            <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150">
                              {child.name}
                              <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div key={item.name} className="pt-2">
                    {/* Section label */}
                    <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400/50 select-none">
                      {item.name}
                    </p>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                        groupActive || isOpen
                          ? 'text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {item.iconSrc && <NavIcon src={item.iconSrc} size={16} opacity={groupActive ? 1 : 0.7} />}
                      <span className="flex-1 text-left tracking-[-0.01em]">{item.name}</span>
                      <svg
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 text-white/50 ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="mt-0.5 ml-3 pl-3 border-l border-emerald-700/30 space-y-0.5 mb-1">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12.5px] transition-all duration-150 ${
                                isActive
                                  ? 'text-white font-semibold bg-white/10'
                                  : 'text-white/65 hover:text-white hover:bg-white/8 font-medium'
                              }`}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-full bg-emerald-400" />
                              )}
                              {child.iconSrc && (
                                <NavIcon src={child.iconSrc} size={14} opacity={isActive ? 1 : 0.65} />
                              )}
                              <span className="flex-1 tracking-[-0.01em]">{child.name}</span>
                              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </nav>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-emerald-700/40 to-transparent" />

          {/* Bottom — user info + sign out */}
          <div className={`py-3 space-y-1 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            {sidebarCollapsed ? (
              <div className="relative group/tooltip flex justify-center mb-1">
                <Link href="/admin/profile" className="relative block">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-xl object-cover ring-2 ring-white/10 hover:ring-emerald-400/60 transition-all" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-emerald-400/60 transition-all">
                      {user?.displayName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-900" />
                </Link>
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-lg bg-gray-900/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150">
                  {user?.displayName || 'Admin'} · Profile
                  <span className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900/95" />
                </div>
              </div>
            ) : (
              <Link href="/admin/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 border border-white/8 hover:border-emerald-400/25 mb-1 transition-all group">
                <div className="relative shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-sm font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{user?.displayName || 'Admin'}</p>
                  <p className="text-[10.5px] text-emerald-400/70 truncate">Farm Manager · Online</p>
                </div>
                <svg className="w-3 h-3 text-white/30 group-hover:text-emerald-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            <button
              onClick={handleLogout}
              title={sidebarCollapsed ? 'Sign Out' : undefined}
              className={`w-full flex items-center rounded-xl text-[12.5px] font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 ${
                sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {!sidebarCollapsed && 'Sign Out'}
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-[padding-left] duration-300 ease-in-out ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-72'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 h-[56px]">
            {/* Left — hamburger (mobile) + page title */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Open menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-400 font-medium">{currentPage.section}</span>
                <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-800 font-semibold">{currentPage.label}</span>
              </div>
            </div>
            {/* Right — notifications */}
            <div className="flex items-center gap-4">
              <NotificationDropdown
                notifRef={notifRef}
                open={notifOpen}
                onToggle={() => setNotifOpen(v => !v)}
                unreadAlerts={unreadAlerts}
                livestock={livestock}
                upcomingCheckups={upcomingCheckups}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
