'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { livestockService } from '@/services/firestore.service';
import type { Livestock } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';

function BuyerPortalContent() {
  const searchParams = useSearchParams();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [filteredLivestock, setFilteredLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);

  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl) {
      setSelectedType(typeFromUrl);
    }
    loadLivestock();
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [selectedType, searchQuery, sortBy, livestock]);

  const loadLivestock = async () => {
    try {
      const data = await livestockService.getAvailableForSale();
      setLivestock(data);
      setFilteredLivestock(data);
    } catch (error) {
      console.error('Error loading livestock:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...livestock];

    if (selectedType !== 'all') {
      if (selectedType === 'cows') {
        filtered = filtered.filter((item) => item.type === 'cow');
      } else {
        filtered = filtered.filter((item) => item.type === selectedType);
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.rfid && item.rfid.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (sortBy === 'weight-asc') {
      filtered.sort((a, b) => a.weight - b.weight);
    } else if (sortBy === 'weight-desc') {
      filtered.sort((a, b) => b.weight - a.weight);
    } else if (sortBy === 'age-asc') {
      filtered.sort((a, b) => new Date(b.dateOfBirth).getTime() - new Date(a.dateOfBirth).getTime());
    } else if (sortBy === 'age-desc') {
      filtered.sort((a, b) => new Date(a.dateOfBirth).getTime() - new Date(b.dateOfBirth).getTime());
    }

    setFilteredLivestock(filtered);
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) return `${ageInDays} days`;
    if (ageInDays < 365) return `${Math.floor(ageInDays / 30)} months`;
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    return months > 0 ? `${years}y ${months}m` : `${years} years`;
  };

  const typeStats = {
    all: livestock.length,
    cows: livestock.filter(l => l.type === 'cow').length,
    goat: livestock.filter(l => l.type === 'goat').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading available livestock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        <div className="relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Premium Livestock Marketplace
            </h1>
            <p className="text-lg text-cyan-100 mb-8">
              Browse our collection of health-verified, fully documented livestock. 
              Each animal comes with complete traceability records.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-2xl font-bold">{livestock.length}</p>
                <p className="text-sm text-cyan-100">Available Now</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-cyan-100">Health Verified</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
                <p className="text-2xl font-bold">✓</p>
                <p className="text-sm text-cyan-100">Full Records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { type: 'all', label: 'All Animals', image: '/stat-cow.png' },
          { type: 'cows', label: 'Cows', image: '/cow.jpg' },
          { type: 'goat', label: 'Goats', image: '/goat.png' },
        ].map((category) => (
          <button
            key={category.type}
            onClick={() => setSelectedType(category.type)}
            className={`p-5 rounded-2xl border-2 transition-all ${
              selectedType === category.type
                ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-lg shadow-cyan-500/20'
                : 'bg-white border-gray-100 hover:border-cyan-200 hover:shadow-md'
            }`}
          >
            <div className="mb-3 flex justify-center">
              <div className={`w-20 h-20 rounded-xl overflow-hidden shadow-sm ${
                selectedType === category.type ? 'ring-2 ring-cyan-400 ring-offset-2' : ''
              }`}>
                <img 
                  src={category.image} 
                  alt={category.label} 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <p className="font-bold text-gray-900 mb-1">{category.label}</p>
            <p className="text-sm text-gray-500">
              {typeStats[category.type as keyof typeof typeStats]} available
            </p>
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by animal ID or breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="newest">Newest First</option>
            <option value="weight-desc">Weight: High to Low</option>
            <option value="weight-asc">Weight: Low to High</option>
            <option value="age-desc">Age: Oldest First</option>
            <option value="age-asc">Age: Youngest First</option>
          </select>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">{filteredLivestock.length}</span> of {livestock.length} animals
          </p>
          {selectedType !== 'all' && (
            <button onClick={() => setSelectedType('all')} className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Livestock Grid */}
      {filteredLivestock.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLivestock.map((animal) => (
            <div
              key={animal.id}
              onClick={() => setSelectedAnimal(animal)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-xl hover:border-cyan-200 transition-all"
            >
              <div className="relative h-48 bg-gradient-to-r from-slate-100 to-cyan-50 overflow-hidden">
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    Verified
                  </span>
                </div>
                {animal.photoUrl ? (
                  <img 
                    src={animal.photoUrl} 
                    alt={animal.breed}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={animal.type === 'cow' ? '/cow.jpg' : '/goat.png'} 
                      alt={animal.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{formatAnimalDisplayName(animal.type, animal.animalId)}</h3>
                  <p className="text-gray-500 capitalize">{animal.breed} • {animal.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Weight</p>
                    <p className="font-bold text-gray-900">{animal.weight} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Age</p>
                    <p className="font-bold text-gray-900">{calculateAge(animal.dateOfBirth)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Gender</p>
                    <p className="font-bold text-gray-900 capitalize">{animal.gender}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">Location</p>
                    <p className="font-bold text-gray-900">{animal.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Health Certified
                  </div>
                  <span className="text-cyan-600 font-medium text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🔍</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No livestock found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => { setSelectedType('all'); setSearchQuery(''); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-50 text-cyan-700 rounded-xl font-medium hover:bg-cyan-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Animal Detail Modal */}
      {selectedAnimal && (
        <AnimalDetailModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} calculateAge={calculateAge} />
      )}
    </div>
  );
}

function AnimalDetailModal({ animal, onClose, calculateAge }: { 
  animal: Livestock; 
  onClose: () => void;
  calculateAge: (date: Date) => string;
}) {

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-6">
            {animal.photoUrl ? (
              <img 
                src={animal.photoUrl} 
                alt={animal.breed}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg border-4 border-white/20"
              />
            ) : (
              <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{animal.animalId}</h2>
                <span className="bg-emerald-400 text-emerald-900 px-3 py-1 rounded-full text-xs font-semibold">Verified</span>
              </div>
              <p className="text-cyan-100 capitalize text-lg">{animal.breed} • {animal.type}</p>
              <p className="text-cyan-200 text-sm mt-1">RFID: {animal.rfid || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* View Mode - Show all details */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-100">
              <p className="text-xs text-gray-500 mb-1">Weight</p>
              <p className="text-xl font-bold text-gray-900">{animal.weight} kg</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">Age</p>
              <p className="text-xl font-bold text-gray-900">{calculateAge(animal.dateOfBirth)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-100">
              <p className="text-xs text-gray-500 mb-1">Gender</p>
              <p className="text-xl font-bold text-gray-900 capitalize">{animal.gender}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 text-center border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">Location</p>
              <p className="text-xl font-bold text-gray-900">{animal.location}</p>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900">Complete Animal Profile</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <InfoRow label="Date of Birth" value={new Date(animal.dateOfBirth).toLocaleDateString()} />
              <InfoRow label="Health Status" value={animal.status} valueClass="text-emerald-600 capitalize" />
              <InfoRow label="Animal ID" value={animal.animalId} />
              <InfoRow label="RFID" value={animal.rfid || 'N/A'} />
              <InfoRow label="Breed" value={animal.breed} valueClass="capitalize" />
            </div>
          </div>

          {/* Health Certification */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-emerald-800 mb-1">Health Certified</h4>
                <p className="text-sm text-emerald-700">This animal has passed all health verification requirements and is ready for purchase.</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {animal.notes && (
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
              <p className="text-gray-600">{animal.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => {
                // Open WhatsApp or messaging system
                const message = `Hi, I'm interested in ${animal.breed} ${animal.type} (ID: ${animal.animalId}). Can we discuss further?`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
              </svg>
              Chat with Owner
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueClass = "text-gray-900" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-xl">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function BuyerPortal() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <BuyerPortalContent />
    </Suspense>
  );
}
