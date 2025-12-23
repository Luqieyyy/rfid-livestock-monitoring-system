'use client';

import { useEffect, useState } from 'react';
import { breedingRecordService, livestockService } from '@/services/firestore.service';
import type { BreedingRecord, Livestock } from '@/types/livestock.types';

export default function BreedingPage() {
  const [records, setRecords] = useState<BreedingRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsData, livestockData] = await Promise.all([
        breedingRecordService.getAll(),
        livestockService.getAll(),
      ]);
      setRecords(recordsData);
      setLivestock(livestockData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter((r) => r.status === filter);

  const stats = {
    total: records.length,
    planned: records.filter(r => r.status === 'planned').length,
    pregnant: records.filter(r => r.status === 'pregnant').length,
    delivered: records.filter(r => r.status === 'delivered').length,
    failed: records.filter(r => r.status === 'failed').length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      planned: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      pregnant: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return colors[status] || colors.planned;
  };

  const getDaysUntilDelivery = (expectedDate: Date) => {
    const today = new Date();
    const expected = new Date(expectedDate);
    const diff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading breeding records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Breeding Management</h1>
          <p className="text-gray-500 mt-1">Track breeding cycles, pregnancies, and offspring</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Breeding Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🧬</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
              <p className="text-sm text-gray-500">Planned</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🤰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.pregnant}</p>
              <p className="text-sm text-gray-500">Pregnant</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🐣</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Delivered</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Records' },
            { value: 'planned', label: 'Planned' },
            { value: 'pregnant', label: 'Pregnant' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === tab.value
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      {filteredRecords.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const statusColor = getStatusColor(record.status);
            const daysUntil = record.status === 'pregnant' ? getDaysUntilDelivery(record.expectedDeliveryDate) : null;
            
            return (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center text-2xl">
                      🧬
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Breeding #{record.id?.slice(-6)}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(record.breedingDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`}></span>
                    {record.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-pink-50 rounded-xl p-3">
                    <p className="text-xs text-pink-600 mb-1">Mother</p>
                    <p className="font-semibold text-pink-700">{record.motherId}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">Father</p>
                    <p className="font-semibold text-blue-700">{record.fatherId || 'Unknown'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expected Delivery</span>
                    <span className="font-medium text-gray-900">
                      {new Date(record.expectedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                  {record.actualDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Actual Delivery</span>
                      <span className="font-medium text-gray-900">
                        {new Date(record.actualDeliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {record.numberOfOffspring !== undefined && record.numberOfOffspring > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Offspring</span>
                      <span className="font-medium text-emerald-600">
                        {record.numberOfOffspring} 🐣
                      </span>
                    </div>
                  )}
                </div>

                {daysUntil !== null && daysUntil > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-amber-700">Days until delivery</span>
                      <span className="font-bold text-amber-700">{daysUntil} days</span>
                    </div>
                    <div className="mt-2 h-2 bg-amber-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, (1 - daysUntil / 280) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {record.notes && (
                  <p className="mt-4 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl">
                    {record.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🧬</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No breeding records found</h3>
          <p className="text-gray-500 mb-6">Start tracking your livestock breeding by adding a new record</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Record
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddBreedingModal 
          livestock={livestock}
          onClose={() => setShowAddModal(false)} 
          onSuccess={loadData} 
        />
      )}
    </div>
  );
}

function AddBreedingModal({ livestock, onClose, onSuccess }: { 
  livestock: Livestock[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const females = livestock.filter(l => l.gender === 'female');
  const males = livestock.filter(l => l.gender === 'male');

  const [formData, setFormData] = useState({
    motherId: '',
    fatherId: '',
    breedingDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    method: 'natural',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await breedingRecordService.create({
        motherId: formData.motherId,
        fatherId: formData.fatherId || undefined,
        breedingDate: new Date(formData.breedingDate),
        expectedDeliveryDate: new Date(formData.expectedDeliveryDate),
        status: 'planned',
        notes: formData.notes || undefined,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding record:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">New Breeding Record</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mother (Female) *</label>
              <select
                required
                value={formData.motherId}
                onChange={(e) => setFormData({ ...formData, motherId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select mother</option>
                {females.map((animal) => (
                  <option key={animal.id} value={animal.id}>{animal.tagId} - {animal.breed}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Father (Male)</label>
              <select
                value={formData.fatherId}
                onChange={(e) => setFormData({ ...formData, fatherId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select father (optional)</option>
                {males.map((animal) => (
                  <option key={animal.id} value={animal.id}>{animal.tagId} - {animal.breed}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Breeding Date *</label>
              <input
                type="date"
                required
                value={formData.breedingDate}
                onChange={(e) => setFormData({ ...formData, breedingDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Delivery *</label>
              <input
                type="date"
                required
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Breeding Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="natural">Natural</option>
              <option value="artificial">Artificial Insemination</option>
            </select>
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
              {saving ? 'Saving...' : 'Create Record'}
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
