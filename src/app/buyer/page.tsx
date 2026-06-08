'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { livestockService, savedService } from '@/services/firestore.service';
import { useAuth } from '@/context/AuthContext';
import type { Livestock } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';
import { AnimalDetailModal, calculateAge } from '@/components/buyer/AnimalDetailModal';

function BuyerPortalContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [filteredLivestock, setFilteredLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user?.uid) return;
    savedService.getSavedIds(user.uid).then((ids) => setSavedIds(new Set(ids)));
  }, [user?.uid]);

  const handleToggleSave = async (e: React.MouseEvent, animal: Livestock) => {
    e.stopPropagation();
    if (!user?.uid) return;
    setTogglingId(animal.id);
    try {
      const nowSaved = await savedService.toggle(user.uid, animal.id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (nowSaved) next.add(animal.id);
        else next.delete(animal.id);
        return next;
      });
    } finally {
      setTogglingId(null);
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

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === 'weight-asc') {
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

  const typeStats = {
    all: livestock.length,
    cows: livestock.filter(l => l.type === 'cow').length,
    goat: livestock.filter(l => l.type === 'goat').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading available livestock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">FarmSense Marketplace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Browse Livestock</h1>
          <p className="mt-1 text-sm text-slate-500">{livestock.length} animals available with verified health records.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-slate-200 px-4 py-2">
            <p className="font-bold text-slate-900">{typeStats.all}</p>
            <p className="text-xs text-slate-500">All</p>
          </div>
          <div className="rounded-lg border border-slate-200 px-4 py-2">
            <p className="font-bold text-slate-900">{typeStats.cows}</p>
            <p className="text-xs text-slate-500">Cows</p>
          </div>
          <div className="rounded-lg border border-slate-200 px-4 py-2">
            <p className="font-bold text-slate-900">{typeStats.goat}</p>
            <p className="text-xs text-slate-500">Goats</p>
          </div>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { type: 'all', label: 'All Animals', count: typeStats.all },
            { type: 'cows', label: 'Cows', count: typeStats.cows },
            { type: 'goat', label: 'Goats', count: typeStats.goat },
          ].map((category) => (
            <button
              key={category.type}
              onClick={() => setSelectedType(category.type)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedType === category.type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {category.label}
              <span className={`ml-2 ${selectedType === category.type ? 'text-emerald-100' : 'text-slate-400'}`}>{category.count}</span>
            </button>
          ))}
        </div>
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
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
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
            <button onClick={() => setSelectedType('all')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Livestock Grid */}
      {filteredLivestock.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-6">
          {filteredLivestock.map((animal) => (
            <div
              key={animal.id}
              onClick={() => setSelectedAnimal(animal)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 sm:h-36">
                <div className="absolute right-2 top-2 z-10">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Verified
                  </span>
                </div>
                <button
                  onClick={(e) => handleToggleSave(e, animal)}
                  disabled={togglingId === animal.id}
                  className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
                    savedIds.has(animal.id)
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/85 text-slate-400 hover:bg-white hover:text-rose-500 backdrop-blur-sm'
                  } ${togglingId === animal.id ? 'scale-90 opacity-70' : 'hover:scale-110'}`}
                  aria-label={savedIds.has(animal.id) ? 'Unsave' : 'Save'}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill={savedIds.has(animal.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                {animal.photoUrl ? (
                  <img 
                    src={animal.photoUrl} 
                    alt={animal.breed}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={animal.type === 'cow' ? '/cow.jpg' : '/goat.png'} 
                      alt={animal.type}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="mb-3">
                  <h3 className="truncate text-base font-bold text-gray-900">{formatAnimalDisplayName(animal.type, animal.animalId)}</h3>
                  <p className="text-gray-500 capitalize">{animal.breed} • {animal.type}</p>
                </div>
                {animal.price != null && (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] font-medium text-emerald-600">Harga</p>
                    <p className="truncate text-base font-bold text-emerald-700">RM {animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="mb-0.5 text-[11px] text-gray-400">Weight</p>
                    <p className="truncate text-sm font-bold text-gray-900">{animal.weight} kg</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="mb-0.5 text-[11px] text-gray-400">Age</p>
                    <p className="truncate text-sm font-bold text-gray-900">{calculateAge(animal.dateOfBirth)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="mb-0.5 text-[11px] text-gray-400">Gender</p>
                    <p className="truncate text-sm font-bold capitalize text-gray-900">{animal.gender}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <p className="mb-0.5 text-[11px] text-gray-400">Location</p>
                    <p className="truncate text-sm font-bold text-gray-900">{animal.location}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-emerald-600">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="truncate">Certified</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition-transform group-hover:translate-x-0.5">
                    View
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Animal Detail Modal */}
      {selectedAnimal && (
        <AnimalDetailModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
      )}
    </div>
  );
}


export default function BuyerPortal() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <BuyerPortalContent />
    </Suspense>
  );
}
