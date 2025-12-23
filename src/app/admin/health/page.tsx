'use client';

import { useEffect, useState } from 'react';
import { healthRecordService, livestockService } from '@/services/firestore.service';
import type { HealthRecord, Livestock } from '@/types/livestock.types';

export default function HealthPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
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
        healthRecordService.getRecent(90),
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
    : records.filter((r: HealthRecord) => r.type === filter);

  const stats = {
    total: records.length,
    vaccinations: records.filter(r => r.type === 'vaccination').length,
    treatments: records.filter(r => r.type === 'treatment').length,
    checkups: records.filter(r => r.type === 'checkup').length,
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, { icon: string; bg: string }> = {
      vaccination: { icon: '💉', bg: 'from-blue-100 to-indigo-100' },
      treatment: { icon: '💊', bg: 'from-red-100 to-pink-100' },
      checkup: { icon: '🩺', bg: 'from-emerald-100 to-teal-100' },
      diagnosis: { icon: '📋', bg: 'from-amber-100 to-orange-100' },
    };
    return icons[type] || icons.checkup;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading health records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
          <p className="text-gray-500 mt-1">Track veterinary care, vaccinations, and treatments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Record
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Records</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💉</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.vaccinations}</p>
              <p className="text-sm text-gray-500">Vaccinations</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.treatments}</p>
              <p className="text-sm text-gray-500">Treatments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🩺</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{stats.checkups}</p>
              <p className="text-sm text-gray-500">Checkups</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Records', icon: '📋' },
            { value: 'vaccination', label: 'Vaccinations', icon: '💉' },
            { value: 'treatment', label: 'Treatments', icon: '💊' },
            { value: 'checkup', label: 'Checkups', icon: '🩺' },
            { value: 'diagnosis', label: 'Diagnosis', icon: '🔍' },
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
              <span className="flex items-center gap-1.5">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map((record) => {
            const typeInfo = getTypeIcon(record.type);
            return (
              <div key={record.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 bg-gradient-to-br ${typeInfo.bg} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                      {typeInfo.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">Animal ID: {record.livestockId}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          record.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          record.status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-1">{record.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-6 lg:gap-8 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Type</p>
                      <p className="font-medium text-gray-900 capitalize">{record.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Date</p>
                      <p className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                    </div>
                    {record.veterinarian && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Veterinarian</p>
                        <p className="font-medium text-gray-900">{record.veterinarian}</p>
                      </div>
                    )}
                    {record.medication && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Medication</p>
                        <p className="font-medium text-gray-900">{record.medication}</p>
                      </div>
                    )}
                    {record.nextCheckup && (
                      <div className="bg-amber-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-amber-600 mb-0.5">Next Checkup</p>
                        <p className="font-medium text-amber-700">{new Date(record.nextCheckup).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🩺</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No health records found</h3>
          <p className="text-gray-500 mb-6">Start tracking your livestock health by adding a new record</p>
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
        <AddHealthRecordModal 
          livestock={livestock}
          onClose={() => setShowAddModal(false)} 
          onSuccess={loadData} 
        />
      )}
    </div>
  );
}

function AddHealthRecordModal({ livestock, onClose, onSuccess }: { 
  livestock: Livestock[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    livestockId: '',
    type: 'checkup',
    description: '',
    date: new Date().toISOString().split('T')[0],
    veterinarian: '',
    medication: '',
    dosage: '',
    nextCheckup: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await healthRecordService.create({
        ...formData,
        date: new Date(formData.date),
        nextCheckup: formData.nextCheckup ? new Date(formData.nextCheckup) : undefined,
        status: 'completed',
      } as Omit<HealthRecord, 'id' | 'createdAt'>);
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
            <h2 className="text-xl font-bold text-gray-900">Add Health Record</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Livestock *</label>
              <select
                required
                value={formData.livestockId}
                onChange={(e) => setFormData({ ...formData, livestockId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select animal</option>
                {livestock.map((animal) => (
                  <option key={animal.id} value={animal.id}>{animal.tagId} - {animal.breed}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="checkup">🩺 Checkup</option>
                <option value="vaccination">💉 Vaccination</option>
                <option value="treatment">💊 Treatment</option>
                <option value="diagnosis">🔍 Diagnosis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Describe the health record..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Veterinarian</label>
              <input
                type="text"
                value={formData.veterinarian}
                onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Dr. Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Medication</label>
              <input
                type="text"
                value={formData.medication}
                onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Medication name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Next Checkup</label>
              <input
                type="date"
                value={formData.nextCheckup}
                onChange={(e) => setFormData({ ...formData, nextCheckup: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Record'}
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
