'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { diseaseDetectionService } from '@/services/disease-detection.service';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseDb } from '@/lib/firebase';
import type {
  DiseaseDetectionSubmission,
  DiseaseSubmissionDetailsResponse,
  DiseaseSubmissionStatus,
} from '@/types/disease-detection.types';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

type StatusFilter = DiseaseSubmissionStatus | 'all';

type FarmerProfile = {
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
};

export default function DiseaseDetectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<DiseaseDetectionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [animalType, setAnimalType] = useState('');
  const [farmerQuery, setFarmerQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DiseaseSubmissionDetailsResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [farmerProfiles, setFarmerProfiles] = useState<Record<string, FarmerProfile>>({});

  const loadList = async () => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setItems([]);
      setError('Please sign in as admin to load disease submissions.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Fetch all submissions once, filter client-side
      const submissions = await diseaseDetectionService.listSubmissions({ limit: 200 });
      setItems(submissions);
    } catch (e: any) {
      const rawMessage = e?.message || 'Failed to load submissions';
      if (rawMessage.toLowerCase().includes('no authenticated user')) {
        setError('Session is not authenticated. Please sign in again.');
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid]);

  useEffect(() => {
    const farmerIds = Array.from(
      new Set(items.map((item) => item.farmerId).filter((id): id is string => Boolean(id)))
    ).filter((id) => !farmerProfiles[id]);

    if (farmerIds.length === 0) return;

    let cancelled = false;

    const loadFarmerProfiles = async () => {
      const db = getFirebaseDb();
      const entries = await Promise.all(
        farmerIds.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'users', id));
            const data = snap.exists() ? snap.data() : {};
            return [
              id,
              {
                displayName: typeof data.displayName === 'string' ? data.displayName : null,
                nickname: typeof data.nickname === 'string' ? data.nickname : null,
                photoURL:
                  typeof data.photoURL === 'string'
                    ? data.photoURL
                    : typeof data.photoUrl === 'string'
                    ? data.photoUrl
                    : null,
              },
            ] as const;
          } catch {
            return [id, { displayName: null, nickname: null, photoURL: null }] as const;
          }
        })
      );

      if (!cancelled) {
        setFarmerProfiles((current) => ({ ...current, ...Object.fromEntries(entries) }));
      }
    };

    loadFarmerProfiles();

    return () => {
      cancelled = true;
    };
  }, [items, farmerProfiles]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false;
      if (animalType && !item.animalType?.toLowerCase().includes(animalType.toLowerCase())) return false;

      const profile = item.farmerId ? farmerProfiles[item.farmerId] : null;
      const farmerName = getFarmerDisplayName(item, profile).toLowerCase();
      const query = farmerQuery.trim().toLowerCase();
      if (query && !farmerName.includes(query)) return false;

      const d = getDateFromUnknown(item.submittedAt);
      if (fromDate && d && d < new Date(fromDate)) return false;
      if (toDate && d && d > endOfDay(new Date(toDate))) return false;

      return true;
    });
  }, [items, status, animalType, farmerQuery, fromDate, toDate, farmerProfiles]);

  const stats = useMemo(() => {
    return {
      total: filteredItems.length,
      pending: filteredItems.filter((i) => i.status === 'pending').length,
      underAnalysis: filteredItems.filter((i) => i.status === 'under_analysis').length,
      analyzed: filteredItems.filter((i) => i.status === 'analyzed').length,
      reviewNeeded: filteredItems.filter((i) => i.status === 'review_needed').length,
    };
  }, [filteredItems]);

  const openDetails = async (id: string) => {
    try {
      setSelectedId(id);
      setDetailLoading(true);
      setDetailError(null);
      setActionError(null);
      setReviewNote('');
      const payload = await diseaseDetectionService.getSubmissionDetails(id);
      setDetail(payload);
      setReviewNote(payload?.submission?.reviewNote || '');
    } catch (e: any) {
      setDetail(null);
      setDetailError(e?.message || 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await diseaseDetectionService.triggerAnalysis(selectedId);
      await Promise.all([openDetails(selectedId), loadList()]);
    } catch (e: any) {
      setActionError(e?.message || 'Failed to trigger analysis');
    } finally {
      setActionLoading(false);
    }
  };

  const setStatusAction = async (newStatus: DiseaseSubmissionStatus) => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await diseaseDetectionService.updateSubmissionStatus(
        selectedId,
        newStatus,
        reviewNote || undefined
      );
      await Promise.all([openDetails(selectedId), loadList()]);
    } catch (e: any) {
      setActionError(e?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(true);
      await diseaseDetectionService.deleteSubmission(id);
      setConfirmDeleteId(null);
      if (selectedId === id) setSelectedId(null);
      await loadList();
    } catch (e: any) {
      alert(e?.message || 'Failed to delete submission');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setStatus('all');
    setAnimalType('');
    setFarmerQuery('');
    setFromDate('');
    setToDate('');
  };

  const selectedSummary = useMemo(() => {
    if (!selectedId) return null;
    return items.find((item) => item.id === selectedId) || null;
  }, [items, selectedId]);

  const hasActiveFilters = Boolean(
    status !== 'all' || animalType || farmerQuery || fromDate || toDate
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">AI Diagnostics</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Disease Detection Analysis</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Professional review workspace for disease submissions, confidence checks,
            and manual triage decisions.
          </p>
        </div>
        <button
          onClick={loadList}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 self-start sm:self-auto"
        >
          <RefreshIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>


      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <StatsCard label="Total" value={stats.total} tone="slate" iconSrc="/DiseaseDetectionicon/TotalSubmissions.png" />
        <StatsCard label="Pending" value={stats.pending} tone="amber" iconSrc="/DiseaseDetectionicon/Pending.png" />
        <StatsCard label="Under Analysis" value={stats.underAnalysis} tone="blue" iconSrc="/DiseaseDetectionicon/UnderAnalysis.png" />
        <StatsCard label="Analyzed" value={stats.analyzed} tone="emerald" iconSrc="/DiseaseDetectionicon/Completed.png" />
        <StatsCard label="Review Needed" value={stats.reviewNeeded} tone="rose" iconSrc="/DiseaseDetectionicon/ReviewNeeded.png" />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={inputClass}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="under_analysis">Under analysis</option>
            <option value="analyzed">Analyzed</option>
            <option value="review_needed">Review needed</option>
          </select>
          <input
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            placeholder="Animal type"
            className={inputClass}
          />
          <input
            value={farmerQuery}
            onChange={(e) => setFarmerQuery(e.target.value)}
            placeholder="Farmer nickname"
            className={inputClass}
          />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputClass} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputClass} />
          <button
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Submission Queue</p>
              <p className="text-xs text-slate-500">{filteredItems.length} records in current view</p>
            </div>
          </div>

          {loading ? (
            <TableLoadingState />
          ) : error ? (
            <InlineErrorState message={error} onRetry={loadList} />
          ) : filteredItems.length === 0 ? (
            <InlineEmptyState
              title="No submissions found"
              description="Try adjusting your filters or wait for new farmer uploads."
            />
          ) : (
            <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <Th>Submission</Th>
                    <Th>Farmer</Th>
                    <Th>Animal</Th>
                    <Th>Media</Th>
                    <Th>Status</Th>
                    <Th>Confidence</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredItems.map((item) => {
                    const active = selectedId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetails(item.id)}
                        className={`cursor-pointer transition ${
                          active ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="text-sm font-semibold text-slate-900 font-mono">
                            #{item.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{formatDate(item.submittedAt)}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <FarmerCell
                            name={getFarmerDisplayName(
                              item,
                              item.farmerId ? farmerProfiles[item.farmerId] : null
                            )}
                            photoURL={
                              item.farmerId ? farmerProfiles[item.farmerId]?.photoURL || null : null
                            }
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="text-sm font-medium capitalize text-slate-800">{item.animalType || 'Unknown type'}</p>
                          <p className="mt-1 text-xs font-mono text-slate-500">
                            {item.animalTag && item.animalTag.trim()
                              ? item.animalTag
                              : item.animalId
                              ? `#${item.animalId.slice(0, 8)}`
                              : 'No tag'}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <MediaCountsBadge
                            imageCount={Number(item.mediaCounts?.image || 0)}
                            videoCount={Number(item.mediaCounts?.video || 0)}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <ConfidencePill value={item.confidence ?? null} />
                        </td>
                        <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={deleteLoading}
                                onClick={() => handleDelete(item.id)}
                                className="rounded-lg bg-red-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                              >
                                {deleteLoading ? '...' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openDetails(item.id)}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {filteredItems.map((item) => {
                const active = selectedId === item.id;
                const farmerProfile = item.farmerId ? farmerProfiles[item.farmerId] : null;
                return (
                  <SubmissionCard
                    key={item.id}
                    item={item}
                    active={active}
                    farmerName={getFarmerDisplayName(item, farmerProfile)}
                    farmerPhotoURL={farmerProfile?.photoURL || null}
                    confirmDelete={confirmDeleteId === item.id}
                    deleteLoading={deleteLoading}
                    onOpen={() => openDetails(item.id)}
                    onRequestDelete={() => setConfirmDeleteId(item.id)}
                    onCancelDelete={() => setConfirmDeleteId(null)}
                    onConfirmDelete={() => handleDelete(item.id)}
                  />
                );
              })}
            </div>
            </>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-slate-800">Analysis Workspace</p>
            {selectedSummary && <StatusPill status={selectedSummary.status} />}
          </div>

          {!selectedId ? (
            <InlineEmptyState
              title="Select a submission"
              description="Choose a row from the queue to inspect media, confidence, and review actions."
            />
          ) : detailLoading ? (
            <DetailLoadingState />
          ) : detailError ? (
            <InlineErrorState
              message={detailError}
              onRetry={() => {
                if (selectedId) openDetails(selectedId);
              }}
            />
          ) : !detail ? (
            <InlineErrorState
              message="Failed to load details"
              onRetry={() => {
                if (selectedId) openDetails(selectedId);
              }}
            />
          ) : (
            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Submission Overview</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Submission ID</p>
                    <p className="text-sm font-semibold font-mono text-slate-900">
                      #{detail.submission.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 break-all">{detail.submission.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(detail.submission.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Farmer</p>
                    <FarmerCell
                      name={getFarmerDisplayName(
                        detail.submission,
                        detail.submission.farmerId
                          ? farmerProfiles[detail.submission.farmerId]
                          : null
                      )}
                      photoURL={
                        detail.submission.farmerId
                          ? farmerProfiles[detail.submission.farmerId]?.photoURL || null
                          : null
                      }
                      compact
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Animal</p>
                    <p className="text-sm font-medium text-slate-800 capitalize">
                      {detail.submission.animalType || 'Unknown type'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Media Preview</p>
                {detail.media.length === 0 ? (
                  <InlineEmptyState
                    title="No media uploaded"
                    description="This submission currently has no uploaded media for analysis."
                  />
                ) : (
                  <div className="space-y-3">
                    {detail.media.map((m) => (
                      <div key={m.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        {m.mediaType === 'video' ? (
                          <video
                            className="w-full max-h-[400px] object-contain bg-black"
                            controls
                            src={m.previewUrl || undefined}
                          />
                        ) : (
                          <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                            <Image
                              fill
                              className="object-contain"
                              src={m.previewUrl || '/FarmSense.jpg'}
                              alt={m.fileName || 'media'}
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between px-3 py-2 text-[11px] text-slate-500 border-t border-slate-100">
                          <span className="capitalize font-medium">{m.mediaType}</span>
                          <span className={m.status === 'uploaded' ? 'text-emerald-600 font-semibold' : ''}>{m.status || 'unknown'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Analysis Result</p>
                {!detail.result ? (
                  <InlineEmptyState
                    title="No analysis result yet"
                    description="Trigger analysis to generate confidence and recommendation output."
                  />
                ) : (
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Predicted Label</p>
                        <p className="text-base font-semibold text-slate-900">
                          {detail.result.primaryLabel || 'N/A'}
                        </p>
                      </div>
                      <StatusChip lowConfidence={detail.result.lowConfidenceFlag === true} />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>Confidence</span>
                        <span className="font-semibold">
                          {formatConfidence(detail.result.confidence)}
                        </span>
                      </div>
                      <ConfidenceBar value={detail.result.confidence ?? null} />
                    </div>

                    {detail.result.alternatives && detail.result.alternatives.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs text-slate-600">Alternatives</p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.result.alternatives
                            .map((a) => a.label)
                            .filter(Boolean)
                            .map((label) => (
                              <span
                                key={label}
                                className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
                              >
                                {label}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {detail.result.note && (
                      <p>
                        <span className="font-semibold text-slate-700">Note:</span>{' '}
                        {detail.result.note}
                      </p>
                    )}

                    {detail.result.recommendation && (
                      <p>
                        <span className="font-semibold text-slate-700">Recommendation:</span>{' '}
                        {detail.result.recommendation}
                      </p>
                    )}

                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                      {detail.result.disclaimer || 'AI output is assistive and must be verified by experts.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manual Review Notes</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Add recommendation, verification steps, or final reviewer remarks..."
                />
                {actionError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {actionError}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={runAnalysis}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Working...' : 'Trigger Analysis'}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setStatusAction('review_needed')}
                    className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                  >
                    Mark Review Needed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setStatusAction('analyzed')}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark Analyzed
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => setStatusAction('pending')}
                    className="rounded-xl bg-slate-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Model Run Log</p>
                {detail.modelRuns.length === 0 ? (
                  <p className="text-sm text-slate-500">No model runs recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.modelRuns.slice(0, 3).map((run) => (
                      <div key={run.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {run.status || 'unknown'}
                          </p>
                          <p className="text-[11px] text-slate-500">{formatDate(run.startedAt)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          {(run.modelSource || 'Unknown model')} • {run.modelVersion || 'n/a'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  tone,
  iconSrc,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'amber' | 'blue' | 'emerald' | 'rose';
  iconSrc: string;
}) {
  const tones = {
    slate:   { val: 'text-slate-800'   },
    amber:   { val: 'text-amber-700'   },
    blue:    { val: 'text-blue-700'    },
    emerald: { val: 'text-emerald-700' },
    rose:    { val: 'text-rose-700'    },
  };
  const t = tones[tone];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="shrink-0">
        <img src={iconSrc} alt={label} className="h-28 w-28 object-contain" />
      </div>
      <div className="min-w-0">
        <p className={`text-3xl font-extrabold tabular-nums leading-none ${t.val}`}>{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-500 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: DiseaseSubmissionStatus }) {
  const styles: Record<DiseaseSubmissionStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 border border-amber-200',
    under_analysis: 'bg-blue-100 text-blue-700 border border-blue-200',
    analyzed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    review_needed: 'bg-rose-100 text-rose-700 border border-rose-200',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[status] || styles.pending}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(input: any): string {
  const d = getDateFromUnknown(input);
  if (!d) return '—';
  return d.toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatConfidence(value: number | null | undefined) {
  if (typeof value !== 'number') return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function ConfidenceBar({ value }: { value: number | null | undefined }) {
  if (typeof value !== 'number') {
    return <div className="h-2 rounded-full bg-slate-200" />;
  }

  const percent = Math.max(0, Math.min(100, value * 100));
  const color = percent < 50 ? 'bg-rose-500' : percent < 75 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

function ConfidencePill({ value }: { value: number | null | undefined }) {
  if (typeof value !== 'number') {
    return <span className="text-xs font-medium text-slate-400">N/A</span>;
  }
  const percent = value * 100;
  const tone =
    percent < 50
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : percent < 75
      ? 'bg-amber-100 text-amber-700 border-amber-200'
      : 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${tone}`}>
      {formatConfidence(value)}
    </span>
  );
}

function getFarmerDisplayName(
  item: DiseaseDetectionSubmission,
  profile?: FarmerProfile | null
) {
  return (
    profile?.nickname?.trim() ||
    profile?.displayName?.trim() ||
    item.farmerName?.trim() ||
    'Unknown farmer'
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'F';
  return parts.map((part) => part[0]?.toUpperCase()).join('');
}

function FarmerCell({
  name,
  photoURL,
  compact = false,
}: {
  name: string;
  photoURL?: string | null;
  compact?: boolean;
}) {
  const avatarSize = compact ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <div className="flex min-w-[170px] items-center gap-3">
      <div
        className={`${avatarSize} relative shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100`}
      >
        {photoURL ? (
          <img src={photoURL} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-xs font-bold text-emerald-700">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
        {!compact && <p className="mt-0.5 text-xs text-slate-400">Farmer</p>}
      </div>
    </div>
  );
}

function SubmissionCard({
  item,
  active,
  farmerName,
  farmerPhotoURL,
  confirmDelete,
  deleteLoading,
  onOpen,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  item: DiseaseDetectionSubmission;
  active: boolean;
  farmerName: string;
  farmerPhotoURL?: string | null;
  confirmDelete: boolean;
  deleteLoading: boolean;
  onOpen: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className={`cursor-pointer rounded-2xl border p-4 transition ${
        active
          ? 'border-emerald-200 bg-emerald-50/70'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-slate-900">
            #{item.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatDate(item.submittedAt)}</p>
        </div>
        <StatusPill status={item.status} />
      </div>

      <div className="mt-4">
        <FarmerCell name={farmerName} photoURL={farmerPhotoURL} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Animal</p>
          <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
            {item.animalType || 'Unknown type'}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-500">
            {item.animalTag && item.animalTag.trim()
              ? item.animalTag
              : item.animalId
              ? `#${item.animalId.slice(0, 8)}`
              : 'No tag'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Confidence</p>
          <div className="mt-1">
            <ConfidencePill value={item.confidence ?? null} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MediaCountsBadge
          imageCount={Number(item.mediaCounts?.image || 0)}
          videoCount={Number(item.mediaCounts?.video || 0)}
        />
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {confirmDelete ? (
            <>
              <button
                disabled={deleteLoading}
                onClick={onConfirmDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? '...' : 'Yes'}
              </button>
              <button
                onClick={onCancelDelete}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onOpen}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={onRequestDelete}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ lowConfidence }: { lowConfidence: boolean }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        lowConfidence
          ? 'border-amber-200 bg-amber-100 text-amber-700'
          : 'border-emerald-200 bg-emerald-100 text-emerald-700'
      }`}
    >
      {lowConfidence ? 'Needs Manual Verification' : 'Confidence Acceptable'}
    </span>
  );
}

function MediaCountsBadge({ imageCount, videoCount }: { imageCount: number; videoCount: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
        {imageCount} image
      </span>
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
        {videoCount} video
      </span>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </th>
  );
}

function InlineEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <InboxIcon className="h-5 w-5 text-slate-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function InlineErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <WarningIcon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-red-700">Unable to load data</p>
      <p className="mt-1 text-xs text-red-600">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Retry
      </button>
    </div>
  );
}

function TableLoadingState() {
  return (
    <div className="divide-y divide-slate-100 p-3">
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <div key={k} className="grid grid-cols-6 gap-3 px-3 py-3 animate-pulse">
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
          <div className="h-4 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function DetailLoadingState() {
  return (
    <div className="space-y-3 p-5 animate-pulse">
      <div className="h-20 rounded-2xl bg-slate-200" />
      <div className="h-28 rounded-2xl bg-slate-200" />
      <div className="h-32 rounded-2xl bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
    </div>
  );
}

function RefreshIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h5M20 20v-5h-5M5.5 14A7 7 0 0019 9m-14 6a7 7 0 0013.5-1" />
    </svg>
  );
}

function WarningIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
    </svg>
  );
}

function StackIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l9 4.5L12 12 3 7.5 12 3zm0 9l9-4.5V12L12 16.5 3 12V7.5L12 12zm0 4.5l9-4.5V16.5L12 21 3 16.5V12l9 4.5z" />
    </svg>
  );
}

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PulseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12h3l2-4 4 8 2-4h7" />
    </svg>
  );
}

function CheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function FlagIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v18m0-14h10l-1.8 3L15 13H5" />
    </svg>
  );
}

function InboxIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l3-3h12l3 3v9a2 2 0 01-2 2h-3l-2-3h-4l-2 3H5a2 2 0 01-2-2V8z" />
    </svg>
  );
}

function getDateFromUnknown(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  if (typeof input === 'string' || typeof input === 'number') {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'object' && typeof input._seconds === 'number') {
    return new Date(input._seconds * 1000);
  }
  if (typeof input === 'object' && typeof input.seconds === 'number') {
    return new Date(input.seconds * 1000);
  }
  return null;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
