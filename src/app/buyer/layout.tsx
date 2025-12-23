'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                  <span className="text-white text-xl">🐄</span>
                </div>
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    FarmStock
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
              <Link
                href="/buyer?type=sheep"
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                Sheep
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>

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
                <Link href="/buyer?type=sheep" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Sheep</Link>
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
