'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LivestockChatBot from '@/components/buyer/LivestockChatBot';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    document.title = 'Marketplace | FarmSense';
  }, []);

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'buyer') {
        router.push('/login');
      }
    }
  }, [user, loading, isLoginPage, router]);

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || user.role !== 'buyer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const closeMenus = () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const profileInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'B';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/buyer" className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/farmsenselogo.png" 
                    alt="FarmSense Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    FarmSense
                  </span>
                  <span className="hidden sm:block text-xs text-gray-500">Marketplace</span>
                </div>
              </Link>
            </div>

            <div className="hidden md:block" />

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Saved */}
              <Link
                href="/buyer/saved"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Saved
              </Link>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200 sm:gap-3 sm:px-3"
                  aria-expanded={profileMenuOpen}
                  aria-label="Open buyer profile menu"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-9 w-9 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-sm font-semibold text-white">
                      {profileInitial}
                    </div>
                  )}
                  <span className="hidden max-w-[140px] truncate sm:inline">{user?.displayName || 'Buyer'}</span>
                  <svg className={`h-4 w-4 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="h-11 w-11 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 font-bold text-white">
                          {profileInitial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{user?.displayName || 'Buyer'}</p>
                        <p className="truncate text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/buyer/profile"
                        onClick={closeMenus}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-cyan-50 hover:text-cyan-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.071-6.071a2 2 0 112.828 2.828L11.828 13.828A2 2 0 0110 14H8v-2a2 2 0 01.586-1.414z" />
                        </svg>
                        Update Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-2">
                <Link href="/buyer" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Marketplace</Link>
                <Link href="/buyer/profile" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Update Profile</Link>
                <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Admin Portal</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* AI Chatbot */}
      <LivestockChatBot />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/farmsenselogo.png" 
                    alt="FarmSense Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-gray-900">FarmSense</span>
              </div>
              <p className="text-gray-600 text-sm max-w-md">
                Your trusted marketplace for premium, health-verified livestock. All animals come with 
                complete documentation and traceable origins.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/buyer" className="text-gray-600 hover:text-cyan-600 transition-colors">Browse Livestock</Link></li>
                <li><Link href="/admin" className="text-gray-600 hover:text-cyan-600 transition-colors">Admin Portal</Link></li>
                <li><Link href="/" className="text-gray-600 hover:text-cyan-600 transition-colors">Home</Link></li>
              </ul>
            </div>

            {/* Trust Badges */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Our Promise</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-emerald-500">✓</span> Health Verified
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-emerald-500">✓</span> Full Documentation
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-emerald-500">✓</span> Traceable Origin
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Livestock Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
