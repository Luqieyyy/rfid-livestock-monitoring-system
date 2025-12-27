'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const isLoginPage = pathname === '/login';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/buyer" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    FarmSense
                  </span>
                  <span className="hidden sm:block text-xs text-gray-500">Marketplace</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/buyer"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/buyer'
                    ? 'bg-cyan-50 text-cyan-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Browse All
              </Link>
              <Link
                href="/buyer?type=cattle"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Cattle
              </Link>
              <Link
                href="/buyer?type=goat"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Goats
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'B'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.displayName || 'Buyer'}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>

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
                <Link href="/buyer" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Browse All</Link>
                <Link href="/buyer?type=cattle" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cattle</Link>
                <Link href="/buyer?type=goat" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Goats</Link>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🐄</span>
                </div>
                <span className="text-xl font-bold text-gray-900">FarmStock</span>
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
