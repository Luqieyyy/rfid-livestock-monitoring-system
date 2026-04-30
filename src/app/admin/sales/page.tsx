'use client';

import { useEffect, useState } from 'react';
import { salesRecordService, livestockService } from '@/services/firestore.service';
import type { SalesRecord, Livestock } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';

export default function SalesPage() {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null);

  const formatMYR = (amount: number): string => {
    return `MYR ${amount.toLocaleString('en-MY')}`;
  };

  const getLivestockLabel = (livestockId: string): string => {
    const matchedAnimal = livestock.find(
      (animal) => animal.id === livestockId || animal.animalId === livestockId
    );

    if (!matchedAnimal) {
      return livestockId;
    }

    if (matchedAnimal.animalId && matchedAnimal.animalId !== 'N/A') {
      return formatAnimalDisplayName(matchedAnimal.type, matchedAnimal.animalId);
    }

    return matchedAnimal.rfid || matchedAnimal.id;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, livestockData] = await Promise.all([
        salesRecordService.getAll(),
        livestockService.getAll(),
      ]);
      setSales(salesData);
      setLivestock(livestockData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = filter === 'all'
    ? sales
    : sales.filter((s) => s.paymentStatus === filter);

  const stats = {
    total: sales.length,
    totalRevenue: sales.filter(s => s.paymentStatus === 'completed').reduce((sum, s) => sum + s.price, 0),
    pendingRevenue: sales.filter(s => s.paymentStatus === 'pending' || s.paymentStatus === 'partial').reduce((sum, s) => sum + s.price, 0),
    pendingDeliveries: sales.filter(s => s.deliveryStatus === 'pending').length,
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      partial: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.pending;
  };

  const getDeliveryBadge = (status: string) => {
    const styles: Record<string, { bg: string; icon: string }> = {
      pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '📦' },
      'in-transit': { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🚚' },
      delivered: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✅' },
    };
    return styles[status] || styles.pending;
  };

  const tabCounts: Record<string, number> = {
    all: sales.length,
    pending: sales.filter(s => s.paymentStatus === 'pending').length,
    partial: sales.filter(s => s.paymentStatus === 'partial').length,
    completed: sales.filter(s => s.paymentStatus === 'completed').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Loading sales records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-1">Finance</p>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sales Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track livestock sales, payments, and deliveries</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Sale
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/5 rounded-full" />
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-extrabold tracking-tight">{formatMYR(stats.totalRevenue)}</p>
          <p className="text-emerald-100 text-xs font-medium mt-1">Total Revenue</p>
        </div>

        {/* Pending Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {stats.pendingRevenue > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Pending</span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{formatMYR(stats.pendingRevenue)}</p>
          <p className="text-gray-400 text-xs font-medium mt-1">Pending Revenue</p>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-4.5 h-4.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.total}</p>
          <p className="text-gray-400 text-xs font-medium mt-1">Total Sales</p>
        </div>

        {/* Pending Deliveries */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            {stats.pendingDeliveries > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-wide">Action needed</span>
            )}
          </div>
          <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{stats.pendingDeliveries}</p>
          <p className="text-gray-400 text-xs font-medium mt-1">Pending Deliveries</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  filter === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tabCounts[tab.value]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">{filteredSales.length} record{filteredSales.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Table */}
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Livestock</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Buyer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivery</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSales.map((sale) => {
                  const deliveryInfo = getDeliveryBadge(sale.deliveryStatus);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Livestock */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-[13px]">{getLivestockLabel(sale.livestockId)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Buyer */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-800 text-[13px]">{sale.buyerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{sale.buyerContact}</p>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4">
                        <p className="text-gray-600 text-[13px]">
                          {new Date(sale.saleDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <p className="font-bold text-emerald-600 text-[15px] tracking-tight">{formatMYR(sale.price)}</p>
                      </td>

                      {/* Payment Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${getPaymentBadge(sale.paymentStatus)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            sale.paymentStatus === 'completed' ? 'bg-emerald-500' :
                            sale.paymentStatus === 'partial' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          {sale.paymentStatus}
                        </span>
                      </td>

                      {/* Delivery Badge */}
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize ${deliveryInfo.bg}`}>
                          <span>{deliveryInfo.icon}</span>
                          {sale.deliveryStatus.replace('-', ' ')}
                        </span>
                      </td>

                      {/* Edit */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => { setSelectedSale(sale); setShowEditModal(true); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Edit sale"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">No records found</h3>
            <p className="text-xs text-gray-400 mb-5">Record a new sale to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Sale
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddSaleModal 
          livestock={livestock}
          onClose={() => setShowAddModal(false)} 
          onSuccess={loadData} 
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSale && (
        <EditSaleModal
          sale={selectedSale}
          livestock={livestock}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSale(null);
          }}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

function AddSaleModal({ livestock, onClose, onSuccess }: { 
  livestock: Livestock[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const availableLivestock = livestock.filter(l => l.status === 'healthy');

  const [formData, setFormData] = useState({
    livestockId: '',
    buyerName: '',
    buyerContact: '',
    price: '',
    saleDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'pending',
    deliveryStatus: 'pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await salesRecordService.create({
        ...formData,
        price: parseFloat(formData.price),
        saleDate: new Date(formData.saleDate),
      } as Omit<SalesRecord, 'id' | 'createdAt'>);

      // Mark livestock as sold when payment is completed
      if (formData.paymentStatus === 'completed' && formData.livestockId) {
        await livestockService.update(formData.livestockId, { status: 'sold' });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding sale:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Record New Sale</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Livestock *</label>
            <select
              required
              value={formData.livestockId}
              onChange={(e) => setFormData({ ...formData, livestockId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select livestock to sell</option>
              {availableLivestock.map((animal) => {
                const animalLabel = animal.animalId && animal.animalId !== 'N/A'
                  ? formatAnimalDisplayName(animal.type, animal.animalId)
                  : animal.rfid;

                return (
                  <option key={animal.id} value={animal.id}>{animalLabel} - {animal.breed} ({animal.weight}kg)</option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Buyer Name *</label>
              <input
                type="text"
                required
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact *</label>
              <input
                type="text"
                required
                value={formData.buyerContact}
                onChange={(e) => setFormData({ ...formData, buyerContact: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price (MYR) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Date *</label>
              <input
                type="date"
                required
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as SalesRecord['paymentStatus'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="pending">⏳ Pending</option>
                <option value="partial">💳 Partial</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Status</label>
              <select
                value={formData.deliveryStatus}
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value as SalesRecord['deliveryStatus'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="pending">📦 Pending</option>
                <option value="in-transit">🚚 In Transit</option>
                <option value="delivered">✅ Delivered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
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
              {saving ? 'Recording...' : 'Record Sale'}
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

function EditSaleModal({ sale, livestock, onClose, onSuccess }: { 
  sale: SalesRecord;
  livestock: Livestock[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    livestockId: sale.livestockId,
    buyerName: sale.buyerName,
    buyerContact: sale.buyerContact,
    price: sale.price.toString(),
    saleDate: new Date(sale.saleDate).toISOString().split('T')[0],
    paymentStatus: sale.paymentStatus,
    deliveryStatus: sale.deliveryStatus,
    notes: sale.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await salesRecordService.update(sale.id, {
        ...formData,
        price: parseFloat(formData.price),
        saleDate: new Date(formData.saleDate),
      });

      // Sync livestock status based on payment status change
      if (formData.livestockId) {
        const wasCompleted = sale.paymentStatus === 'completed';
        const isNowCompleted = formData.paymentStatus === 'completed';

        if (!wasCompleted && isNowCompleted) {
          // Payment just completed → mark sold
          await livestockService.update(formData.livestockId, { status: 'sold' });
        } else if (wasCompleted && !isNowCompleted) {
          // Payment reverted (e.g. cancelled) → revert to healthy
          await livestockService.update(formData.livestockId, { status: 'healthy' });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating sale:', error);
      alert('Failed to update sale record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Sale Record</h2>
              <p className="text-sm text-gray-500 mt-1">Update payment and delivery status</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Livestock *</label>
            <select
              required
              value={formData.livestockId}
              onChange={(e) => setFormData({ ...formData, livestockId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select livestock</option>
              {livestock.map((animal) => {
                const animalLabel = animal.animalId && animal.animalId !== 'N/A'
                  ? formatAnimalDisplayName(animal.type, animal.animalId)
                  : animal.rfid;

                return (
                  <option key={animal.id} value={animal.id}>
                    {animalLabel} - {animal.breed} ({animal.weight}kg)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Buyer Name *</label>
              <input
                type="text"
                required
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact *</label>
              <input
                type="text"
                required
                value={formData.buyerContact}
                onChange={(e) => setFormData({ ...formData, buyerContact: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Phone or email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price (MYR) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Date *</label>
              <input
                type="date"
                required
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Status *</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as SalesRecord['paymentStatus'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">⏳ Pending</option>
                <option value="partial">💳 Partial</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Status *</label>
              <select
                value={formData.deliveryStatus}
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value as SalesRecord['deliveryStatus'] })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">📦 Pending</option>
                <option value="in-transit">🚚 In Transit</option>
                <option value="delivered">✅ Delivered</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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
