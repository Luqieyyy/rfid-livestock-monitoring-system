'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

const db = getFirebaseDb();

type NotifPreset = {
  label: string;
  emoji: string;
  title: string;
  body: string;
  type: string;
  color: string;
};

const PRESETS: NotifPreset[] = [
  {
    label: 'Feeding Time',
    emoji: '🐄',
    type: 'feeding',
    title: '🐄 Feeding Time - Bagi makanan',
    body: 'Time to feed livestock. Tap to record feeding.',
    color: 'emerald',
  },
  {
    label: 'Kandang Kotor',
    emoji: '🏚️',
    type: 'pen_dirty',
    title: '🏚️ Kandang Kotor',
    body: 'Kandang perlu dibersihkan. Sila semak dan bersihkan segera.',
    color: 'amber',
  },
  {
    label: 'Animal Status Alert',
    emoji: '🩺',
    type: 'animal_status',
    title: '🩺 Haiwan Perlu Perhatian',
    body: 'Terdapat haiwan yang memerlukan pemeriksaan segera.',
    color: 'red',
  },
  {
    label: 'Message from Admin',
    emoji: '📢',
    type: 'admin_message',
    title: '📢 Mesej dari Admin',
    body: 'Sila semak maklumat terkini dari admin.',
    color: 'blue',
  },
];

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; btn: string; btnHover: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', btn: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-900',   btn: 'bg-amber-500',   btnHover: 'hover:bg-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-900',     btn: 'bg-red-600',     btnHover: 'hover:bg-red-700',     badge: 'bg-red-100 text-red-700' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-900',    btn: 'bg-blue-600',    btnHover: 'hover:bg-blue-700',    badge: 'bg-blue-100 text-blue-700' },
};

export default function DebugNotificationsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [customSending, setCustomSending] = useState(false);

  const sendNotification = async (preset: NotifPreset) => {
    setLoading(preset.type);
    try {
      await addDoc(collection(db, 'debug_notifications'), {
        type: preset.type,
        title: preset.title,
        body: preset.body,
        createdAt: serverTimestamp(),
      });
      setSent(prev => [preset.label, ...prev].slice(0, 10));
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setLoading(null);
    }
  };

  const sendCustom = async () => {
    if (!customTitle.trim() || !customBody.trim()) return;
    setCustomSending(true);
    try {
      await addDoc(collection(db, 'debug_notifications'), {
        type: 'custom',
        title: customTitle.trim(),
        body: customBody.trim(),
        createdAt: serverTimestamp(),
      });
      setSent(prev => ['Custom: ' + customTitle.trim(), ...prev].slice(0, 10));
      setCustomTitle('');
      setCustomBody('');
    } catch (e) {
      alert(`Failed: ${e}`);
    } finally {
      setCustomSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🐛</span>
          <h1 className="text-2xl font-bold text-gray-900">Debug Notifications</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Trigger push notifications to the Farmer App for prototype demo. Notifications appear instantly on the farmer's phone.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3">
        <span className="text-xl">💡</span>
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-semibold">How it works:</p>
          <p>Admin presses a button → writes to Firestore <code className="bg-slate-200 px-1 rounded text-xs font-mono">debug_notifications</code> → Farmer App detects the new doc in real-time → shows local notification on phone.</p>
          <p className="text-slate-500">Make sure the Farmer App is running on device with notifications enabled.</p>
        </div>
      </div>

      {/* Preset Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Quick Send — Preset Notifications</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PRESETS.map(preset => {
            const c = COLOR_CLASSES[preset.color];
            const isLoading = loading === preset.type;
            return (
              <div key={preset.type} className={`${c.bg} border ${c.border} rounded-xl p-4 flex flex-col gap-3`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{preset.emoji}</span>
                    <span className={`text-sm font-bold ${c.text}`}>{preset.label}</span>
                  </div>
                  <p className={`text-xs font-semibold ${c.text} opacity-80`}>{preset.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{preset.body}</p>
                </div>
                <button
                  onClick={() => sendNotification(preset)}
                  disabled={isLoading || loading !== null}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-semibold text-white ${c.btn} ${c.btnHover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isLoading ? 'Sending...' : `Send ${preset.emoji}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Notification */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Custom Notification</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Title</label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder="e.g. 📢 Pengumuman Penting"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Body</label>
            <textarea
              value={customBody}
              onChange={e => setCustomBody(e.target.value)}
              placeholder="e.g. Sila hadir ke pejabat jam 3 petang..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
          </div>
          <button
            onClick={sendCustom}
            disabled={customSending || !customTitle.trim() || !customBody.trim()}
            className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {customSending ? 'Sending...' : '📤 Send Custom Notification'}
          </button>
        </div>
      </div>

      {/* Sent log */}
      {sent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Recently Sent</h2>
          <div className="space-y-1.5">
            {sent.map((label, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{label}</span>
                {i === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">just now</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
