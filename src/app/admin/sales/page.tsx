'use client';

import { useEffect, useState } from 'react';
import { salesRecordService, livestockService } from '@/services/firestore.service';
import type { SalesRecord, Livestock } from '@/types/livestock.types';

export default function SalesPage() {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading sales records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-500 mt-1">Track livestock sales, payments, and deliveries</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Sale
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Total</span>
          </div>
          <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          <p className="text-emerald-100 text-sm mt-1">Total Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">${stats.pendingRevenue.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Pending Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-gray-500 text-sm mt-1">Total Sales</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            {stats.pendingDeliveries > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                Action needed
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
          <p className="text-gray-500 text-sm mt-1">Pending Deliveries</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'All Sales' },
            { value: 'pending', label: 'Pending Payment' },
            { value: 'partial', label: 'Partial Payment' },
            { value: 'completed', label: 'Completed' },
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

      {/* Sales List */}
      {filteredSales.length > 0 ? (
        <div className="space-y-4">
          {filteredSales.map((sale) => {
            const deliveryInfo = getDeliveryBadge(sale.deliveryStatus);
            return (
              <div key={sale.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-emerald-200 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Main Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-2xl">
                      💵
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">Livestock: {sale.livestockId}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentBadge(sale.paymentStatus)}`}>
                          {sale.paymentStatus}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Sold on {new Date(sale.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">Buyer</p>
                    <p className="font-semibold text-gray-900">{sale.buyerName}</p>
                    <p className="text-sm text-gray-500">{sale.buyerContact}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right lg:text-center">
                    <p className="text-xs text-gray-400 mb-1">Amount</p>
                    <p className="text-2xl font-bold text-emerald-600">${sale.price.toLocaleString()}</p>
                  </div>

                  {/* Delivery Status */}
                  <div className={`px-4 py-3 rounded-xl border ${deliveryInfo.bg} flex items-center gap-2`}>
                    <span className="text-xl">{deliveryInfo.icon}</span>
                    <div>
                      <p className="text-xs opacity-70">Delivery</p>
                      <p className="font-medium capitalize">{sale.deliveryStatus}</p>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowEditModal(true);
                    }}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"
                    title="Edit sale"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                {sale.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      {sale.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales records found</h3>
          <p className="text-gray-500 mb-6">Start tracking your sales by recording a new transaction</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record First Sale
          </button>
        </div>
      )}

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
              {availableLivestock.map((animal) => (
                <option key={animal.id} value={animal.id}>{animal.tagId} - {animal.breed} ({animal.weight}kg)</option>
              ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price ($) *</label>
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
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
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
              {livestock.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.tagId} - {animal.breed} ({animal.weight}kg)
                </option>
              ))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Price ($) *</label>
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
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, deliveryStatus: e.target.value })}
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
