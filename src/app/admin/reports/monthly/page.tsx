'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  breedingRecordService,
  feedingActivityService,
  healthRecordService,
  livestockService,
  salesRecordService,
} from '@/services/firestore.service';
import { vaccinationService } from '@/services/vaccination.service';
import type {
  BreedingRecord,
  FeedingActivity,
  HealthRecord,
  Livestock,
  SalesRecord,
} from '@/types/livestock.types';
import type { VaccinationRecord } from '@/types/vaccination.types';

type ReportData = {
  livestock: Livestock[];
  health: HealthRecord[];
  vaccinations: VaccinationRecord[];
  breeding: BreedingRecord[];
  feeding: FeedingActivity[];
  sales: SalesRecord[];
};

const emptyReportData: ReportData = {
  livestock: [],
  health: [],
  vaccinations: [],
  breeding: [],
  feeding: [],
  sales: [],
};

export default function MonthlyReportPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window === 'undefined') return monthInputValue(new Date());
    return new URLSearchParams(window.location.search).get('month') ?? monthInputValue(new Date());
  });
  const [data, setData] = useState<ReportData>(emptyReportData);
  const [loading, setLoading] = useState(true);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [printHint, setPrintHint] = useState(false);

  const period = useMemo(() => getMonthPeriod(selectedMonth), [selectedMonth]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [livestock, health, vaccinations, breeding, feeding, sales] = await Promise.all([
        livestockService.getAll(),
        healthRecordService.getAll(),
        vaccinationService.getAll(),
        breedingRecordService.getAll(),
        feedingActivityService.getAll(),
        salesRecordService.getAll(),
      ]);

      setData({ livestock, health, vaccinations, breeding, feeding, sales });
      setLastLoaded(new Date());
    } catch (err) {
      console.error(err);
      setError('Unable to load report data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedMonth]);

  const report = useMemo(() => buildReport(data, period), [data, period]);

  const handlePrint = useCallback(() => {
    setPrintHint(true);
    window.focus();

    requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  useEffect(() => {
    const clearHint = () => setPrintHint(false);
    window.addEventListener('afterprint', clearHint);
    return () => window.removeEventListener('afterprint', clearHint);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (!loading && searchParams.get('print') === '1') {
      const timer = window.setTimeout(() => handlePrint(), 250);
      return () => window.clearTimeout(timer);
    }
  }, [handlePrint, loading]);

  return (
    <div className="report-page mx-auto max-w-[1120px] space-y-4 pb-8">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 6mm;
          }

          body {
            background: white !important;
          }

          aside,
          body > div > div > header,
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          .report-page {
            max-width: none !important;
            padding: 0 !important;
          }

          .report-page,
          .report-page * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-card {
            break-inside: avoid;
            box-shadow: none !important;
          }

          .print-table {
            break-inside: avoid;
          }

          .compact-print {
            gap: 0.65rem !important;
          }
        }
      `}</style>

      <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-700">FarmSense Reports</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Monthly Farm Report</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Printable report synced from current farm records.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
            Month
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="bg-transparent text-sm font-extrabold text-slate-950 outline-none"
            />
          </label>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print / Save PDF
          </button>
          <Link
            href={`/admin/reports/monthly?print=1&month=${selectedMonth}`}
            target="_blank"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 transition hover:bg-emerald-100"
          >
            Open Print View
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      {printHint && (
        <div className="no-print flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Opening print dialog... If nothing appears, press Cmd+P / Ctrl+P and choose Save as PDF.</span>
          <button
            type="button"
            onClick={() => setPrintHint(false)}
            className="self-start rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100 sm:self-auto"
          >
            Got it
          </button>
        </div>
      )}

      <div className="print-card overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-6 text-white print:px-4 print:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/farmsenselogo.png"
                alt="FarmSense"
                className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5"
              />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-emerald-200">FarmSense Admin Panel</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight print:text-[22px]">Monthly Farm Report</h2>
                <p className="mt-1 text-sm font-medium text-emerald-100">{formatDate(period.start)} - {formatDate(addDays(period.end, -1))}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-emerald-50 print:px-3 print:py-2">
              <p className="font-extrabold text-white">Generated</p>
              <p className="mt-1">{formatDateTime(lastLoaded ?? new Date())}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 px-5 py-5 print:px-4 print:py-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4 print:gap-2">
            <ReportKpi label="Total Livestock" value={report.totalLivestock} sub={`${report.cowCount} cows / ${report.goatCount} goats`} tone="emerald" />
            <ReportKpi label="Healthy Rate" value={`${report.healthyRate}%`} sub={`${report.healthyCount} healthy`} tone="green" />
            <ReportKpi label="Vaccines This Month" value={report.vaccinesThisMonth.length} sub={`${report.overdueVaccines.length} overdue`} tone="amber" />
            <ReportKpi label="Monthly Revenue" value={formatMYR(report.monthlyRevenue)} sub={`${report.completedSalesThisMonth.length} completed sales`} tone="sky" />
          </div>

          <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
            <ReportSectionTitle title="Executive Snapshot" subtitle="Current operational status from live farm records." />
            <div className="mt-3 grid gap-3 lg:grid-cols-[1.1fr_0.9fr] print:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <MiniMetric label="Under Treatment" value={report.sickCount} helper="Animals marked sick or quarantine" danger={report.sickCount > 0} />
                <MiniMetric label="Active Breeding" value={report.activeBreeding.length} helper="Pregnant or planned records" />
                <MiniMetric label="Feeding Logs" value={report.feedingsThisMonth.length} helper="Activities this month" />
                <MiniMetric label="Pending Sales" value={report.pendingSales.length} helper="Delivery or payment pending" />
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Priority Follow Up</p>
                <div className="mt-2.5 space-y-1.5">
                  <PriorityLine label="Overdue vaccinations" value={report.overdueVaccines.length} urgent={report.overdueVaccines.length > 0} />
                  <PriorityLine label="Health records ongoing" value={report.ongoingHealth.length} urgent={report.ongoingHealth.length > 0} />
                  <PriorityLine label="Deliveries due this month" value={report.deliveriesDueThisMonth.length} urgent={report.deliveriesDueThisMonth.length > 0} />
                  <PriorityLine label="Pending payment/delivery" value={report.pendingSales.length} urgent={report.pendingSales.length > 0} />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2 print:grid-cols-2 print:gap-3 compact-print">
            <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
              <ReportSectionTitle title="Livestock Inventory" subtitle="Breakdown by type and health status." />
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <InventoryPill label="Cows" value={report.cowCount} />
                <InventoryPill label="Goats" value={report.goatCount} />
                <InventoryPill label="Healthy" value={report.healthyCount} />
                <InventoryPill label="Sold" value={report.soldCount} />
              </div>
              <SimpleTable
                className="mt-3"
                headers={['Status', 'Count', 'Share']}
                rows={report.statusRows.map((row) => [
                  capitalize(row.status),
                  String(row.count),
                  `${row.share}%`,
                ])}
                emptyMessage="No livestock records available."
              />
            </section>

            <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
              <ReportSectionTitle title="Health & Vaccination" subtitle="Health records, vaccination activity, and overdue vaccines." />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <InventoryPill label="Health Logs" value={report.healthThisMonth.length} />
                <InventoryPill label="Vaccinated" value={report.vaccinesThisMonth.length} />
                <InventoryPill label="Overdue" value={report.overdueVaccines.length} danger={report.overdueVaccines.length > 0} />
              </div>
              <SimpleTable
                className="mt-3"
                headers={['Animal', 'Vaccine', 'Due / Given']}
                rows={report.vaccineRows}
                emptyMessage="No vaccination records for this month."
              />
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2 print:grid-cols-2 print:gap-3 compact-print">
            <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
              <ReportSectionTitle title="Breeding & Feeding" subtitle="Pregnancy tracking and feeding activity." />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <InventoryPill label="Active" value={report.activeBreeding.length} />
                <InventoryPill label="Due This Month" value={report.deliveriesDueThisMonth.length} />
                <InventoryPill label="Feed Logs" value={report.feedingsThisMonth.length} />
              </div>
              <SimpleTable
                className="mt-3"
                headers={['Mother', 'Status', 'Expected']}
                rows={report.breedingRows}
                emptyMessage="No breeding records due this month."
              />
            </section>

            <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:p-3">
              <ReportSectionTitle title="Sales Summary" subtitle="Revenue and delivery status." />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <InventoryPill label="Completed" value={report.completedSalesThisMonth.length} />
                <InventoryPill label="Pending" value={report.pendingSales.length} />
                <InventoryPill label="Revenue" value={formatMYR(report.monthlyRevenue)} />
              </div>
              <SimpleTable
                className="mt-3"
                headers={['Buyer', 'Amount', 'Status']}
                rows={report.salesRows}
                emptyMessage="No sales records for this month."
              />
            </section>
          </div>

          <section className="print-card rounded-2xl border border-slate-200 bg-white p-4 print:col-span-2 print:p-3">
            <ReportSectionTitle title="Recent Activity" subtitle="Latest records included in this report." />
            <SimpleTable
              className="mt-3"
              headers={['Date', 'Area', 'Summary']}
              rows={report.activityRows}
              emptyMessage="No recent report activity."
            />
          </section>

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-3 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Data sources: animals, health_records, vaccinations, breeding_records, feedingActivities, sales.</p>
            <p>Prepared by FarmSense Admin Panel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildReport(data: ReportData, period: { start: Date; end: Date }) {
  const livestock = data.livestock;
  const totalLivestock = livestock.length;
  const cowCount = livestock.filter((item) => item.type === 'cow').length;
  const goatCount = livestock.filter((item) => item.type === 'goat').length;
  const healthyCount = livestock.filter((item) => item.status === 'healthy').length;
  const sickCount = livestock.filter((item) => item.status === 'sick' || item.status === 'quarantine').length;
  const soldCount = livestock.filter((item) => item.status === 'sold').length;
  const healthyRate = totalLivestock ? Math.round((healthyCount / totalLivestock) * 100) : 0;

  const healthThisMonth = data.health.filter((record) => inPeriod(toDate(record.date), period));
  const ongoingHealth = data.health.filter((record) => record.status === 'ongoing' || record.status === 'scheduled');

  const vaccinesThisMonth = data.vaccinations.filter((record) => inPeriod(toDate(record.administeredAt), period));
  const overdueVaccines = data.vaccinations.filter((record) => record.status === 'overdue');

  const activeBreeding = data.breeding.filter((record) => record.status === 'pregnant' || record.status === 'planned');
  const deliveriesDueThisMonth = data.breeding.filter((record) => inPeriod(toDate(record.expectedDeliveryDate), period));

  const feedingsThisMonth = data.feeding.filter((record) => inPeriod(toDate(record.fedAt), period));

  const salesThisMonth = data.sales.filter((record) => inPeriod(toDate(record.saleDate), period));
  const completedSalesThisMonth = salesThisMonth.filter((record) => record.paymentStatus === 'completed');
  const monthlyRevenue = completedSalesThisMonth.reduce((sum, record) => sum + Number(record.price || 0), 0);
  const pendingSales = data.sales.filter((record) => record.paymentStatus !== 'completed' || record.deliveryStatus !== 'delivered');

  const statusRows = ['healthy', 'sick', 'quarantine', 'deceased', 'sold']
    .map((status) => {
      const count = livestock.filter((item) => item.status === status).length;
      return {
        status,
        count,
        share: totalLivestock ? Math.round((count / totalLivestock) * 100) : 0,
      };
    })
    .filter((row) => row.count > 0);

  const vaccineRows = [...overdueVaccines, ...vaccinesThisMonth]
    .slice(0, 6)
    .map((record) => [
      animalLabel(record.animalType, record.animalTagId || record.animalName || record.animalId),
      record.vaccineType,
      record.status === 'overdue'
        ? `Overdue ${record.nextDueAt ? formatDate(record.nextDueAt) : ''}`.trim()
        : formatDate(record.administeredAt),
    ]);

  const breedingRows = [...deliveriesDueThisMonth, ...activeBreeding]
    .slice(0, 6)
    .map((record) => [
      record.motherId,
      capitalize(record.status),
      formatDate(record.expectedDeliveryDate),
    ]);

  const salesRows = salesThisMonth
    .slice(0, 6)
    .map((record) => [
      record.buyerName,
      formatMYR(record.price),
      `${capitalize(record.paymentStatus)} / ${capitalize(record.deliveryStatus)}`,
    ]);

  const activityRows = [
    ...healthThisMonth.slice(0, 4).map((record) => ({
      date: toDate(record.date),
      area: 'Health',
      summary: `${capitalize(record.type)} - ${record.description || record.status}`,
    })),
    ...vaccinesThisMonth.slice(0, 4).map((record) => ({
      date: toDate(record.administeredAt),
      area: 'Vaccination',
      summary: `${record.vaccineType} for ${animalLabel(record.animalType, record.animalTagId || record.animalId)}`,
    })),
    ...feedingsThisMonth.slice(0, 4).map((record) => ({
      date: toDate(record.fedAt),
      area: 'Feeding',
      summary: `${record.feedType} - ${record.quantity} ${record.unit}`,
    })),
    ...salesThisMonth.slice(0, 4).map((record) => ({
      date: toDate(record.saleDate),
      area: 'Sales',
      summary: `${record.buyerName} - ${formatMYR(record.price)}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
    .map((item) => [formatDate(item.date), item.area, item.summary]);

  return {
    totalLivestock,
    cowCount,
    goatCount,
    healthyCount,
    sickCount,
    soldCount,
    healthyRate,
    healthThisMonth,
    ongoingHealth,
    vaccinesThisMonth,
    overdueVaccines,
    activeBreeding,
    deliveriesDueThisMonth,
    feedingsThisMonth,
    salesThisMonth,
    completedSalesThisMonth,
    monthlyRevenue,
    pendingSales,
    statusRows,
    vaccineRows,
    breedingRows,
    salesRows,
    activityRows,
  };
}

function ReportKpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: 'emerald' | 'green' | 'amber' | 'sky';
}) {
  const tones = {
    emerald: 'from-emerald-900 to-emerald-700 text-emerald-50',
    green: 'from-teal-800 to-emerald-600 text-emerald-50',
    amber: 'from-amber-700 to-orange-600 text-amber-50',
    sky: 'from-slate-900 to-sky-800 text-sky-50',
  };

  return (
    <div className={`print-card rounded-2xl bg-gradient-to-br ${tones[tone]} p-4 shadow-sm print:p-3`}>
      <p className="text-xs font-extrabold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-3 text-2xl font-black tabular-nums print:text-[26px]">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-75">{sub}</p>
    </div>
  );
}

function ReportSectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h3 className="text-base font-extrabold text-slate-950 print:text-[15px]">{title}</h3>
        <p className="text-sm font-medium text-slate-500 print:text-[11px]">{subtitle}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, helper, danger = false }: { label: string; value: number; helper: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${danger ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1.5 text-xl font-black ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function PriorityLine({ label, value, urgent }: { label: string; value: number; urgent: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-1.5 ring-1 ring-slate-100">
      <span className="text-xs font-bold text-slate-700 print:text-[11px]">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${urgent ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
        {value}
      </span>
    </div>
  );
}

function InventoryPill({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 ${danger ? 'bg-red-50' : 'bg-slate-50'}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-black ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
  emptyMessage,
  className = '',
}: {
  headers: string[];
  rows: string[][];
  emptyMessage: string;
  className?: string;
}) {
  return (
    <div className={`print-table overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <table className="w-full text-left text-[12px] print:text-[11px]">
        <thead className="bg-slate-50 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.length > 0 ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2 font-semibold text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-3 py-4 text-center text-sm font-semibold text-slate-400" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getMonthPeriod(value: string) {
  const [year, month] = value.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function monthInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function inPeriod(date: Date, period: { start: Date; end: Date }) {
  return date >= period.start && date < period.end;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toDate(value: Date | string | number | undefined | null) {
  if (!value) return new Date(0);
  return value instanceof Date ? value : new Date(value);
}

function formatDate(date: Date | string | number | undefined | null) {
  const value = toDate(date);
  if (value.getTime() === 0) return '-';
  return value.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(date: Date) {
  return date.toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMYR(value: number) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function capitalize(value: string) {
  if (!value) return '-';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
}

function animalLabel(type?: string, id?: string) {
  const animalType = type ? capitalize(type) : 'Animal';
  return id ? `${animalType} ${id}` : animalType;
}
