'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Farm<span className="text-emerald-600">Sense</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 gradient-bg overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Modern Farm Management Solution
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Smart <span className="gradient-text">Farm Management</span> with FarmSense
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Revolutionize your livestock farming with intelligent insights. Track health records, 
                manage breeding cycles, monitor sales, and make data-driven decisions for sustainable growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-xl hover:shadow-emerald-500/30">
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <a href="#features" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 px-8 py-4 rounded-xl font-semibold border border-gray-200 transition-all hover:border-gray-300">
                  Learn More
                </a>
              </div>
              <div className="flex items-center gap-8 mt-10 pt-10 border-t border-gray-200">
                <div>
                  <p className="text-3xl font-bold text-gray-900">500+</p>
                  <p className="text-gray-500 text-sm">Livestock Tracked</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-gray-500 text-sm">Health Compliance</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">24/7</p>
                  <p className="text-gray-500 text-sm">Real-time Monitoring</p>
                </div>
              </div>
            </div>
            <div className="relative animate-fade-in lg:pl-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-20 blur-2xl"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900">Farm Overview</h3>
                    <span className="text-xs text-gray-500">Live Data</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🐄</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">247</span>
                      </div>
                      <p className="text-sm text-gray-600">Total Cattle</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🐐</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">89</span>
                      </div>
                      <p className="text-sm text-gray-600">Total Goats</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Healthy</span>
                      </div>
                      <span className="font-semibold text-gray-900">312</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Under Treatment</span>
                      </div>
                      <span className="font-semibold text-gray-900">18</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Pregnant</span>
                      </div>
                      <span className="font-semibold text-gray-900">6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Manage Your Farm</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed for modern livestock farming operations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📊",
                title: "Real-time Dashboard",
                desc: "Monitor your entire farm operation at a glance with live statistics, health metrics, and financial summaries."
              },
              {
                icon: "💊",
                title: "Health Management",
                desc: "Track vaccinations, treatments, and medical history. Get alerts for upcoming checkups and health concerns."
              },
              {
                icon: "🧬",
                title: "Breeding Records",
                desc: "Manage breeding cycles, track pregnancies, and maintain complete lineage records for genetic improvement."
              },
              {
                icon: "💰",
                title: "Sales Tracking",
                desc: "Record transactions, track payments, manage deliveries, and analyze revenue trends over time."
              },
              {
                icon: "📱",
                title: "Mobile Integration",
                desc: "Sync with mobile app for field data collection. Your team can update records from anywhere on the farm."
              },
              {
                icon: "🔍",
                title: "Full Traceability",
                desc: "Complete audit trail from birth to sale. Meet compliance requirements and build buyer confidence."
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl p-8 border border-gray-100 card-shadow-hover">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About System Section */}
      <section id="about" className="py-24 gradient-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Built for Modern Livestock Farming</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                LiveStock Pro is a comprehensive farm management system designed to digitize and streamline 
                livestock operations. Our platform bridges the gap between traditional farming practices 
                and modern technology.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                The system integrates seamlessly with mobile applications used by farm operators in the field, 
                ensuring real-time data synchronization and accurate record-keeping across your entire operation.
              </p>
              <div className="space-y-4">
                {[
                  "Complete livestock inventory management",
                  "Automated health monitoring and alerts",
                  "Breeding cycle tracking and planning",
                  "Financial reporting and analytics",
                  "Buyer marketplace integration"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Architecture</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Mobile App</p>
                      <p className="text-sm text-gray-500">Field data collection</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">☁️</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Cloud Database</p>
                      <p className="text-sm text-gray-500">Firebase real-time sync</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🖥️</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Web Dashboard</p>
                      <p className="text-sm text-gray-500">Admin & Buyer portals</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple workflow for comprehensive farm management</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Register Livestock", desc: "Add animals to your inventory with complete details" },
              { step: "02", title: "Track Health", desc: "Record vaccinations, treatments, and checkups" },
              { step: "03", title: "Monitor Growth", desc: "Track weight, breeding cycles, and development" },
              { step: "04", title: "Manage Sales", desc: "List for sale, track transactions, and deliveries" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Farm?</h2>
          <p className="text-xl text-emerald-100 mb-10">
            Join modern farmers who are using LiveStock Pro to streamline operations and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/login" className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-xl hover:bg-gray-50">
              Admin Login
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/buyer/login" className="inline-flex items-center justify-center gap-2 bg-transparent text-white border-2 border-white/30 px-8 py-4 rounded-xl font-semibold transition-all hover:bg-white/10">
              Buyer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">LiveStock<span className="text-emerald-500">Pro</span></span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/admin/login" className="hover:text-white transition-colors">Admin</Link>
              <Link href="/buyer/login" className="hover:text-white transition-colors">Buyer</Link>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </div>
            <p className="text-sm">© {new Date().getFullYear()} LiveStock Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
