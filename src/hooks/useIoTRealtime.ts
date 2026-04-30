import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { getFirebaseRtdb } from '@/lib/firebase';

const INACTIVE_TIMEOUT_MS = 60_000;

export interface KandangData {
  temperature: number;
  humidity: number;
  airRaw: number;
  airStatus: string;
  updatedAt: number;
  source: string;
}

export interface DeviceStatus {
  active: boolean;
  lastSeen: number;
}

export interface IoTRealtimeState {
  kandang1: KandangData | null;
  kandang2: KandangData | null;
  mainController: DeviceStatus;
  feeder: DeviceStatus;
}

export function useIoTRealtime(): IoTRealtimeState {
  const [state, setState] = useState<IoTRealtimeState>({
    kandang1: null,
    kandang2: null,
    mainController: { active: false, lastSeen: 0 },
    feeder: { active: false, lastSeen: 0 },
  });

  useEffect(() => {
    const db = getFirebaseRtdb();
    const isActive = (lastSeen: number) => Date.now() - lastSeen < INACTIVE_TIMEOUT_MS;

    const unsubs = [
      onValue(ref(db, '/kandang/kandang1'), (snap) => {
        const d = snap.val() as KandangData | null;
        if (d) setState((prev) => ({ ...prev, kandang1: d }));
      }),
      onValue(ref(db, '/kandang/kandang2'), (snap) => {
        const d = snap.val() as KandangData | null;
        if (d) setState((prev) => ({ ...prev, kandang2: d }));
      }),
      onValue(ref(db, '/devices/mainController'), (snap) => {
        const d = snap.val();
        if (!d) return;
        setState((prev) => ({
          ...prev,
          mainController: { active: isActive(d.lastSeen ?? 0), lastSeen: d.lastSeen ?? 0 },
        }));
      }),
      onValue(ref(db, '/devices/feeder'), (snap) => {
        const d = snap.val();
        if (!d) return;
        setState((prev) => ({
          ...prev,
          feeder: { active: isActive(d.lastSeen ?? 0), lastSeen: d.lastSeen ?? 0 },
        }));
      }),
    ];

    // Re-evaluate active status every 30s to catch heartbeat timeout
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        mainController: { ...prev.mainController, active: isActive(prev.mainController.lastSeen) },
        feeder: { ...prev.feeder, active: isActive(prev.feeder.lastSeen) },
      }));
    }, 30_000);

    return () => {
      unsubs.forEach((u) => u());
      clearInterval(interval);
    };
  }, []);

  return state;
}
