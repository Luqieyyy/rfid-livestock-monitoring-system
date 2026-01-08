'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { livestockService } from '@/services/firestore.service';
import type { Livestock } from '@/types/livestock.types';

export default function LandingPage() {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLivestock();
  }, []);

  const loadLivestock = async () => {
    try {
      const data = await livestockService.getAll();
      // Get only healthy livestock for display
      const healthyLivestock = data.filter(l => l.status === 'healthy').slice(0, 3);
      setLivestock(healthyLivestock);
    } catch (error) {
      console.error('Error loading livestock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnimalEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      cows: '🐄',
      goat: '🐐',
      sheep: '🐑',
    };
    return emojis[type] || '🐄';
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return ageInYears > 0 ? `${ageInYears} years` : 'Less than 1 year';
  };

  const reviews = [
    {
      name: "Nurul Najihah",
      rating: 5,
      comment: "Good service and the seller very responsive. Highly recommended!",
      date: "4 years ago",
      avatar: "N"
    },
    {
      name: "Nurliyana Mahpof",
      rating: 5,
      comment: "Recommended seller. Very responsible and friendly. The health of livestock is well taken care of. Supplier of quality and fresh meat products. Guaranteed halal",
      date: "4 years ago",
      avatar: "N"
    },
    {
      name: "Cik Bedah",
      rating: 5,
      comment: "All the employees are the best. Toke is friendly. Everything is there. The best is the nong farm.",
      date: "4 years ago",
      avatar: "C"
    },
    {
      name: "Amir Fauzi",
      rating: 5,
      comment: "Great service. Best service 👍",
      date: "4 years ago",
      avatar: "A"
    },
    {
      name: "Amirul Farhan Anuar",
      rating: 5,
      comment: "The best farm ever in tangkak!",
      date: "4 years ago",
      avatar: "A"
    },
    {
      name: "Siti Nor",
      rating: 5,
      comment: "Veryyy good service",
      date: "4 years ago",
      avatar: "S"
    }
  ];

  const stats = [
    { icon: "🐄", value: "500+", label: "Premium Livestock", color: "emerald" },
    { icon: "✓", value: "100%", label: "Vet Certified", color: "blue" },
    { icon: "⏰", value: "24/7", label: "Farm Monitoring", color: "purple" },
    { icon: "⭐", value: "5.0", label: "Customer Rating", color: "amber" }
  ];

  const features = [
    {
      icon: "🔬",
      title: "Premium Genetics Tracking",
      description: "Full pedigree analysis and breed certificates for superior genetic traits and health."
    },
    {
      icon: "📋",
      title: "Complete Health History",
      description: "Access to detailed veterinary records, treatments, and preventative care details."
    },
    {
      icon: "📊",
      title: "Nutritional Data Logs",
      description: "Transparent feeding logs with diet details, supplement tracking and growth metrics."
    },
    {
      icon: "✅",
      title: "Vet Certified",
      description: "All livestock is inspected and certified by licensed veterinarians."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Farm</span>
                <span className="text-xl font-bold text-emerald-600">Sense</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">Features</a>
              <a href="#livestock" className="text-gray-600 hover:text-gray-900 font-medium">Livestock</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium">About</a>
              <a href="#reviews" className="text-gray-600 hover:text-gray-900 font-medium">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
              <Link href="/buyer" className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6">
                🌾 STREAMLINED DATA
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Professional
                <span className="block text-emerald-600">Livestock</span>
                Management
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                A comprehensive platform for buyers to monitor quality, track health history, and verify farm standards. Discover your investment with data-driven insights.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/buyer" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-2">
                  View Active Livestock
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a href="#about" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-emerald-600 hover:text-emerald-600 transition-all">
                  Buyer Access
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-2">
                <div className="relative h-96 rounded-2xl overflow-hidden">
                  <Image
                    src="/landingpage1.jpg"
                    alt="Professional Livestock Management"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold text-emerald-600 mb-4 uppercase tracking-wider">Quality Assurance</h2>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Transparent Standards for Serious Buyers</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We eliminate the guesswork. Our standardized quality metrics ensure you know exactly what you are purchasing before visiting the farm.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-3xl mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Livestock Profiles Section */}
      <section id="livestock" className="py-20 px-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Detailed Livestock Profiles</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get a granular view of every animal. From weight progression to health policy potential.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loading ? (
              // Loading placeholder
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : livestock.length > 0 ? (
              livestock.map((animal) => (
                <div key={animal.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                  <div className="relative h-64 bg-gray-200">
                    {animal.photoUrl ? (
                      <Image
                        src={animal.photoUrl}
                        alt={`${animal.breed} - ${animal.tagId}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                        <span className="text-6xl">{getAnimalEmoji(animal.type)}</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-lg">
                      READY FOR SALE
                    </div>
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-900 text-sm font-semibold rounded-lg">
                      {animal.tagId}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-gray-900 capitalize">{animal.breed}</h4>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type</span>
                        <span className="font-semibold text-gray-900 capitalize">{animal.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Age</span>
                        <span className="font-semibold text-gray-900">{animal.age || calculateAge(animal.dateOfBirth)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Weight</span>
                        <span className="font-semibold text-gray-900">{animal.weight ? `${animal.weight}kg` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Health</span>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold capitalize">{animal.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-600">Gender</div>
                        <div className="text-sm font-bold text-emerald-600 capitalize">{animal.gender}</div>
                      </div>
                      <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-600">Location</div>
                        <div className="text-sm font-bold text-blue-600">{animal.location}</div>
                      </div>
                    </div>
                    <Link href="/buyer" className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all text-center block">
                      View Full Detail
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-6xl mb-4">🐄</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Livestock Available</h3>
                <p className="text-gray-600">Check back soon for new additions to our farm.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Farm Profile Section */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-sm font-semibold text-emerald-600 mb-4 uppercase tracking-wider">Live Farm Status</h2>
              <h3 className="text-4xl font-bold text-gray-900 mb-6">Farm Readiness Monitoring</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Daily Sanitation Checks</h4>
                    <p className="text-gray-600 text-sm">Regular facility inspections and maintenance to ensure optimal conditions.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Feed Stock Levels</h4>
                    <p className="text-gray-600 text-sm">Monitoring inventory to prevent shortages and maintain quality standards.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Climate Control</h4>
                    <p className="text-gray-600 text-sm">Tracking air quality and temperature for a comfortable day-to-day environment for livestock.</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Farm Health</span>
                  <span className="text-2xl font-bold text-emerald-600">99.2%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: '99.2%' }}></div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="relative h-80 bg-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm font-medium">Map View</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">🏪</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">NONG FARM</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-lg font-bold text-gray-900">5.0</span>
                        <span className="text-sm text-gray-500">(30 reviews)</span>
                      </div>
                      <p className="text-sm text-gray-600">Ranch in Malaysia</p>
                    </div>
                  </div>
                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Address:</div>
                        <div className="text-sm text-gray-600">J187, 84900 Tangkak, Johor</div>
                        <div className="text-sm text-gray-600">Jln Solok, 84900 Tangkak, Johor Darul Ta'zim, Malaysia</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Phone:</div>
                        <a href="tel:017-6891149" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">017-689 1149</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900">Hours:</div>
                        <div className="text-sm text-gray-600">Opens 8 AM daily</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a 
                      href="https://maps.app.goo.gl/vHAF1qLmVM" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-3xl font-bold text-gray-900">5.0</span>
            </div>
            <p className="text-gray-600">Based on 30+ Google reviews</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                    <div className="flex items-center gap-1">
                      <div className="flex text-amber-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{review.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <a 
              href="https://www.google.com/maps/place/NONG+FARM" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-emerald-600 hover:text-emerald-600 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              See all 30 reviews on Google
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Investment?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Browse our premium livestock collection and make informed decisions with complete transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/buyer" className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl">
              Browse Livestock
            </Link>
            <a href="tel:017-6891149" className="px-8 py-4 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all">
              Contact Farm: 017-689 1149
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg"></div>
                <span className="text-xl font-bold text-white">FarmSense</span>
              </div>
              <p className="text-sm text-gray-400">
                Professional livestock monitoring and management platform for modern farms.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-emerald-400 transition">Features</a></li>
                <li><a href="#livestock" className="hover:text-emerald-400 transition">Livestock</a></li>
                <li><Link href="/buyer" className="hover:text-emerald-400 transition">Buyer Portal</Link></li>
                <li><Link href="/admin" className="hover:text-emerald-400 transition">Farm Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>NONG FARM</li>
                <li>Tangkak, Johor, Malaysia</li>
                <li><a href="tel:017-6891149" className="hover:text-emerald-400 transition">017-689 1149</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 FarmSense. All rights reserved. Built for NONG FARM Tangkak.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
