'use client';

import { useEffect, useState } from 'react';
import { livestockService } from '@/services/firestore.service';
import { kandangService } from '@/services/farm.service';
import type { Livestock } from '@/types/livestock.types';
import type { Kandang } from '@/types/farm.types';
import { COW_BREEDS, GOAT_BREEDS, SHEEP_BREEDS } from '@/utils/constants';

export default function LivestockPage() {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [filteredLivestock, setFilteredLivestock] = useState<Livestock[]>([]);
  const [kandangs, setKandangs] = useState<Kandang[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Livestock | null>(null);
  const [editingAnimal, setEditingAnimal] = useState<Livestock | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filter, typeFilter, searchQuery, livestock]);

  const loadData = async () => {
    try {
      const [livestockData, kandangData] = await Promise.all([
        livestockService.getAll(),
        kandangService.getAll()
      ]);
      setLivestock(livestockData);
      setFilteredLivestock(livestockData);
      setKandangs(kandangData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLivestock = async () => {
    try {
      const data = await livestockService.getAll();
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

    if (filter !== 'all') {
      filtered = filtered.filter((item) => item.status === filter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.animalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.breed.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLivestock(filtered);
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) return `${ageInDays}d`;
    if (ageInDays < 365) return `${Math.floor(ageInDays / 30)}mo`;
    return `${Math.floor(ageInDays / 365)}y`;
  };

  const stats = {
    total: livestock.length,
    healthy: livestock.filter(l => l.status === 'healthy').length,
    sick: livestock.filter(l => l.status === 'sick').length,
    quarantine: livestock.filter(l => l.status === 'quarantine').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading livestock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Livestock
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="/totallivestockfarm.jpg" alt="total" className="w-20 h-20 object-contain rounded-lg" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="/healthy.png" alt="healthy" className="w-20 h-20 object-contain" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.healthy}</p>
              <p className="text-sm text-gray-500">Healthy</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="/sickanimal.png" alt="sick" className="w-20 h-20 object-contain" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.sick}</p>
              <p className="text-sm text-gray-500">Sick</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex items-center justify-center">
              <img src="/quarantine_livestock.png" alt="quarantine" className="w-20 h-20 object-contain" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.quarantine}</p>
              <p className="text-sm text-gray-500">Quarantine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by Animal ID, Tag ID or Breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'cows', 'goat'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  typeFilter === type
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all' ? 'All Types' : (
                  <span className="flex items-center gap-1.5">
                    {getAnimalEmoji(type)}
                    <span className="capitalize">{type}</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="sick">Sick</option>
            <option value="quarantine">Quarantine</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
      </div>

      {/* Livestock Grid */}
      {filteredLivestock.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLivestock.map((animal) => (
            <div
              key={animal.id}
              onClick={() => setSelectedAnimal(animal)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-emerald-200 transition-all group"
            >
              {/* Animal Photo */}
              <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
                {animal.photoUrl ? (
                  <img 
                    src={animal.photoUrl} 
                    alt={animal.animalId}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-6xl">${getAnimalEmoji(animal.type)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                    {getAnimalEmoji(animal.type)}
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <StatusBadge status={animal.status} />
                </div>
              </div>

              {/* Animal Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">#{animal.animalId}</h3>
                    <p className="text-sm text-gray-500">{animal.breed}</p>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
                    {animal.tagId}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Age</p>
                    <p className="text-sm font-semibold text-gray-700">{calculateAge(animal.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Weight</p>
                    <p className="text-sm font-semibold text-gray-700">{animal.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">{animal.gender}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {animal.location}
                  </span>
                  <span className="text-emerald-600 text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Details
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
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No livestock found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or add new livestock</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Livestock
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnimal && (
        <AnimalDetailModal 
          animal={selectedAnimal} 
          onClose={() => setSelectedAnimal(null)} 
          onEdit={() => {
            setEditingAnimal(selectedAnimal);
            setSelectedAnimal(null);
          }}
        />
      )}

      {/* Add Modal Placeholder */}
      {showAddModal && (
        <AddLivestockModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={loadLivestock}
          kandangs={kandangs}
        />
      )}

      {/* Edit Modal */}
      {editingAnimal && (
        <EditLivestockModal 
          animal={editingAnimal} 
          onClose={() => setEditingAnimal(null)} 
          onSuccess={() => {
            loadLivestock();
            setEditingAnimal(null);
          }}
          kandangs={kandangs}
        />
      )}
    </div>
  );
}

function getAnimalEmoji(type: string): JSX.Element {
  const images: Record<string, string> = {
    cows: '/cow.jpg',
    goat: '/goat.png',
  };
  const src = images[type.toLowerCase()] || '/cow.jpg';
  return <img src={src} alt={type} className="w-8 h-8 object-cover rounded-lg" />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-100 text-emerald-700',
    sick: 'bg-red-100 text-red-700',
    quarantine: 'bg-amber-100 text-amber-700',
    deceased: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${styles[status] || styles.healthy}`}>
      {status}
    </span>
  );
}

function AnimalDetailModal({ animal, onClose, onEdit }: { animal: Livestock; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Animal Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{animal.tagId}</h3>
              <p className="text-gray-500">{animal.breed} • {animal.type}</p>
              <StatusBadge status={animal.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailItem label="Weight" value={`${animal.weight} kg`} />
            <DetailItem label="Gender" value={animal.gender} />
            <DetailItem label="Location" value={animal.location} />
            <DetailItem label="Date of Birth" value={new Date(animal.dateOfBirth).toLocaleDateString()} />
            {animal.purchasePrice && <DetailItem label="Purchase Price" value={`$${animal.purchasePrice}`} />}
            {animal.purchaseDate && <DetailItem label="Purchase Date" value={new Date(animal.purchaseDate).toLocaleDateString()} />}
          </div>

          {animal.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Notes</p>
              <p className="text-gray-700">{animal.notes}</p>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onEdit}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            Edit Animal
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}

function AddLivestockModal({ onClose, onSuccess, kandangs }: { onClose: () => void; onSuccess: () => void; kandangs: Kandang[] }) {
  const [formData, setFormData] = useState({
    tagId: '',
    type: 'cows' as 'cows' | 'goat' | 'sheep',
    breed: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    weight: '',
    location: '',
    status: 'healthy' as 'healthy' | 'sick' | 'quarantine' | 'deceased',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await livestockService.create({
        ...formData,
        weight: parseFloat(formData.weight),
        dateOfBirth: new Date(formData.dateOfBirth),
      } as Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'>);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding livestock:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add New Livestock</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag ID *</label>
              <input
                type="text"
                required
                value={formData.tagId}
                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., COW-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'cows' | 'goat' | 'sheep' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="cows">Cows</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Breed *</label>
              <input
                type="text"
                required
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Angus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg) *</label>
              <input
                type="number"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 450"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location (Kandang) *</label>
            <select
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select Kandang</option>
              {kandangs.map(kandang => (
                <option key={kandang.id} value={kandang.name}>
                  {kandang.name} - {kandang.location || 'No location'}
                </option>
              ))}
            </select>
            {kandangs.length === 0 && (
              <p className="mt-1 text-xs text-orange-600">⚠️ No kandang available. Please add kandang first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Livestock'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLivestockModal({ animal, onClose, onSuccess, kandangs }: { animal: Livestock; onClose: () => void; onSuccess: () => void; kandangs: Kandang[] }) {
  const [formData, setFormData] = useState({
    tagId: animal.tagId,
    type: animal.type as 'cows' | 'goat' | 'sheep',
    breed: animal.breed,
    dateOfBirth: new Date(animal.dateOfBirth).toISOString().split('T')[0],
    gender: animal.gender as 'male' | 'female',
    weight: animal.weight.toString(),
    location: animal.location,
    status: animal.status as 'healthy' | 'sick' | 'quarantine' | 'deceased',
    notes: animal.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await livestockService.update(animal.id, {
        ...formData,
        weight: parseFloat(formData.weight),
        dateOfBirth: new Date(formData.dateOfBirth),
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating livestock:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Edit Livestock</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag ID *</label>
              <input
                type="text"
                required
                value={formData.tagId}
                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., COW-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'cows' | 'goat' | 'sheep' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="cows">Cows</option>
                <option value="goat">Goat</option>
                <option value="sheep">Sheep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Breed *</label>
              <input
                type="text"
                required
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., Angus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg) *</label>
              <input
                type="number"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 450"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location (Kandang) *</label>
              <select
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select Kandang</option>
                {kandangs.map(kandang => (
                  <option key={kandang.id} value={kandang.name}>
                    {kandang.name} - {kandang.location || 'No location'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'healthy' | 'sick' | 'quarantine' | 'deceased' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="healthy">Healthy</option>
                <option value="sick">Sick</option>
                <option value="quarantine">Quarantine</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Livestock'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
