'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { healthRecordService, breedingRecordService } from '@/services/firestore.service';
import { vaccinationService } from '@/services/vaccination.service';
import { getFirebaseDb } from '@/lib/firebase';
import type { Livestock, HealthRecord, BreedingRecord } from '@/types/livestock.types';
import type { VaccinationRecord } from '@/types/vaccination.types';
import { formatAnimalDisplayName } from '@/utils/helpers';
import { Timestamp } from 'firebase/firestore';

interface ConditionLog {
  id: string;
  animalId: string;
  farmerName: string;
  condition: 'Good' | 'Monitor' | 'Sick';
  notes: string;
  photoUrl?: string;
  timestamp: Timestamp;
  isReviewed: boolean;
}

interface Props {
  animal: Livestock;
  peers?: Livestock[];
  onClose: () => void;
  onEdit?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    sick: 'bg-red-50 text-red-700 ring-red-200',
    quarantine: 'bg-amber-50 text-amber-700 ring-amber-200',
    deceased: 'bg-gray-50 text-gray-600 ring-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] || styles.healthy}`}>
      {status}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="truncate text-sm font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-slate-900">{value}</p>
    </div>
  );
}

function ModalSpinner() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ModalEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-10 text-slate-400">
      <div className="text-3xl mb-2">📭</div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function formatRM(value: number) {
  return `RM ${Math.round(value).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function monthsOld(dateOfBirth: Date) {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth());
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function buildPriceAdvisor(animal: Livestock, peers: Livestock[] = []) {
  const weight = Math.max(animal.weight || 0, 1);
  const ageMonths = monthsOld(animal.dateOfBirth);
  const fallbackRate = animal.type === 'cow' ? 26 : animal.type === 'goat' ? 34 : 30;
  const peerRates = peers
    .filter((peer) => peer.id !== animal.id)
    .filter((peer) => peer.type === animal.type && peer.price != null && (peer.weight || 0) > 0)
    .map((peer) => (peer.price || 0) / (peer.weight || 1))
    .filter((rate) => Number.isFinite(rate) && rate > 0);
  const marketRate = peerRates.length >= 3 ? median(peerRates) : fallbackRate;

  let multiplier = 1;
  const factors: string[] = [];

  if (animal.status === 'healthy') {
    multiplier += 0.08;
    factors.push('Healthy status adds buyer confidence');
  } else if (animal.status === 'quarantine') {
    multiplier -= 0.18;
    factors.push('Quarantine status lowers recommended price');
  } else if (animal.status === 'sick') {
    multiplier -= 0.28;
    factors.push('Sick status needs discount until recovered');
  }

  if (animal.gender === 'male') {
    multiplier += animal.type === 'cow' ? 0.04 : 0.06;
    factors.push('Male livestock has stronger meat-sale demand');
  } else if (animal.gender === 'female' && animal.status === 'healthy') {
    multiplier += 0.03;
    factors.push('Healthy female has breeding value');
  }

  if (ageMonths >= 10 && ageMonths <= 36) {
    multiplier += 0.06;
    factors.push('Age is inside a strong selling window');
  } else if (ageMonths > 60) {
    multiplier -= 0.08;
    factors.push('Older age slightly reduces resale upside');
  }

  const premiumBreeds = ['boer', 'brahman', 'simmental', 'angus', 'limousin'];
  if (premiumBreeds.some((breed) => animal.breed.toLowerCase().includes(breed))) {
    multiplier += 0.05;
    factors.push('Breed usually carries a market premium');
  }

  const recommended = Math.max(0, weight * marketRate * multiplier);
  const low = recommended * 0.92;
  const high = recommended * 1.08;
  const current = animal.price || 0;
  const currentRate = current > 0 ? current / weight : 0;
  const delta = current > 0 ? ((current - recommended) / recommended) * 100 : 0;
  const confidence = peerRates.length >= 6 ? 'High' : peerRates.length >= 3 ? 'Medium' : 'Starter';
  const verdict =
    current === 0
      ? 'No selling price set'
      : delta > 12
        ? 'Above recommendation'
        : delta < -12
          ? 'Below recommendation'
          : 'Fair range';

  return {
    recommended,
    low,
    high,
    marketRate,
    current,
    currentRate,
    delta,
    confidence,
    verdict,
    factors: factors.slice(0, 4),
    peerCount: peerRates.length,
  };
}

export default function AnimalProfileModal({ animal, peers = [], onClose, onEdit }: Props) {
  const [tab, setTab] = useState<'overview' | 'health' | 'logs' | 'timeline' | 'yield' | 'ai'>('overview');
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [conditionLogs, setConditionLogs] = useState<ConditionLog[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [timelineLoaded, setTimelineLoaded] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    if (tab === 'health' && !healthLoaded) {
      setLoadingExtra(true);
      Promise.all([
        healthRecordService.getByLivestockId(animal.id),
        vaccinationService.getByAnimal(animal.animalId),
      ]).then(([hr, vac]) => {
        setHealthRecords(hr);
        setVaccinations(vac);
        setHealthLoaded(true);
        setLoadingExtra(false);
      });
    }
    if (tab === 'logs' && !logsLoaded) {
      setLoadingExtra(true);
      import('firebase/firestore').then(({ collection, query, where, orderBy, getDocs }) => {
        const db = getFirebaseDb();
        const q = query(
          collection(db, 'condition_logs'),
          where('animalId', '==', animal.animalId),
          orderBy('timestamp', 'desc')
        );
        getDocs(q).then((snap) => {
          setConditionLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConditionLog)));
          setLogsLoaded(true);
          setLoadingExtra(false);
        });
      });
    }
    if (tab === 'timeline' && !timelineLoaded) {
      setLoadingTimeline(true);
      Promise.all([
        healthLoaded ? Promise.resolve(healthRecords) : healthRecordService.getByLivestockId(animal.id),
        healthLoaded ? Promise.resolve(vaccinations) : vaccinationService.getByAnimal(animal.animalId),
        breedingRecordService.getByLivestockId(animal.id),
        (async () => {
          if (logsLoaded) return conditionLogs;
          const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
          const db = getFirebaseDb();
          const q = query(
            collection(db, 'condition_logs'),
            where('animalId', '==', animal.animalId),
            orderBy('timestamp', 'desc')
          );
          const snap = await getDocs(q);
          return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConditionLog));
        })(),
      ]).then(([hr, vac, breeding, logs]) => {
        if (!healthLoaded) {
          setHealthRecords(hr);
          setVaccinations(vac);
          setHealthLoaded(true);
        }
        if (!logsLoaded) {
          setConditionLogs(logs);
          setLogsLoaded(true);
        }
        setBreedingRecords(breeding);
        setTimelineLoaded(true);
        setLoadingTimeline(false);
      });
    }
  }, [tab]);

  const timelineEvents: { date: Date; type: string; title: string; subtitle?: string; color: string }[] = (() => {
    if (!timelineLoaded) return [];
    const events: { date: Date; type: string; title: string; subtitle?: string; color: string }[] = [];
    vaccinations.forEach((v) => events.push({
      date: new Date(v.administeredAt),
      type: 'Vaccination',
      title: `Vaccination: ${v.vaccineType}`,
      subtitle: v.administeredBy ? `by ${v.administeredBy}` : undefined,
      color: 'bg-emerald-500',
    }));
    healthRecords.forEach((h) => events.push({
      date: new Date(h.date),
      type: 'Health checkup',
      title: h.description,
      subtitle: h.veterinarian ? `Dr. ${h.veterinarian}` : undefined,
      color: 'bg-blue-500',
    }));
    conditionLogs.forEach((c) => events.push({
      date: c.timestamp ? c.timestamp.toDate() : new Date(0),
      type: 'Condition log',
      title: `Condition: ${c.condition}`,
      subtitle: `by ${c.farmerName}${c.notes ? ` — ${c.notes}` : ''}`,
      color: c.condition === 'Sick' ? 'bg-red-500' : c.condition === 'Monitor' ? 'bg-amber-500' : 'bg-emerald-500',
    }));
    breedingRecords.forEach((b) => events.push({
      date: new Date(b.breedingDate),
      type: 'Breeding update',
      title: `Breeding: ${b.status}`,
      subtitle: b.notes,
      color: 'bg-pink-500',
    }));
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  })();

  const animalImgSrc = animal.photoUrl || (animal.type === 'cow' ? '/cow.jpg' : '/goat.png');

  const yieldCalc = (() => {
    const w = animal.weight || 0;
    const isCow = animal.type === 'cow';
    const daging = (w * (isCow ? 0.38 : 0.42)).toFixed(1);
    const tulang = (w * (isCow ? 0.12 : 0.10)).toFixed(1);
    const lemak = (w * (isCow ? 0.08 : 0.06)).toFixed(1);
    return {
      daging, tulang, lemak,
      dagingPct: isCow ? '38%' : '42%',
      tulangPct: isCow ? '12%' : '10%',
      lemakPct: isCow ? '8%' : '6%',
      total: (parseFloat(daging) + parseFloat(tulang) + parseFloat(lemak)).toFixed(1),
      totalPct: (((parseFloat(daging) + parseFloat(tulang) + parseFloat(lemak)) / (w || 1)) * 100).toFixed(0),
    };
  })();

  const priceAdvisor = buildPriceAdvisor(animal, peers);

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'ai' as const, label: 'AI Price' },
    { key: 'health' as const, label: 'Health & Vax' },
    { key: 'logs' as const, label: 'Condition Logs' },
    { key: 'timeline' as const, label: 'Timeline' },
    { key: 'yield' as const, label: 'Est. Yield' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">

        {/* Header row: thumbnail + name + status + close */}
        <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 px-5 py-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
            <img src={animalImgSrc} alt={animal.type} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-950">{formatAnimalDisplayName(animal.type, animal.animalId)}</h3>
              <StatusBadge status={animal.status} />
            </div>
            <p className="mt-0.5 truncate text-sm text-slate-500">{animal.breed} / <span className="capitalize">{animal.type}</span></p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stat chips */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryItem label="Weight" value={`${animal.weight} kg`} />
            <SummaryItem label="Gender" value={animal.gender} />
            <SummaryItem label="Location" value={animal.location} />
            {animal.price != null ? (
              <SummaryItem label="Price" value={`RM ${animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`} />
            ) : (
              <SummaryItem label="Tag ID" value={animal.tagId || '-'} />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-white px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">

          {tab === 'overview' && (
            <div className="space-y-4">
              {animal.price != null && (
                <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-1">Selling Price</p>
                  <p className="text-2xl font-bold text-emerald-700">RM {animal.price.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Weight" value={`${animal.weight} kg`} />
                <DetailItem label="Gender" value={animal.gender} />
                <DetailItem label="Location" value={animal.location} />
                <DetailItem label="Date of Birth" value={new Date(animal.dateOfBirth).toLocaleDateString('en-MY')} />
                <DetailItem label="RFID Tag" value={animal.rfid || '—'} />
                <DetailItem label="Tag ID" value={animal.tagId || '—'} />
                {animal.purchasePrice != null && <DetailItem label="Purchase Price" value={`RM ${animal.purchasePrice}`} />}
                {animal.purchaseDate && <DetailItem label="Purchase Date" value={new Date(animal.purchaseDate).toLocaleDateString('en-MY')} />}
              </div>
              {animal.notes && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{animal.notes}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'health' && (
            <div className="space-y-6">
              {loadingExtra ? <ModalSpinner /> : (
                <>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Vaccination Records ({vaccinations.length})
                    </p>
                    {vaccinations.length === 0 ? <ModalEmpty label="No vaccination records" /> : (
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                        {vaccinations.map((v) => (
                          <div key={v.id} className="flex items-start gap-3 p-4 bg-white">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              v.status === 'completed' ? 'bg-emerald-500' :
                              v.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{v.vaccineType}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(v.administeredAt).toLocaleDateString('en-MY')}
                                {v.administeredBy ? ` • ${v.administeredBy}` : ''}
                                {v.dosage ? ` • ${v.dosage}` : ''}
                              </p>
                              {v.nextDueAt && (
                                <p className="text-xs text-slate-400">Next due: {new Date(v.nextDueAt).toLocaleDateString('en-MY')}</p>
                              )}
                              {v.notes && <p className="text-xs text-slate-500 mt-0.5">{v.notes}</p>}
                            </div>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              v.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              v.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>{v.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Health Records ({healthRecords.length})
                    </p>
                    {healthRecords.length === 0 ? <ModalEmpty label="No health records" /> : (
                      <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                        {healthRecords.map((h) => (
                          <div key={h.id} className="flex items-start gap-3 p-4 bg-white">
                            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 ${
                              h.type === 'vaccination' ? 'bg-emerald-100 text-emerald-700' :
                              h.type === 'treatment' ? 'bg-blue-100 text-blue-700' :
                              h.type === 'diagnosis' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                            }`}>{h.type}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{h.description}</p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(h.date).toLocaleDateString('en-MY')}
                                {h.veterinarian ? ` • Dr. ${h.veterinarian}` : ''}
                              </p>
                              {h.medication && (
                                <p className="text-xs text-slate-500 mt-0.5">💊 {h.medication}{h.dosage ? ` (${h.dosage})` : ''}</p>
                              )}
                              {h.nextCheckup && (
                                <p className="text-xs text-slate-400">Next checkup: {new Date(h.nextCheckup).toLocaleDateString('en-MY')}</p>
                              )}
                            </div>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              h.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              h.status === 'ongoing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>{h.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.25 7.5 18 8.25l-.25-.75a2.25 2.25 0 0 0-1.5-1.5L15.5 5.75l.75-.25a2.25 2.25 0 0 0 1.5-1.5L18 3.25l.25.75a2.25 2.25 0 0 0 1.5 1.5l.75.25-.75.25a2.25 2.25 0 0 0-1.5 1.5Z" />
                      </svg>
                      AI Price Advisor
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Recommended selling range</p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-emerald-800">
                      {formatRM(priceAdvisor.low)} - {formatRM(priceAdvisor.high)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Mid estimate: <span className="font-bold text-slate-700">{formatRM(priceAdvisor.recommended)}</span>
                      {' '}based on {animal.weight}kg live weight
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 text-right ring-1 ring-emerald-100">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Confidence</p>
                    <p className="mt-1 text-lg font-black text-emerald-700">{priceAdvisor.confidence}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {priceAdvisor.peerCount >= 3 ? `${priceAdvisor.peerCount} local comps` : 'fallback model'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Current Price</p>
                  <p className="mt-1 text-xl font-black text-slate-900">
                    {priceAdvisor.current > 0 ? formatRM(priceAdvisor.current) : 'Not set'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {priceAdvisor.currentRate > 0 ? `RM ${priceAdvisor.currentRate.toFixed(2)}/kg` : 'Add price to compare'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Verdict</p>
                  <p className={`mt-1 text-xl font-black ${
                    priceAdvisor.verdict === 'Above recommendation' ? 'text-amber-700' :
                    priceAdvisor.verdict === 'Below recommendation' ? 'text-blue-700' : 'text-emerald-700'
                  }`}>
                    {priceAdvisor.verdict}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {priceAdvisor.current > 0 ? `${priceAdvisor.delta > 0 ? '+' : ''}${priceAdvisor.delta.toFixed(0)}% vs AI mid` : 'No comparison yet'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Market Rate Used</p>
                  <p className="mt-1 text-xl font-black text-slate-900">RM {priceAdvisor.marketRate.toFixed(2)}/kg</p>
                  <p className="mt-1 text-xs font-medium text-slate-400 capitalize">{animal.type} pricing baseline</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Why This Price</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    {animal.breed} / {animal.gender}
                  </span>
                </div>
                <div className="space-y-2">
                  {priceAdvisor.factors.length === 0 ? (
                    <p className="text-sm text-slate-500">Not enough premium or risk signals. Estimate mainly follows weight and type baseline.</p>
                  ) : priceAdvisor.factors.map((factor) => (
                    <div key={factor} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-sm font-medium text-slate-700">{factor}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold leading-relaxed text-amber-800">
                  AI estimate is advisory only. Confirm final price with live market demand, buyer negotiation, and physical inspection.
                </p>
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div>
              {loadingExtra ? <ModalSpinner /> : conditionLogs.length === 0 ? (
                <ModalEmpty label="No condition logs from farmers" />
              ) : (
                <div className="space-y-3">
                  {conditionLogs.map((log) => (
                    <div key={log.id} className={`rounded-xl border p-4 ${
                      log.condition === 'Sick' ? 'border-red-200 bg-red-50' :
                      log.condition === 'Monitor' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">by {log.farmerName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {log.timestamp ? log.timestamp.toDate().toLocaleDateString('en-MY', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!log.isReviewed && (
                            <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                          )}
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            log.condition === 'Sick' ? 'bg-red-100 text-red-700' :
                            log.condition === 'Monitor' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>{log.condition}</span>
                        </div>
                      </div>
                      {log.notes && <p className="text-sm text-slate-700 mt-2 leading-relaxed">{log.notes}</p>}
                      {log.photoUrl && (
                        <img src={log.photoUrl} alt="Condition" className="mt-3 rounded-lg w-full h-36 object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'timeline' && (
            <div>
              {loadingTimeline ? <ModalSpinner /> : timelineEvents.length === 0 ? (
                <ModalEmpty label="No timeline events yet" />
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" />
                  <div className="space-y-5">
                    {timelineEvents.map((ev, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-6 top-1 h-3 w-3 rounded-full ring-4 ring-slate-50 ${ev.color}`} />
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{ev.type}</span>
                            <span className="text-xs text-slate-400">
                              {ev.date.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{ev.title}</p>
                          {ev.subtitle && <p className="mt-0.5 text-xs text-slate-500">{ev.subtitle}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'yield' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-emerald-800">
                  Berdasarkan berat hidup: <span className="font-bold">{animal.weight} kg</span>
                </p>
                <p className="text-xs text-emerald-600 mt-0.5 capitalize">{animal.type} • {animal.breed}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Daging', value: yieldCalc.daging, pct: yieldCalc.dagingPct, color: 'border-emerald-200 bg-emerald-50', val: 'text-emerald-700' },
                  { label: 'Tulang', value: yieldCalc.tulang, pct: yieldCalc.tulangPct, color: 'border-slate-200 bg-slate-50', val: 'text-slate-700' },
                  { label: 'Lemak',  value: yieldCalc.lemak,  pct: yieldCalc.lemakPct,  color: 'border-amber-200 bg-amber-50',   val: 'text-amber-700' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl border ${item.color} p-4 text-center shadow-sm`}>
                    <p className={`text-2xl font-bold ${item.val}`}>{item.value}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">kg {item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.pct} yield</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Usable Yield</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-emerald-700">{yieldCalc.total}</p>
                  <p className="text-base text-slate-500 mb-1">kg</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">{yieldCalc.totalPct}% daripada berat hidup</p>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nota Anggaran</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pengiraan berdasarkan kadar standard Malaysia untuk ternakan {animal.type}. Hasil sebenar bergantung kepada umur, pemakanan, dan kaedah penyembelihan.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Edit Animal
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
