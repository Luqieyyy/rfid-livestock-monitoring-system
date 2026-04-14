'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStorage } from '@/lib/firebase';
import {
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

type Section = 'profile' | 'security';
type SaveState = 'idle' | 'saving' | 'success' | 'error';

export default function ProfileSettingsPage() {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('profile');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">Account Settings</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Profile & Security</h2>
        <p className="mt-0.5 text-sm text-slate-400">Kemaskini maklumat akaun dan kata laluan admin.</p>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {(['profile', 'security'] as Section[]).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              section === s
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {s === 'profile' ? 'Profile' : 'Security'}
          </button>
        ))}
      </div>

      {section === 'profile' && <ProfileSection />}
      {section === 'security' && <SecuritySection />}
    </div>
  );
}

// ─── Profile Section ────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrorMsg('Gambar mesti kurang 5MB'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const uploadPhoto = async (uid: string): Promise<string | null> => {
    if (!photoFile) return null;
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, `profile-photos/${uid}`);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, photoFile);
      task.on(
        'state_changed',
        (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => { resolve(await getDownloadURL(task.snapshot.ref)); }
      );
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaveState('saving');
    setErrorMsg('');
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Not authenticated');

      // 1. Upload photo if changed
      const newPhotoURL = await uploadPhoto(user.uid);
      setUploadProgress(null);

      // 2. Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: displayName.trim(),
        ...(newPhotoURL ? { photoURL: newPhotoURL } : {}),
      });

      // 3. Update Firestore users doc
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        ...(newPhotoURL ? { photoURL: newPhotoURL } : {}),
        updatedAt: serverTimestamp(),
      });

      // Refresh AuthContext so sidebar updates immediately
      await refreshUser();

      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil.');
      setSaveState('error');
    }
  };

  const initials = (displayName || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="space-y-5">
      {/* Photo upload card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-5">Gambar Profil</h3>
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-emerald-100">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />

          <div className="space-y-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload gambar
            </button>
            <p className="text-xs text-slate-400">JPG, PNG, WebP — maks 5MB</p>
            {uploadProgress !== null && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="text-xs text-emerald-600 font-medium">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info fields */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-semibold text-slate-700">Maklumat Akaun</h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nama Penuh" required>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Masukkan nama..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-slate-400">Tukar email dalam tab Security</p>
          </Field>

          <Field label="Role">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold capitalize">
                {user?.role}
              </span>
            </div>
          </Field>

          <Field label="User ID">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
              <p className="text-xs font-mono text-slate-500 truncate">{user?.uid}</p>
            </div>
          </Field>
        </div>

        {errorMsg && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{errorMsg}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          {saveState === 'success' && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Berjaya disimpan
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-sm"
          >
            {saveState === 'saving' ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Menyimpan...</>
            ) : 'Simpan perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Security Section ────────────────────────────────────────────────────────

function SecuritySection() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [pwSaveState, setPwSaveState] = useState<SaveState>('idle');
  const [emailSaveState, setEmailSaveState] = useState<SaveState>('idle');
  const [pwError, setPwError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { setPwError('Sila isi semua field.'); return; }
    if (newPassword !== confirmPassword) { setPwError('Kata laluan baru tidak sepadan.'); return; }
    if (newPassword.length < 6) { setPwError('Kata laluan mesti sekurang-kurangnya 6 aksara.'); return; }

    setPwSaveState('saving');
    setPwError('');
    try {
      const auth = getFirebaseAuth();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !user?.email) throw new Error('Not authenticated');

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      setPwSaveState('success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPwSaveState('idle'), 3000);
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Kata laluan semasa tidak betul.'
        : err.message || 'Gagal menukar kata laluan.';
      setPwError(msg);
      setPwSaveState('error');
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) { setEmailError('Sila isi semua field.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailError('Format email tidak sah.'); return; }

    setEmailSaveState('saving');
    setEmailError('');
    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !user?.email) throw new Error('Not authenticated');

      const credential = EmailAuthProvider.credential(user.email, emailPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updateEmail(firebaseUser, newEmail);
      await updateDoc(doc(db, 'users', user.uid), { email: newEmail, updatedAt: serverTimestamp() });

      setEmailSaveState('success');
      setEmailPassword('');
      setTimeout(() => setEmailSaveState('idle'), 3000);
    } catch (err: any) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Kata laluan tidak betul.'
        : err.code === 'auth/email-already-in-use'
        ? 'Email ini sudah digunakan.'
        : err.message || 'Gagal menukar email.';
      setEmailError(msg);
      setEmailSaveState('error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Change password */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Tukar Kata Laluan</h3>
            <p className="text-xs text-slate-400">Perlukan kata laluan semasa untuk mengesahkan.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kata Laluan Semasa" required>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} show={showPw} onToggle={() => setShowPw(v => !v)} placeholder="Kata laluan semasa..." />
          </Field>
          <div /> {/* spacer */}
          <Field label="Kata Laluan Baru" required>
            <PasswordInput value={newPassword} onChange={setNewPassword} show={showPw} onToggle={() => setShowPw(v => !v)} placeholder="Min 6 aksara..." />
          </Field>
          <Field label="Sahkan Kata Laluan Baru" required>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showPw} onToggle={() => setShowPw(v => !v)} placeholder="Ulang kata laluan baru..." />
          </Field>
        </div>

        {/* Password strength */}
        {newPassword.length > 0 && (
          <PasswordStrength password={newPassword} />
        )}

        {pwError && <ErrorBanner msg={pwError} />}

        <div className="flex items-center justify-end gap-3">
          {pwSaveState === 'success' && <SuccessText />}
          <SaveButton state={pwSaveState} onClick={handleChangePassword} />
        </div>
      </div>

      {/* Change email */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Tukar Email</h3>
            <p className="text-xs text-slate-400">Email semasa: <span className="font-medium text-slate-600">{user?.email}</span></p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email Baru" required>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="email@baru.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </Field>
          <Field label="Kata Laluan Semasa" required>
            <PasswordInput value={emailPassword} onChange={setEmailPassword} show={showPw} onToggle={() => setShowPw(v => !v)} placeholder="Sahkan identiti..." />
          </Field>
        </div>

        {emailError && <ErrorBanner msg={emailError} />}

        <div className="flex items-center justify-end gap-3">
          {emailSaveState === 'success' && <SuccessText />}
          <SaveButton state={emailSaveState} onClick={handleChangeEmail} />
        </div>
      </div>
    </div>
  );
}

// ─── Reusable micro-components ───────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggle, placeholder }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
      />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        )}
      </button>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Min 8 aksara', ok: password.length >= 8 },
    { label: 'Huruf besar', ok: /[A-Z]/.test(password) },
    { label: 'Nombor', ok: /[0-9]/.test(password) },
    { label: 'Simbol', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['Lemah', 'Sederhana', 'Baik', 'Kuat'];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map(c => (
            <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        {score > 0 && <span className={`text-xs font-semibold ${colors[score - 1].replace('bg-', 'text-')}`}>{labels[score - 1]}</span>}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">{msg}</p>;
}

function SuccessText() {
  return (
    <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      Berjaya
    </span>
  );
}

function SaveButton({ state, onClick }: { state: SaveState; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={state === 'saving'}
      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-6 py-2.5 text-sm font-semibold text-white transition-all shadow-sm"
    >
      {state === 'saving' ? (
        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Menyimpan...</>
      ) : 'Simpan'}
    </button>
  );
}
