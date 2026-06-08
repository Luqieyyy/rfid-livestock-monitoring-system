'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { savedService, livestockService } from '@/services/firestore.service';
import type { Livestock } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';
import { AnimalDetailModal } from '@/components/buyer/AnimalDetailModal';

export default function SavedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedAnimals, setSavedAnimals] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    load();
  }, [user?.uid]);

  const load = async () => {
    try {
      const [savedIds, allLivestock] = await Promise.all([
        savedService.getSavedIds(user!.uid),
        livestockService.getAll(),
      ]);
      const savedSet = new Set(savedIds);
      setSavedAnimals(allLivestock.filter((a) => savedSet.has(a.id)));
    } catch (error) {
      console.error('Error loading saved:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (animal: Livestock) => {
    setRemovingId(animal.id);
    try {
      await savedService.toggle(user!.uid, animal.id);
      setSavedAnimals((prev) => prev.filter((a) => a.id !== animal.id));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-[3px] border-rose-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <svg className="h-5 w-5 text-rose-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Saved Livestock</h1>
        </div>
        <p className="text-sm text-gray-400">{savedAnimals.length} haiwan dalam senarai simpanan anda</p>
      </div>

      {savedAnimals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 mb-4">
            <svg className="h-10 w-10 text-rose-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Tiada haiwan tersimpan</h3>
          <p className="text-sm text-gray-400 mb-6">Tekan ikon ♥ pada kad haiwan untuk menyimpannya di sini.</p>
          <button
            onClick={() => router.push('/buyer')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Jelajah Marketplace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 2xl:grid-cols-6">
          {savedAnimals.map((animal) => (
            <div
              key={animal.id}
              onClick={() => setSelectedAnimal(animal)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-r from-emerald-50 to-teal-50 sm:h-36">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(animal); }}
                  disabled={removingId === animal.id}
                  className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transition-all hover:scale-110 hover:bg-rose-600 ${removingId === animal.id ? 'scale-90 opacity-60' : ''}`}
                  aria-label="Unsave"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                {animal.photoUrl ? (
                  <img src={animal.photoUrl} alt={animal.breed} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <img src={animal.type === 'cow' ? '/cow.jpg' : '/goat.png'} alt={animal.type} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
              </div>
              <div className="p-3">
                <div className="mb-2">
                  <h3 className="truncate text-base font-bold text-gray-900">{formatAnimalDisplayName(animal.type, animal.animalId)}</h3>
                  <p className="text-xs text-gray-500 capitalize">{animal.breed} • {animal.type}</p>
                </div>
                {animal.price != null && (
                  <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                    <p className="text-[10px] font-medium text-emerald-600">Harga</p>
                    <p className="truncate text-sm font-bold text-emerald-700">RM {animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <div className="rounded-lg bg-gray-50 p-1.5">
                    <p className="text-[10px] text-gray-400">Weight</p>
                    <p className="text-xs font-bold text-gray-900">{animal.weight} kg</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-1.5">
                    <p className="text-[10px] text-gray-400">Gender</p>
                    <p className="text-xs font-bold capitalize text-gray-900">{animal.gender}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end border-t border-gray-100 pt-2.5">
                  <span className="text-xs font-medium text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    View details
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAnimal && (
        <AnimalDetailModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
      )}
    </div>
  );
}
