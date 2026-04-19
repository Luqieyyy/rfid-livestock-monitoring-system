'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { livestockService } from '@/services/firestore.service';
import type { Livestock } from '@/types/livestock.types';
import {
  ChevronRight,
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  Activity,
  ClipboardList,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  Leaf,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLivestock();
  }, []);

  const loadLivestock = async () => {
    try {
      const data = await livestockService.getAll();
      setLivestock(data.filter((l) => l.status === 'healthy'));
    } catch (error) {
      console.error('Error loading livestock:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: any) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInYears = Math.floor(
      (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    return ageInYears > 0 ? `${ageInYears} years` : '< 1 year';
  };

  const reviews = [
    { name: 'Nurul Najihah', rating: 5, comment: 'Good service and the seller very responsive. Highly recommended!', avatar: 'N', date: '4 years ago' },
    { name: 'Nurliyana Mahpof', rating: 5, comment: 'Recommended seller. Very responsible and friendly. Supplier of quality and fresh meat products. Guaranteed halal.', avatar: 'N', date: '4 years ago' },
    { name: 'Cik Bedah', rating: 5, comment: 'All the employees are the best. Toke is friendly. Everything is there. The best is the nong farm.', avatar: 'C', date: '4 years ago' },
    { name: 'Amir Fauzi', rating: 5, comment: 'Great service. Best service 👍', avatar: 'A', date: '4 years ago' },
    { name: 'Amirul Farhan Anuar', rating: 5, comment: 'The best farm ever in tangkak!', avatar: 'A', date: '4 years ago' },
    { name: 'Siti Nor', rating: 5, comment: 'Veryyy good service', avatar: 'S', date: '4 years ago' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-3">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-11 h-11 flex items-center justify-center overflow-hidden">
              <Image src="/farmsenselogo.png" alt="FarmSense Logo" width={44} height={44} className="object-contain group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Farm<span className="text-emerald-600">Sense</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#livestock" className="hover:text-emerald-600 transition-colors">Livestock</a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">About</a>
            <a href="#reviews" className="hover:text-emerald-600 transition-colors">Reviews</a>
          </div>

          <Link href="/login" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 overflow-hidden" style={{minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '80px'}}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src="/backgroundlembu.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Malaysia's Trusted Livestock Marketplace
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
              Pilih Ternakan<br />
              <span className="text-emerald-400">Sedia untuk Dijual</span><br />
              Hari Ini
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-xl drop-shadow">
              Dengan sistem pemantauan 24/7 dan kawalan biosekuriti yang ketat, kami menjamin persekitaran yang paling kondusif untuk ternakan sebelum berpindah tangan.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/buyer" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95">
                Cari Ternakan Tersedia
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#about" className="px-8 py-4 bg-white/20 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/30 transition-all backdrop-blur-sm">
                Ketahui Lebih Lanjut
              </a>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-100">
              <div className="flex -space-x-2">
                {['#10b981','#0891b2','#7c3aed','#f59e0b'].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c }}>
                    {['N','A','C','S'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-4 h-4" />)}
                </div>
                <p className="text-xs text-white/70 mt-0.5">Dipercayai 500+ pembeli</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl transform rotate-3 opacity-10" />
            <div className="relative bg-white p-2 rounded-3xl shadow-2xl ring-1 ring-gray-100">
              <div className="relative h-[420px] rounded-2xl overflow-hidden">
                <Image src="/landingpage1.jpg" alt="Livestock" fill className="object-cover" priority />
                {/* Floating card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium">Health Status</p>
                    <p className="font-bold text-gray-900 text-sm">All livestock vet-certified</p>
                  </div>
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">Live</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Livestock Section */}
      <section id="livestock" className="py-24 bg-gradient-to-b from-emerald-50/50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-14">
          <h3 className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">Live Marketplace</h3>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Senarai Ternakan Yang Tersedia</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Setiap haiwan dilengkapi rekod penuh — berat, kesihatan, vaksinasi, dan sijil vet.
          </p>
        </div>

        <div className="flex overflow-x-auto gap-6 px-6 md:px-[calc((100vw-1280px)/2+24px)] no-scrollbar snap-x snap-mandatory pb-8">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[340px] h-[480px] bg-white rounded-3xl animate-pulse shadow-sm border border-gray-100" />
            ))
          ) : livestock.length > 0 ? (
            livestock.map((animal) => (
              <div key={animal.id} className="min-w-[340px] snap-start bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="relative h-56 bg-gray-100">
                  {animal.photoUrl ? (
                    <Image src={animal.photoUrl} alt={animal.breed} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-emerald-50">
                      <svg className="w-20 h-20 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[11px] font-bold text-gray-700 shadow-sm">
                    {animal.tagId}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg tracking-wider">
                    READY FOR SALE
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 capitalize mb-3">{animal.breed || 'Unknown Breed'}</h3>

                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'Type', val: animal.type },
                      { label: 'Age', val: animal.age || calculateAge(animal.dateOfBirth) },
                      { label: 'Weight', val: `${animal.weight} kg` },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">{row.label}</span>
                        <span className="font-bold text-gray-900 capitalize">{row.val}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-400 font-medium">Health</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">Healthy</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gender</div>
                      <div className="font-bold text-emerald-600 capitalize text-sm">{animal.gender}</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Location</div>
                      <div className="font-bold text-blue-600 capitalize text-sm">{animal.location || 'Farm'}</div>
                    </div>
                  </div>

                  <Link href="/buyer" className="block w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold text-center transition-all text-sm">
                    View Full Profile →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-20 text-gray-400">No livestock available.</div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/backgroundlembu2.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">Quality Guaranteed</h3>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">No more guessing in livestock trading</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              We replace doubt with data. What you see in the digital profile is exactly what you receive.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Premium Genetics', desc: 'Full lineage certificates provided for every animal, ensuring top-tier breeding quality.', icon: <FlaskConical className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
              { title: 'Health History', desc: 'Complete vaccination and treatment records from day one — full transparency guaranteed.', icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
              { title: 'Nutritional Logs', desc: 'Daily diet monitoring ensures livestock grow with balanced and sufficient nutrition.', icon: <ClipboardList className="w-6 h-6" />, color: 'bg-orange-50 text-orange-600' },
              { title: 'Vet Certified', desc: 'Every animal is physically examined by a certified veterinarian before being listed.', icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-purple-50 text-purple-600' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-7 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3.5 rounded-2xl ${f.color} group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full uppercase tracking-tight">
                    Verified
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  {f.title}
                </h4>
                <p className="text-gray-500 text-sm leading-relaxed flex-grow">{f.desc}</p>
                <div className="flex items-center gap-2 pt-5 mt-5 border-t border-gray-50">
                  <div className="flex -space-x-1.5">
                    {[1, 2].map((u) => (
                      <div key={u} className="w-6 h-6 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-emerald-600">✓</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">Verified by Expert</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Farm Profile Section */}
      <section id="about" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/backgroundlembu2.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-emerald-600 font-bold text-sm uppercase mb-3 tracking-wider">Live Farm Status</h3>
            <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">Farm Readiness Monitoring</h2>

            <div className="space-y-5">
              {[
                { image: '/sanitasion.jpg', title: 'Daily Sanitation Checks', desc: 'Regular facility inspections and maintenance for optimal conditions.' },
                { image: '/feedstock.jpg', title: 'Feed Stock Levels', desc: 'Monitoring inventory to prevent shortages and maintain quality.' },
                { image: '/climatecontrol.jpg', title: 'Climate Control', desc: 'Tracking air quality and temperature for a healthy environment.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">Overall Farm Health</span>
                <span className="text-2xl font-black text-emerald-600">99.2%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full" style={{ width: '99.2%' }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
            <div className="h-64 bg-slate-100 relative group overflow-hidden">
              <img src="/Nongfarm.jpg" alt="Nong Farm" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-xl">
                  <MapPin className="text-emerald-600 w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-5 mb-7">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center overflow-hidden p-1.5 shrink-0">
                  <img src="/farmsenselogo.png" alt="Nong Farm Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900">NONG FARM</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-4 h-4" />)}
                    </div>
                    <span className="font-bold text-gray-900">5.0</span>
                    <span className="text-gray-400 text-sm">(30 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-gray-600 mb-8">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium">J187, 84900 Tangkak, Johor, Malaysia</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium">017-689 1149</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium">Opens 8 AM daily</span>
                </div>
              </div>

              <a href="https://www.google.com/maps" target="_blank" className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]">
                View on Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-14">
          <h3 className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-3">Testimonials</h3>
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-5 h-5" />)}
            </div>
            <span className="text-2xl font-black text-gray-900">5.0</span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">Based on 30+ Google reviews</p>
        </div>

        <div className="flex overflow-x-auto gap-5 px-6 md:px-[calc((100vw-1280px)/2+24px)] no-scrollbar snap-x snap-mandatory pb-8">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="min-w-[300px] md:min-w-[360px] snap-start bg-white p-7 rounded-3xl shadow-md border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {r.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{r.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, star) => <Star key={star} className="fill-current w-3 h-3" />)}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm italic">"{r.comment}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl shadow-emerald-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" /> Start Your Investment Today
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-5">Ready to Buy Quality Livestock?</h2>
            <p className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto">
              Browse our premium verified livestock and make informed decisions with full transparency.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/buyer" className="px-10 py-4 bg-white text-emerald-700 rounded-2xl font-black hover:bg-gray-50 transition-all shadow-xl active:scale-95">
                Browse Livestock
              </Link>
              <a href="tel:017-6891149" className="px-10 py-4 bg-emerald-800/60 border border-white/20 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all">
                Call: 017-689 1149
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1">
                <img src="/farmsenselogo.png" alt="FarmSense" className="w-full h-full object-contain" />
              </div>
              <span className="text-white text-xl font-bold">FarmSense</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Professional livestock monitoring and management platform. Data-driven insights for the modern agricultural market.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-5">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/buyer" className="hover:text-emerald-400 transition-colors">Marketplace</Link></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-5">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />NONG FARM, Tangkak, Johor</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500 shrink-0" />017-689 1149</li>
              <li>support@farmsense.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-slate-800 text-center text-xs font-bold uppercase tracking-widest">
          © 2026 FarmSense. All Rights Reserved. Built for NONG FARM.
        </div>
      </footer>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
