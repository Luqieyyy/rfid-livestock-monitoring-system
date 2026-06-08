'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { offerService } from '@/services/firestore.service';
import type { Livestock } from '@/types/livestock.types';
import { formatAnimalDisplayName } from '@/utils/helpers';

export function calculateAge(dateOfBirth: Date): string {
  const now = new Date();
  const dob = new Date(dateOfBirth);
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`;
  if (months > 0) return `${months} month${months !== 1 ? 's' : ''}`;
  const days = Math.floor((now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? 's' : ''}`;
}

export function AnimalDetailModal({ animal, onClose }: { animal: Livestock; onClose: () => void }) {
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleChatWithOwner = () => {
    const typeName = animal.type === 'cow' ? 'lembu' : animal.type === 'goat' ? 'kambing' : animal.type;
    const priceText = animal.price != null ? `\nHarga yang tertera: RM ${animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '';
    const message = `Assalamualaikum, saya berminat untuk membeli ${typeName} baka ${animal.breed} (ID: ${animal.animalId}).\n\nMaklumat haiwan:\n- Berat: ${animal.weight} kg\n- Jantina: ${animal.gender === 'male' ? 'Jantan' : 'Betina'}${priceText}\n\nBoleh saya dapatkan maklumat lanjut?\n\nTerima kasih.`;
    window.open(`https://wa.me/60173743683?text=${encodeURIComponent(message)}`, '_blank');
  };

  const w = Number(animal.weight) || 0;
  const isCow = animal.type === 'cow';
  const daging = +(w * (isCow ? 0.385 : 0.30)).toFixed(1);
  const tulang = +(w * 0.11).toFixed(1);
  const lemak = +(w * (isCow ? 0.065 : 0.07)).toFixed(1);

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[28px] max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl ring-1 ring-black/5" onClick={(e) => e.stopPropagation()}>
        {/* Hero */}
        <div className="relative h-56 sm:h-64 overflow-hidden rounded-t-[28px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950">
          <img
            src={animal.photoUrl || (animal.type === 'cow' ? '/cow.jpg' : '/goat.png')}
            alt={animal.breed}
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-full border border-white/15 bg-white/18 p-2 backdrop-blur-md transition-colors hover:bg-white/28"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-950 shadow-sm shadow-emerald-950/20">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
              <span className="text-white/70 text-xs">RFID: {animal.rfid || 'N/A'}</span>
            </div>
            <div className="inline-flex max-w-full flex-col gap-1 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md shadow-xl shadow-black/25">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {formatAnimalDisplayName(animal.type, animal.animalId)}
              </h2>
              <p className="text-sm leading-none capitalize text-white/85">{animal.breed} • {animal.type}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Price */}
          {animal.price != null && (
            <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Harga Jualan</p>
                <p className="text-3xl font-bold text-emerald-700 mt-0.5">RM {animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatChip label="Weight" value={`${animal.weight} kg`} />
            <StatChip label="Age" value={calculateAge(animal.dateOfBirth)} />
            <StatChip label="Gender" value={animal.gender} capitalize />
            <StatChip label="Location" value={animal.location} />
          </div>

          {/* Profile */}
          <Section title="Animal Profile">
            <div className="grid sm:grid-cols-2 gap-2.5">
              <InfoRow label="Date of Birth" value={new Date(animal.dateOfBirth).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <InfoRow label="Health Status" value={animal.status} valueClass="text-emerald-600 capitalize" />
              <InfoRow label="Animal ID" value={animal.animalId} />
              <InfoRow label="RFID" value={animal.rfid || 'N/A'} />
              <InfoRow label="Breed" value={animal.breed} valueClass="capitalize" />
            </div>
          </Section>

          {/* Yield estimation */}
          {w > 0 && (
            <Section title={`Estimated Yield (${isCow ? 'Lembu' : 'Kambing'})`}>
              <p className="text-xs text-slate-500 -mt-2 mb-3">Berdasarkan berat hidup <span className="font-semibold text-slate-700">{animal.weight} kg</span></p>
              <div className="grid grid-cols-3 gap-3">
                <YieldChip label="Daging" value={daging} color="text-emerald-600" />
                <YieldChip label="Tulang" value={tulang} color="text-amber-500" />
                <YieldChip label="Lemak" value={lemak} color="text-orange-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-3">* Anggaran sahaja. Hasil sebenar bergantung kepada pemotongan dan kondisi haiwan.</p>
            </Section>
          )}

          {/* Health certification */}
          <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 mb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900">Health Certified</h4>
              <p className="text-sm text-emerald-700/90 mt-0.5">This animal has passed all health verification requirements and is ready for purchase.</p>
            </div>
          </div>

          {animal.notes && (
            <Section title="Additional Notes">
              <p className="text-sm text-slate-600 leading-relaxed">{animal.notes}</p>
            </Section>
          )}
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white/95 backdrop-blur p-5 sm:p-6 rounded-b-[28px]">
          <button
            type="button"
            onClick={() => setShowOfferModal(true)}
            className="flex-1 px-6 py-3.5 bg-white border-2 border-emerald-600 text-emerald-700 rounded-xl font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Make an Offer
          </button>
          <button
            type="button"
            onClick={handleChatWithOwner}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.86-.87 2.07 0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.53.07-.26-.13-1.06-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01z"/>
            </svg>
            Chat with Owner
          </button>
        </div>
      </div>

      {showOfferModal && (
        <MakeOfferModal animal={animal} onClose={() => setShowOfferModal(false)} />
      )}
    </div>,
    document.body
  );
}

function MakeOfferModal({ animal, onClose }: { animal: Livestock; onClose: () => void }) {
  const { user } = useAuth();
  const [offerAmount, setOfferAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyerName = user?.displayName || 'Buyer';
  const buyerContact = user?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) { setError('Sila isi jumlah tawaran yang sah.'); return; }
    setError(null);
    setSubmitting(true);
    try {
      await offerService.create({
        livestockId: animal.id,
        livestockDisplayName: formatAnimalDisplayName(animal.type, animal.animalId),
        livestockPhotoUrl: animal.photoUrl,
        buyerId: user?.uid,
        buyerName,
        buyerContact,
        offerAmount: amount,
        listedPrice: animal.price,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
    } catch {
      setError('Gagal menghantar tawaran. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-[24px] bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tawaran Dihantar!</h3>
            <p className="mt-1.5 text-sm text-slate-500">
              Tawaran RM {Number(offerAmount).toLocaleString('en-MY')} untuk {formatAnimalDisplayName(animal.type, animal.animalId)} telah dihantar kepada penjual.
            </p>
            <button type="button" onClick={onClose} className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Make an Offer</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {formatAnimalDisplayName(animal.type, animal.animalId)}
                  {animal.price != null && (
                    <> · Harga tertera <span className="font-semibold text-emerald-600">RM {animal.price.toLocaleString('en-MY')}</span></>
                  )}
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Jumlah Tawaran (RM)</label>
                <input
                  type="number"
                  min={1}
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="Contoh: 1200"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {buyerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{buyerName}</p>
                  <p className="truncate text-xs text-slate-500">{buyerContact || 'Tiada maklumat hubungan'}</p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Akaun anda</span>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mesej (pilihan)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Boleh tolong bagi diskaun sikit tak?"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
              >
                {submitting ? 'Menghantar...' : 'Hantar Tawaran'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function StatChip({ label, value, capitalize = false }: { label: string; value: string | number; capitalize?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
      <p className={`text-base font-bold text-slate-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

function YieldChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400">kg</p>
    </div>
  );
}

function InfoRow({ label, value, valueClass = 'text-gray-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center py-3 px-4 bg-slate-50 rounded-xl">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
