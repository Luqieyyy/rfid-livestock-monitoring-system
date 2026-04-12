'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, where, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Livestock, HealthRecord } from '@/types/livestock.types';
import { adaptFirebaseToLivestock } from '@/services/firestore.service';

/**
 * Lightweight hook for the sidebar/layout — only fetches what's needed
 * for the notification bell (sick animals + upcoming checkups).
 * Much cheaper than running the full useDashboardRealtime on every page.
 */
export function useLayoutAlerts() {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const db = getFirebaseDb();
    const unsubs: (() => void)[] = [];

    // Only sick/quarantine animals — much smaller payload than all animals
    const sickQ = query(
      collection(db, 'animals'),
      where('status', 'in', ['sick', 'Sick', 'quarantine']),
      limit(20)
    );
    unsubs.push(
      onSnapshot(sickQ, (snap) => {
        if (!mountedRef.current) return;
        setLivestock(snap.docs.map((d) => adaptFirebaseToLivestock({ id: d.id, ...d.data() })));
      }, () => {})
    );

    // Scheduled checkups only
    const checkupQ = query(
      collection(db, 'health_records'),
      where('status', '==', 'scheduled'),
      limit(15)
    );
    unsubs.push(
      onSnapshot(checkupQ, (snap) => {
        if (!mountedRef.current) return;
        const now = new Date();
        const data = snap.docs
          .map((doc) => {
            const d = doc.data();
            const nextCheckup = d.nextCheckup instanceof Timestamp
              ? d.nextCheckup.toDate()
              : d.nextCheckup ? new Date(d.nextCheckup) : undefined;
            return {
              id: doc.id,
              ...d,
              date: d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date ?? Date.now()),
              nextCheckup,
              createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt ?? Date.now()),
            } as HealthRecord;
          })
          .filter((r) => !r.nextCheckup || r.nextCheckup >= now)
          .sort((a, b) => (a.nextCheckup?.getTime() ?? 0) - (b.nextCheckup?.getTime() ?? 0))
          .slice(0, 10);
        setUpcomingCheckups(data);
      }, () => {})
    );

    return () => {
      mountedRef.current = false;
      unsubs.forEach((u) => u());
    };
  }, []);

  const unreadAlerts = livestock.length;

  return { livestock, upcomingCheckups, unreadAlerts };
}
