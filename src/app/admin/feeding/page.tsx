'use client';

import { useEffect, useState } from 'react';
import { Bell, Clock3, FileText, Trash2 } from 'lucide-react';
import { feedingScheduleService, feedingActivityService, livestockService, iotFeedService } from '@/services/firestore.service';
import type { FeedingSchedule, FeedingActivity, Livestock } from '@/types/livestock.types';

const ic = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

export default function FeedingManagement() {
  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);
  const [activities, setActivities] = useState<FeedingActivity[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedules' | 'activities'>('schedules');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [feedStatus, setFeedStatus] = useState<'idle' | 'pending' | 'done' | null>(null);
  const [feedTriggering, setFeedTriggering] = useState(false);

  useEffect(() => { loadData(); }, []);

  // Realtime listener for ESP32 feed status
  useEffect(() => {
    const unsub = iotFeedService.onStatusChange((s) => setFeedStatus(s as typeof feedStatus));
    return () => unsub();
  }, []);

  const handleFeedNow = async () => {
    if (feedStatus === 'pending' || feedTriggering) return;
    setFeedTriggering(true);
    try { await iotFeedService.triggerFeedNow(); }
    catch (e) { console.error(e); }
    finally { setFeedTriggering(false); }
  };

  const loadData = async () => {
    try {
      const [s, a, l] = await Promise.all([
        feedingScheduleService.getAll(),
        feedingActivityService.getTodayActivities(),
        livestockService.getAll(),
      ]);
      setSchedules(s);
      setActivities(a);
      setLivestock(l);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = {
    todayFeedings: activities.length,
    completedSchedules: activities.filter((a) => a.scheduleId).length,
    totalFeedGiven: activities.reduce((sum, a) => sum + a.quantity, 0),
    activeSchedules: schedules.filter((s) => s.isActive).length,
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Livestock Management</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Feeding Management</h2>
          <p className="mt-0.5 text-sm text-slate-500">Jadual dan rekod aktiviti pemberian makanan ternakan.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Feed Now Button */}
          <button
            onClick={handleFeedNow}
            disabled={feedStatus === 'pending' || feedTriggering}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition
              ${feedStatus === 'pending'
                ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                : feedStatus === 'done'
                  ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
          >
            {feedStatus === 'pending' ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Dispensing...
              </>
            ) : feedStatus === 'done' ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Fed!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Feed Now
              </>
            )}
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Schedule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 items-stretch">
        <StatCard label="Today's Feedings" value={stats.todayFeedings} tone="sky" />
        <StatCard label="Completed Schedules" value={stats.completedSchedules} tone="emerald" />
        <StatCard label="Total Feed (kg)" value={stats.totalFeedGiven.toFixed(1)} tone="amber" />
        <StatCard label="Active Schedules" value={stats.activeSchedules} tone="violet" />
      </div>

      {/* Tabs + Content */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-5 pb-0">
          {(['schedules', 'activities'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-all -mb-px ${
                activeTab === tab ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'schedules' ? 'Feeding Schedules' : 'Feeding Activities'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'schedules' ? (
            <SchedulesView schedules={schedules} onUpdate={loadData} />
          ) : (
            <ActivitiesView activities={activities} livestock={livestock} />
          )}
        </div>
      </div>

      {showScheduleModal && (
        <AddScheduleModal onClose={() => setShowScheduleModal(false)} onSuccess={() => { setShowScheduleModal(false); loadData(); }} />
      )}
    </div>
  );
}

// ── Schedules ────────────────────────────────────────────────

function SchedulesView({ schedules, onUpdate }: { schedules: FeedingSchedule[]; onUpdate: () => void }) {
  const handleToggle = async (s: FeedingSchedule) => {
    try { await feedingScheduleService.update(s.id, { isActive: !s.isActive }); onUpdate(); }
    catch (e) { console.error(e); }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    try { await feedingScheduleService.delete(id); onUpdate(); }
    catch (e) { console.error(e); }
  };

  if (schedules.length === 0) return (
    <EmptyState icon={<ClockIcon className="h-8 w-8 text-slate-400" />} title="No feeding schedules" description="Create your first feeding schedule to get started." />
  );

  return (
    <div className="space-y-4">
      {schedules.map((s) => (
        <div key={s.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md sm:p-5">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-sky-500" />

          {/* Card content */}
          <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center">
            <div className="flex flex-shrink-0 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 sm:w-36">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Clock3 className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <span className="text-xl font-extrabold leading-none text-emerald-800 tabular-nums">{s.time}</span>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <p className="truncate text-base font-bold text-slate-950">{s.name}</p>
                <p className="text-sm font-medium text-slate-500">{s.feedType} · {s.quantity} {s.unit}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {s.livestockTypes.map((t) => (
                  <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">{t}</span>
                ))}
                {s.notificationEnabled && (
                  <span className="flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    <Bell className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {s.notifyBefore}min before
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <button
                onClick={() => handleToggle(s)}
                className={`min-w-[6rem] rounded-full px-3.5 py-2 text-xs font-bold transition ${
                  s.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {s.isActive ? 'Active' : 'Inactive'}
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${s.name}`}
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Activities ───────────────────────────────────────────────

function ActivitiesView({ activities, livestock }: { activities: FeedingActivity[]; livestock: Livestock[] }) {
  const getName = (id: string) => livestock.find((l) => l.id === id)?.tagId ?? null;
  const getNotes = (activity: FeedingActivity) => {
    const raw = [
      activity.notes,
      activity.remarks,
      activity.remark,
      activity.additionalNotes,
    ].find((value) => typeof value === 'string' && value.trim().length > 0);

    return typeof raw === 'string' ? raw.trim() : '';
  };

  if (activities.length === 0) return (
    <EmptyState icon={<ListIcon className="h-8 w-8 text-slate-400" />} title="No feeding activities today" description="Feeding activities logged by staff will appear here." />
  );

  return (
    <div className="divide-y divide-slate-100">
      {activities.map((a) => {
        const notes = getNotes(a);

        return (
          <div key={a.id} className="flex items-start gap-4 py-4 hover:bg-slate-50/60 rounded-xl px-2 transition">
            {a.photoUrl ? (
              <img src={a.photoUrl} alt="feed" className="h-10 w-10 flex-shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100">
                <CheckIcon className="h-5 w-5 text-sky-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900 text-sm">
                  {a.livestockTagId || getName(a.livestockId) || a.penName || 'Auto Feed (IoT)'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-sm font-medium text-emerald-600">
                  {new Date(a.fedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {a.feedType || 'Dispensed'} · {a.quantity} {a.unit}
                {a.farmerName && a.farmerName !== 'Unknown Farmer' ? ` · ${a.farmerName}` : ' · IoT Dispenser'}
                {a.animalCount ? ` · ${a.animalCount} animals` : ''}
              </p>
              {notes && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-slate-600">
                  <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" strokeWidth={2.2} />
                  <p className="line-clamp-2 leading-relaxed">
                    <span className="font-semibold text-emerald-700">Remarks:</span> {notes}
                  </p>
                </div>
              )}
            </div>
            {a.scheduleName && (
              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 flex-shrink-0">
                {a.scheduleName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared components ────────────────────────────────────────

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: 'sky' | 'emerald' | 'amber' | 'violet' }) {
  const tones = {
    sky:     { val: 'text-sky-700'     },
    emerald: { val: 'text-emerald-700' },
    amber:   { val: 'text-amber-700'   },
    violet:  { val: 'text-violet-700'  },
  };
  const icons = {
    sky:     '/Feedingicon/todayfeeding.png',
    emerald: '/Feedingicon/feedingcompleted.png',
    amber:   '/Feedingicon/totalfeed.png',
    violet:  '/Feedingicon/activeschedules.png',
  };
  const t = tones[tone];
  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 sm:h-24 sm:w-24">
        <img src={icons[tone]} alt={label} className="h-16 w-16 object-contain drop-shadow-sm sm:h-20 sm:w-20" />
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className={`text-3xl font-extrabold tabular-nums leading-none sm:text-4xl ${t.val}`}>{value}</p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-500 sm:text-base">{label}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">{icon}</div>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-52 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200" />)}
      </div>
      <div className="h-72 rounded-[28px] bg-slate-200" />
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────

function ClockIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function CheckIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ListIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}

// ── Add Schedule Modal ───────────────────────────────────────

function AddScheduleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', time: '07:00', feedType: '', quantity: '', unit: 'kg' as 'kg' | 'lbs',
    livestockTypes: [] as string[], isActive: true, notificationEnabled: true, notifyBefore: 30,
  });
  const [saving, setSaving] = useState(false);

  const toggleType = (t: string) =>
    setForm((f) => ({ ...f, livestockTypes: f.livestockTypes.includes(t) ? f.livestockTypes.filter((x) => x !== t) : [...f.livestockTypes, t] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await feedingScheduleService.create({ ...form, quantity: parseFloat(form.quantity) }); onSuccess(); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Feeding Schedule</h2>
            <p className="text-sm text-slate-500">Tetapkan jadual pemberian makanan ternakan</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-slate-100 transition text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Schedule Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Bagi makanan pagi" className={ic} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Time *</label>
              <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Feed Type *</label>
              <input required value={form.feedType} onChange={(e) => setForm({ ...form, feedType: e.target.value })} placeholder="Hay, Grain, Silage..." className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Quantity *</label>
              <input type="number" required step="0.1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="40" className={ic} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as 'kg' | 'lbs' })} className={ic}>
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600">Livestock Types *</label>
            <div className="flex gap-2 flex-wrap">
              {['cows', 'goat'].map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${form.livestockTypes.includes(t) ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Auto Notification</p>
                <p className="text-xs text-slate-500">Hantar reminder sebelum waktu makan</p>
              </div>
              <button type="button" onClick={() => setForm((f) => ({ ...f, notificationEnabled: !f.notificationEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form.notificationEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${form.notificationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {form.notificationEnabled && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Notify before (minutes)</label>
                <input type="number" value={form.notifyBefore} onChange={(e) => setForm({ ...form, notifyBefore: parseInt(e.target.value) })} className={ic} />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Create Schedule'}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
