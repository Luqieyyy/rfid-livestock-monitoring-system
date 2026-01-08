'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
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
  Zap,
  ArrowRight
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
      // Get healthy livestock for the marketplace display
      const healthyLivestock = data.filter(l => l.status === 'healthy');
      setLivestock(healthyLivestock);
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
    const ageInYears = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return ageInYears > 0 ? `${ageInYears} years` : 'Less than 1 year';
  };

  const reviews = [
    { name: "Nurul Najihah", rating: 5, comment: "Good service and the seller very responsive. Highly recommended!", avatar: "N", date: "4 years ago" },
    { name: "Nurliyana Mahpof", rating: 5, comment: "Recommended seller. Very responsible and friendly. The health of livestock is well taken care of. Supplier of quality and fresh meat products. Guaranteed halal", avatar: "N", date: "4 years ago" },
    { name: "Cik Bedah", rating: 5, comment: "All the employees are the best. Toke is friendly. Everything is there. The best is the nong farm.", avatar: "C", date: "4 years ago" },
    { name: "Amir Fauzi", rating: 5, comment: "Great service. Best service 👍", avatar: "A", date: "4 years ago" },
    { name: "Amirul Farhan Anuar", rating: 5, comment: "The best farm ever in tangkak!", avatar: "A", date: "4 years ago" },
    { name: "Siti Nor", rating: 5, comment: "Veryyy good service", avatar: "S", date: "4 years ago" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
<div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
  <div className="flex items-center gap-2 group cursor-pointer">
    {/* Bekas Logo Tanpa Latar Belakang Hijau */}
    <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
      <Image 
        src="/farmsenselogo.png" 
        alt="FarmSense Logo"
        width={50} // Saiz ditingkatkan sedikit (w-12) supaya logo lebih jelas
        height={50}
        className="object-contain group-hover:scale-110 transition-transform" 
      />
    </div>
    
    {/* Nama Brand */}
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

          <div className="flex items-center gap-4">
            <Link href="/login" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-95">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Pilih Ternakan   <br />
              <span className="text-emerald-600">Sedia untuk dijual </span> <br />
              Hari ini
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              Kami bukan sekadar ladang biasa. Dengan sistem pemantauan 24/7 dan kawalan biosekuriti yang ketat, kami menjamin persekitaran yang paling kondusif untuk ternakan anda sebelum ia berpindah tangan.            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/buyer" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2">
                Cari Haiwan Ternakan Tersedia
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#about" className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:border-emerald-600 hover:text-emerald-600 transition-all">
                Jadi Pembeli Hari Ini!
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl transform rotate-3 opacity-20" />
            <div className="relative bg-white p-2 rounded-3xl shadow-2xl">
              <div className="relative h-96 rounded-2xl overflow-hidden">
                <Image src="/landingpage1.jpg" alt="Livestock Management" fill className="object-cover" priority />
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Stats Section dengan Gambar Kecil */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
              img: "/stat-cow.png", // Gantikan dengan path gambar anda dalam folder public
              val: "500+", 
              label: "Premium Livestock" 
            },
            { 
              img: "/stat-vet.png", 
              val: "100%", 
              label: "Vet Certified" 
            },
            { 
              img: "/stat-monitor.png", 
              val: "24/7", 
              label: "Farm Monitoring" 
            },
            { 
              img: "/stat-rating.png", 
              val: "5.0", 
              label: "Customer Rating" 
            }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {/* Bekas Gambar Kecil */}
              <div className="relative w-40 h-40 mb-3">
                <Image 
                  src={stat.img} 
                  alt={stat.label}
                  fill
                  className="object-contain" // Memastikan gambar tidak terpotong
                />
              </div>
              {/* Nilai Statistik */}
              <div className="text-2xl font-bold text-gray-900 leading-none mb-1">
                {stat.val}
              </div>
              {/* Label Statistik */}
              <div className="text-sm text-gray-500 font-medium uppercase tracking-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detailed Livestock Profiles - HORIZONTAL SCROLL */}
      <section id="livestock" className="py-24 bg-emerald-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Senarai Haiwan Ternakan Yang Tersedia</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dapatkan pandangan terperinci tentang setiap haiwan. Dari perkembangan berat hingga potensi polisi kesihatan.
          </p>
        </div>

        <div className="flex overflow-x-auto gap-8 px-6 md:px-[calc((100vw-1280px)/2+24px)] no-scrollbar snap-x snap-mandatory pb-8">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[350px] h-[500px] bg-white rounded-3xl animate-pulse shadow-sm" />
            ))
          ) : livestock.length > 0 ? (
            livestock.map((animal) => (
              <div key={animal.id} className="min-w-[340px] md:min-w-[380px] snap-start bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                {/* Image Header */}
                <div className="relative h-60 bg-gray-100">
                  {animal.photoUrl ? (
                    <Image src={animal.photoUrl} alt={animal.breed} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-emerald-50">
                      <svg className="w-24 h-24 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[11px] font-bold text-gray-700 shadow-sm">
                    {animal.tagId}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg tracking-wider">
                    READY FOR SALE
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 capitalize mb-4">{animal.breed || 'Unknown Breed'}</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Type</span>
                      <span className="font-bold text-gray-900 capitalize">{animal.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Age</span>
                      <span className="font-bold text-gray-900">{animal.age || calculateAge(animal.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Weight</span>
                      <span className="font-bold text-gray-900">{animal.weight}kg</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-500 font-medium">Health</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-tighter">Healthy</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gender</div>
                      <div className="font-bold text-emerald-600 capitalize">{animal.gender}</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</div>
                      <div className="font-bold text-blue-600 capitalize">{animal.location || 'Farm'}</div>
                    </div>
                  </div>

                  <Link href={`/buyer`} className="block w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-center transition-all">
                    View Full Detail
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full text-center py-20 text-gray-400">No livestock profiles found.</div>
          )}
        </div>
      </section>
{/* Features Grid */}
<section id="features" className="py-24 px-6 max-w-7xl mx-auto">
  <div className="text-center mb-16">
    <h3 className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">Kualiti Terjaga</h3>
    <h2 className="text-4xl font-bold text-gray-900 mb-6">Tiada lagi penipuan dalam jual beli</h2>
    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
      Kami menggantikan keraguan dengan data. Apa yang anda lihat dalam profil digital, itulah kualiti yang anda akan terima.
    </p>
  </div>

  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
    {[
      { 
        title: "Premium Genetics", 
        desc: "Bukan sekadar baka, kami lampirkan sijil silsilah untuk jaminan keturunan ternakan terbaik.",
        icon: <FlaskConical className="w-6 h-6" />,
        color: "bg-blue-50 text-blue-600"
      },
      { 
        title: "Health History", 
        desc: "Rekod vaksinasi dan rawatan yang telus. Anda tahu sejarah kesihatan mereka dari hari pertama.",
        icon: <ShieldCheck className="w-6 h-6" />,
        color: "bg-emerald-50 text-emerald-600"
      },
      { 
        title: "Nutritional Logs", 
        desc: "Pemantauan diet harian. Kami pastikan ternakan membesar dengan nutrisi yang seimbang dan mencukupi.",
        icon: <ClipboardList className="w-6 h-6" />,
        color: "bg-orange-50 text-orange-600"
      },
      { 
        title: "Vet Certified", 
        desc: "Setiap ekor telah melalui pemeriksaan fizikal oleh pakar veterinar bertauliah sebelum dipaparkan.",
        icon: <CheckCircle2 className="w-6 h-6" />,
        color: "bg-purple-50 text-purple-600"
      }
    ].map((f, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        className="p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all duration-300 flex flex-col h-full group"
      >
        {/* Icon & Badge Area */}
        <div className="flex justify-between items-start mb-8">
          <div className={`p-4 rounded-2xl ${f.color} transition-transform duration-300 group-hover:scale-110`}>
            {f.icon}
          </div>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-tighter">
            Verified Data
          </span>
        </div>

        {/* Content Area */}
        <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
          {f.title}
        </h4>
        
        <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
          {f.desc}
        </p>

        {/* Humanize Touch: Visual Indicator */}
        <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
          <div className="flex -space-x-2">
            {[1, 2].map((u) => (
              <div key={u} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-emerald-600">👤</span>
                </div>
              </div>
            ))}
          </div>
          <span className="text-[10px] font-medium text-gray-400">Disemak oleh Pakar</span>
        </div>
      </motion.div>
    ))}
  </div>
</section>

{/* Farm Profile Section */}
<section id="about" className="py-24 px-6 bg-white">
  <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
    {/* Left Side: Monitoring Info */}
    <div>
      <h3 className="text-emerald-600 font-bold text-sm uppercase mb-4 tracking-wider">
        Live Farm Status
      </h3>
      <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
        Farm Readiness Monitoring
      </h2>
      
      <div className="space-y-6">
        {[
          { 
            image: "/sanitasion.jpg", 
            title: "Daily Sanitation Checks", 
            desc: "Regular facility inspections and maintenance for optimal conditions." 
          },
          { 
            image: "/feedstock.jpg", 
            title: "Feed Stock Levels", 
            desc: "Monitoring inventory to prevent shortages and maintain quality." 
          },
          { 
            image: "/climatecontrol.jpg", 
            title: "Climate Control", 
            desc: "Tracking air quality and temperature for a healthy environment." 
          }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-5">
            {/* Box Icon Size Fixed */}
            <div className="w-50 h-50 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
              <img src={item.image} alt={item.title} className="w-25 h-25 object-contain" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Health Progress Bar Section */}
      <div className="mt-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-gray-700 uppercase text-xs tracking-widest">Overall Farm Health</span>
          <span className="text-2xl font-black text-emerald-600">99.2%</span>
        </div>
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000" 
            style={{ width: '99.2%' }} 
          />
        </div>
      </div>
    </div>

    {/* Right Side: Google Maps Card */}
    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
      {/* Map/Farm Image Header */}
      <div className="h-72 bg-slate-100 relative group">
        <img 
          src="/Nongfarm.jpg" 
          alt="Farm Background" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-black/10" /> {/* Subtle Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-xl">
            <MapPin className="text-emerald-600 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Farm Details Body */}
      <div className="p-10">
        <div className="flex items-center gap-6 mb-8">
          {/* Logo Container Adjusted */}
          <div className="w-20 h-20 bg-white rounded-2xl shadow-md border border-gray-50 flex items-center justify-center overflow-hidden p-2">
            <img src="/farmsenselogo.png" alt="Nong Farm Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">NONG FARM</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="fill-current w-5 h-5" />
                ))}
              </div>
              <span className="font-bold text-gray-900 text-lg">5.0</span>
              <span className="text-gray-400 text-sm font-medium ml-1">(30 reviews)</span>
            </div>
          </div>
        </div>

        {/* Info Rows */}
        <div className="space-y-5 text-gray-600 mb-10">
          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
            <span className="text-sm font-medium leading-relaxed">J187, 84900 Tangkak, Johor, Malaysia</span>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium">017-689 1149</span>
          </div>
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium">Opens 8 AM daily</span>
          </div>
        </div>

        {/* Button Fixed */}
        <a 
          href="https://www.google.com/maps" 
          target="_blank" 
          className="block w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
        >
          View on Google Maps
        </a>
      </div>
    </div>
  </div>
</section>

      {/* Reviews Section - HORIZONTAL SCROLL */}
      <section id="reviews" className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex text-amber-400">
               {[...Array(5)].map((_, i) => <Star key={i} className="fill-current w-6 h-6" />)}
            </div>
            <span className="text-2xl font-black text-gray-900">5.0</span>
          </div>
          <p className="text-gray-500 mt-2">Based on 30+ Google reviews</p>
        </div>

        <div className="flex overflow-x-auto gap-6 px-6 md:px-[calc((100vw-1280px)/2+24px)] no-scrollbar snap-x snap-mandatory pb-10">
          {reviews.map((r, i) => (
            <div key={i} className="min-w-[320px] md:min-w-[400px] snap-start bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{r.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{r.name}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, star) => <Star key={star} className="fill-current w-3 h-3" />)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{r.date}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{r.comment}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start Your Investment?</h2>
          <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
            Browse our premium livestock collection and make informed decisions with complete transparency.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/buyer" className="px-10 py-5 bg-white text-emerald-700 rounded-2xl font-black hover:bg-gray-100 transition-all shadow-xl">
              Browse Livestock
            </Link>
            <a href="tel:017-6891149" className="px-10 py-5 bg-emerald-800 text-white rounded-2xl font-bold hover:bg-emerald-900 transition-all">
              Call: 017-689 1149
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg" />
              <span className="text-white text-xl font-bold">FarmSense</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed">
              Professional livestock monitoring and management platform. Providing data-driven insights for the modern agricultural market.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Navigation</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/buyer" className="hover:text-emerald-400 transition-colors">Marketplace</Link></li>
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Farmer Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li>NONG FARM, Tangkak, Johor</li>
              <li>017-689 1149</li>
              <li>support@farmsense.com</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-center text-xs font-bold uppercase tracking-widest">
          © 2026 FarmSense. All Rights Reserved. Built for NONG FARM.
        </div>
      </footer>

      {/* Tailwind Scrollbar Hide Utility */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}