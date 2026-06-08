'use client';

import React, { useEffect, useState } from 'react';
import { salesRecordService, livestockService, offerService } from '@/services/firestore.service';
import type { SalesRecord, Livestock, Offer } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';

export default function SalesPage() {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'sales' | 'offers'>('sales');
  const [filter, setFilter] = useState<string>('all');
  const [offerFilter, setOfferFilter] = useState<string>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SalesRecord | null>(null);
  const [actioningOfferId, setActioningOfferId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<Offer | null>(null);

  const formatMYR = (amount: number): string => {
    return `MYR ${amount.toLocaleString('en-MY')}`;
  };

  const getLivestockLabel = (livestockId: string): string => {
    const matchedAnimal = livestock.find(
      (animal) => animal.id === livestockId || animal.animalId === livestockId
    );

    if (!matchedAnimal) return livestockId;
    if (matchedAnimal.animalId && matchedAnimal.animalId !== 'N/A') {
      return formatAnimalDisplayName(matchedAnimal.type, matchedAnimal.animalId);
    }
    return matchedAnimal.rfid || matchedAnimal.id;
  };

  const getLivestockPhoto = (livestockId: string): string | null => {
    const matchedAnimal = livestock.find(
      (animal) => animal.id === livestockId || animal.animalId === livestockId
    );
    return matchedAnimal?.photoUrl ?? null;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [salesData, livestockData, offersData] = await Promise.all([
        salesRecordService.getAll(),
        livestockService.getAll(),
        offerService.getAll(),
      ]);
      setSales(salesData);
      setLivestock(livestockData);
      setOffers(offersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!confirm(`Accept offer of ${formatMYR(offer.offerAmount)} from ${offer.buyerName}? This will create a pending sale record.`)) return;
    setActioningOfferId(offer.id);
    try {
      await offerService.accept(offer);
      await loadData();
    } finally {
      setActioningOfferId(null);
    }
  };

  const handleRejectOffer = async (offer: Offer) => {
    if (!confirm(`Reject offer from ${offer.buyerName}?`)) return;
    setActioningOfferId(offer.id);
    try {
      await offerService.reject(offer.id);
      await loadData();
    } finally {
      setActioningOfferId(null);
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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sales & Offers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track livestock sales, payments, deliveries and buyer offers</p>
        </div>
        {mainTab === 'sales' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-emerald-500/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Sale
          </button>
        )}
      </div>

      {/* Main Tab Switch */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setMainTab('sales')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === 'sales' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Sales
          <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${mainTab === 'sales' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>{sales.length}</span>
        </button>
        <button
          onClick={() => setMainTab('offers')}
          className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab === 'offers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Offers
          <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${mainTab === 'offers' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>{offers.length}</span>
          {offers.filter(o => o.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
              {offers.filter(o => o.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'sales' && (
      <>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        <SalesStatCard label="Total Revenue" value={formatMYR(stats.totalRevenue)} val="text-emerald-700" img="/Sales/totalrevenues.png" />
        <SalesStatCard label="Pending Revenue" value={formatMYR(stats.pendingRevenue)} val="text-amber-700" img="/Sales/pendingsales.png" />
        <SalesStatCard label="Total Sales" value={String(stats.total)} val="text-blue-700" img="/Sales/totalsales.png" />
        <SalesStatCard label="Pending Deliveries" value={String(stats.pendingDeliveries)} val="text-orange-700" img="/Sales/pendingdeliveris.png" />
      </div>
      </>
      )}

      {mainTab === 'offers' && (
        <OffersSection
          offers={offers}
          offerFilter={offerFilter}
          setOfferFilter={setOfferFilter}
          actioningOfferId={actioningOfferId}
          onAccept={handleAcceptOffer}
          onReject={handleRejectOffer}
          onCounter={setCounterTarget}
          formatMYR={formatMYR}
        />
      )}

      {counterTarget && (
        <CounterOfferModal
          offer={counterTarget}
          onClose={() => setCounterTarget(null)}
          onSuccess={() => { setCounterTarget(null); loadData(); }}
        />
      )}

      {mainTab === 'offers' && null /* skip sales table */}
      {mainTab === 'sales' && (
      <>
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
          <>
          <div className="grid gap-3 p-4 xl:hidden">
            {filteredSales.map((sale) => {
              const deliveryInfo = getDeliveryBadge(sale.deliveryStatus);
              const photo = getLivestockPhoto(sale.livestockId);
              const label = getLivestockLabel(sale.livestockId);
              return (
                <div key={sale.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {photo ? (
                        <img
                          src={photo}
                          alt={label}
                          className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                          <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{sale.buyerName} · {sale.buyerContact}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedSale(sale); setShowEditModal(true); }}
                      className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      title="Edit sale"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amount</p>
                      <p className="mt-1 text-base font-extrabold text-emerald-700">{formatMYR(sale.price)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Date</p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {new Date(sale.saleDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize ${getPaymentBadge(sale.paymentStatus)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        sale.paymentStatus === 'completed' ? 'bg-emerald-500' :
                        sale.paymentStatus === 'partial' ? 'bg-blue-500' : 'bg-amber-500'
                      }`} />
                      {sale.paymentStatus}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold capitalize ${deliveryInfo.bg}`}>
                      <span>{deliveryInfo.icon}</span>
                      {sale.deliveryStatus.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-[980px] w-full text-sm">
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
                          {getLivestockPhoto(sale.livestockId) ? (
                            <img
                              src={getLivestockPhoto(sale.livestockId)!}
                              alt={getLivestockLabel(sale.livestockId)}
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                              </svg>
                            </div>
                          )}
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
          </>
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
      </>
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


function OffersSection({
  offers,
  offerFilter,
  setOfferFilter,
  actioningOfferId,
  onAccept,
  onReject,
  onCounter,
  formatMYR,
}: {
  offers: Offer[];
  offerFilter: string;
  setOfferFilter: (v: string) => void;
  actioningOfferId: string | null;
  onAccept: (o: Offer) => void;
  onReject: (o: Offer) => void;
  onCounter: (o: Offer) => void;
  formatMYR: (n: number) => string;
}) {
  const statusFilters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'countered', label: 'Countered' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const filtered = offerFilter === 'all' ? offers : offers.filter(o => o.status === offerFilter);

  const counts: Record<string, number> = {
    all: offers.length,
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    countered: offers.filter(o => o.status === 'countered').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      countered: 'bg-blue-100 text-blue-700',
      expired: 'bg-gray-100 text-gray-500',
    };
    return map[status] || map.pending;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setOfferFilter(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                offerFilter === f.value ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                offerFilter === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 font-medium">{filtered.length} offer{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Offer Cards */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">No offers found</h3>
          <p className="text-xs text-gray-400">Buyer offers will appear here once submitted</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((offer) => (
            <div key={offer.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
              {/* Animal thumbnail */}
              <div className="shrink-0">
                {offer.livestockPhotoUrl ? (
                  <img src={offer.livestockPhotoUrl} alt={offer.livestockDisplayName} className="h-12 w-12 rounded-xl object-cover border border-slate-100" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-gray-900 truncate">{offer.livestockDisplayName || offer.livestockId}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize ${statusBadge(offer.status)}`}>{offer.status}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{offer.buyerName} · {offer.buyerContact}</p>
                {offer.message && <p className="text-xs text-gray-400 italic mt-0.5 truncate">&ldquo;{offer.message}&rdquo;</p>}
                {offer.status === 'countered' && offer.counterAmount != null && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">Counter: {formatMYR(offer.counterAmount)}{offer.counterMessage ? ` — ${offer.counterMessage}` : ''}</p>
                )}
              </div>

              {/* Amount + date */}
              <div className="text-right shrink-0">
                <p className="text-base font-extrabold text-amber-600">{formatMYR(offer.offerAmount)}</p>
                {offer.listedPrice != null && (
                  <p className="text-[11px] text-gray-400">Listed: {formatMYR(offer.listedPrice)}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(offer.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Actions — only for pending */}
              {offer.status === 'pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onAccept(offer)}
                    disabled={actioningOfferId === offer.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onCounter(offer)}
                    disabled={actioningOfferId === offer.id}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Counter
                  </button>
                  <button
                    onClick={() => onReject(offer)}
                    disabled={actioningOfferId === offer.id}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CounterOfferModal({ offer, onClose, onSuccess }: { offer: Offer; onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const formatMYR = (n: number) => `MYR ${n.toLocaleString('en-MY')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    try {
      await offerService.counter(offer.id, parsed, message.trim() || undefined);
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Counter Offer</h2>
            <p className="text-xs text-gray-400 mt-0.5">Buyer offered {formatMYR(offer.offerAmount)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Counter Amount (MYR) *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. 1800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Reason for counter offer..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Sending...' : 'Send Counter'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SalesStatCard({ label, value, val, img }: {
  label: string; value: string; val: string; img: string;
}) {
  return (
    <div className="grid h-full min-h-[132px] grid-cols-[88px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:grid-cols-[104px_minmax(0,1fr)] xl:grid-cols-[92px_minmax(0,1fr)] 2xl:grid-cols-[104px_minmax(0,1fr)]">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24 xl:h-20 xl:w-20 2xl:h-24 2xl:w-24">
        <img src={img} alt={label} className="h-full w-full object-contain drop-shadow-sm" />
      </div>
      <div className="min-w-0">
        <p className={`break-words text-xl font-extrabold leading-tight tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl ${val}`}>{value}</p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-500">{label}</p>
      </div>
    </div>
  );
}
