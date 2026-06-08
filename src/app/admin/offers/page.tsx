'use client';

import React, { useEffect, useState } from 'react';
import { offerService } from '@/services/firestore.service';
import type { Offer } from '@/types/livestock.types';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [counterTarget, setCounterTarget] = useState<Offer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await offerService.getAll();
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMYR = (amount: number): string => `MYR ${amount.toLocaleString('en-MY')}`;

  const filteredOffers = filter === 'all' ? offers : offers.filter((o) => o.status === filter);

  const tabCounts: Record<string, number> = {
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    countered: offers.filter((o) => o.status === 'countered').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
  };

  const stats = {
    pending: tabCounts.pending,
    accepted: tabCounts.accepted,
    pendingValue: offers.filter((o) => o.status === 'pending').reduce((sum, o) => sum + o.offerAmount, 0),
    total: offers.length,
  };

  const getStatusBadge = (status: Offer['status']) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      countered: 'bg-blue-100 text-blue-700',
      expired: 'bg-slate-100 text-slate-500',
    };
    return styles[status] || styles.pending;
  };

  const handleAccept = async (offer: Offer) => {
    if (!confirm(`Accept offer of ${formatMYR(offer.offerAmount)} from ${offer.buyerName}? This will create a pending sale record.`)) return;
    setActioningId(offer.id);
    try {
      await offerService.accept(offer);
      await loadData();
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (offer: Offer) => {
    if (!confirm(`Reject offer of ${formatMYR(offer.offerAmount)} from ${offer.buyerName}?`)) return;
    setActioningId(offer.id);
    try {
      await offerService.reject(offer.id);
      await loadData();
    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert('Failed to reject offer. Please try again.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Loading offers...</p>
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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Offers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Review and respond to purchase offers from buyers</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        <OfferStatCard label="Pending Offers" value={String(stats.pending)} valClass="text-amber-700" iconBg="bg-amber-50" icon={
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } />
        <OfferStatCard label="Accepted" value={String(stats.accepted)} valClass="text-emerald-700" iconBg="bg-emerald-50" icon={
          <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" /></svg>
        } />
        <OfferStatCard label="Pending Offer Value" value={formatMYR(stats.pendingValue)} valClass="text-blue-700" iconBg="bg-blue-50" icon={
          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        } />
        <OfferStatCard label="Total Offers" value={String(stats.total)} valClass="text-slate-700" iconBg="bg-slate-100" icon={
          <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
        } />
      </div>

      {/* List Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'countered', label: 'Countered' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === tab.value ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
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
          <p className="text-xs text-gray-400 font-medium">{filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Offer cards */}
        {filteredOffers.length > 0 ? (
          <div className="grid gap-3 p-4">
            {filteredOffers.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {offer.livestockPhotoUrl ? (
                      <img src={offer.livestockPhotoUrl} alt={offer.livestockDisplayName ?? offer.livestockId} className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                        <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{offer.livestockDisplayName ?? offer.livestockId}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadge(offer.status)}`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{offer.buyerName} · {offer.buyerContact}</p>
                      {offer.message && (
                        <p className="mt-1.5 text-xs text-slate-500 italic">&ldquo;{offer.message}&rdquo;</p>
                      )}
                      {offer.status === 'countered' && offer.counterAmount != null && (
                        <p className="mt-1.5 text-xs font-medium text-blue-600">
                          Counter offer sent: {formatMYR(offer.counterAmount)}
                          {offer.counterMessage && <span className="text-slate-400"> — &ldquo;{offer.counterMessage}&rdquo;</span>}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start sm:items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-emerald-700">{formatMYR(offer.offerAmount)}</p>
                      {offer.listedPrice != null && (
                        <p className="text-[11px] text-slate-400">Listed at {formatMYR(offer.listedPrice)}</p>
                      )}
                    </div>
                    {offer.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(offer)}
                          disabled={actioningId === offer.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setCounterTarget(offer)}
                          disabled={actioningId === offer.id}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-60"
                        >
                          Counter
                        </button>
                        <button
                          onClick={() => handleReject(offer)}
                          disabled={actioningId === offer.id}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 mb-3">
              <svg className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">No offers found</p>
            <p className="mt-1 text-xs text-slate-400">Offers from buyers will appear here once submitted.</p>
          </div>
        )}
      </div>

      {counterTarget && (
        <CounterOfferModal
          offer={counterTarget}
          onClose={() => setCounterTarget(null)}
          onSuccess={() => { setCounterTarget(null); loadData(); }}
        />
      )}
    </div>
  );
}

function OfferStatCard({ label, value, valClass, iconBg, icon }: {
  label: string; value: string; valClass: string; iconBg: string; icon: React.ReactNode;
}) {
  return (
    <div className="grid h-full min-h-[112px] grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`break-words text-xl font-extrabold leading-tight tabular-nums ${valClass}`}>{value}</p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function CounterOfferModal({ offer, onClose, onSuccess }: { offer: Offer; onClose: () => void; onSuccess: () => void }) {
  const [counterAmount, setCounterAmount] = useState(String(offer.offerAmount));
  const [counterMessage, setCounterMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid counter offer amount.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await offerService.counter(offer.id, amount, counterMessage.trim() || undefined);
      onSuccess();
    } catch {
      setError('Failed to send counter offer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Send Counter Offer</h3>
            <p className="mt-0.5 text-sm text-slate-500">
              {offer.livestockDisplayName} · {offer.buyerName} offered <span className="font-semibold text-slate-700">MYR {offer.offerAmount.toLocaleString('en-MY')}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Counter Amount (RM)</label>
            <input
              type="number"
              min={1}
              value={counterAmount}
              onChange={(e) => setCounterAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Message (optional)</label>
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              rows={3}
              placeholder="Explain your counter offer to the buyer..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Sending...' : 'Send Counter Offer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
