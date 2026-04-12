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
      { name: 'Vaccination',        href: '/admin/vaccination', iconSrc: '/icon/vaccination.png' },
      { name: 'Breeding',           href: '/admin/breeding',   iconSrc: '/icon/breeding.png' },
      { name: 'Feeding',            href: '/admin/feeding',    iconSrc: '/icon/feeding.png' },
      { name: 'Condition Logs',     href: '/admin/condition-logs', iconSrc: '/icon/conditionlogs.png' },
    ],
  },
  { name: 'Sales',            href: '/admin/sales',  iconSrc: '/icon/sales.png', type: 'single' },
  { name: 'User Management', href: '/admin/staff',  iconSrc: null, type: 'single' },
  { name: 'Admin Tools',     href: '/admin/tools',  iconSrc: null, type: 'single' },
];

// Fallback SVG icons for items without PNG assets
function StaffOrToolIcon({ name, active }: { name: string; active: boolean }) {
  const cls = `w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-emerald-500/70'}`;
  if (name === 'User Management') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

  // Toggle group open/close
  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Check if any child in group is active
  const isGroupActive = (children: any[]) => {
    return children.some(child => pathname === child.href);
  };

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
        className={`fixed left-0 top-0 bottom-0 w-72 z-40 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: 'linear-gradient(180deg, #052e16 0%, #064e3b 60%, #065f46 100%)' }}
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(16,185,129,0.18) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col h-full">

          {/* Logo */}
          <div className="px-5 pt-6 pb-5">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/10 flex items-center justify-center shrink-0">
                <img src="/farmsenselogo.png" alt="FarmSense" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[15px] font-bold leading-tight">
                  <span className="text-white">Farm</span>
                  <span className="text-emerald-400">Sense</span>
                </p>
                <p className="text-[11px] text-emerald-400/60 font-medium tracking-wide mt-0.5">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-emerald-700/50 to-transparent mb-3" />

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-emerald-800">
            {navigation.map((item) => {

              if (item.type === 'single') {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href!}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500/20 text-white'
                        : 'text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                    style={isActive ? { boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.25)' } : {}}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />
                    )}
                    {item.iconSrc ? (
                      <NavIcon src={item.iconSrc} size={17} opacity={isActive ? 1 : 0.55} />
                    ) : (
                      <StaffOrToolIcon name={item.name} active={isActive} />
                    )}
                    <span className="flex-1">{item.name}</span>
                  </Link>
                );
              }

              if (item.type === 'group' && item.children) {
                const isOpen = openGroups[item.name];
                const groupActive = isGroupActive(item.children);

                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
                        groupActive || isOpen
                          ? 'text-white/90 bg-white/5'
                          : 'text-white/55 hover:text-white hover:bg-white/8'
                      }`}
                    >
                      {item.iconSrc && <NavIcon src={item.iconSrc} size={17} opacity={groupActive ? 0.9 : 0.55} />}
                      <span className="flex-1 text-left">{item.name}</span>
                      <svg
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 opacity-40 ${isOpen ? 'rotate-90' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="mt-0.5 ml-[22px] pl-3 border-l border-emerald-700/40 space-y-0.5 mb-1">
                        {item.children.map((child) => {
                          const isActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`group relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] transition-all duration-150 ${
                                isActive
                                  ? 'text-white bg-emerald-500/20 font-semibold'
                                  : 'text-white/45 hover:text-white hover:bg-white/8 font-medium'
                              }`}
                              style={isActive ? { boxShadow: 'inset 0 0 0 1px rgba(52,211,153,0.2)' } : {}}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-emerald-400" />
                              )}
                              {child.iconSrc && (
                                <NavIcon src={child.iconSrc} size={15} opacity={isActive ? 1 : 0.45} />
                              )}
                              <span className="flex-1">{child.name}</span>
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
          <div className="px-3 py-4 space-y-1">
            {/* User chip */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.displayName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-white/90 truncate">{user?.displayName || 'Admin'}</p>
                <p className="text-[11px] text-emerald-400/70 truncate">Farm Manager</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-white/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-150"
            >
              <svg className="w-[17px] h-[17px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <div className="md:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-4 ml-auto">
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
