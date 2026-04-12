'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { adaptFirebaseToLivestock } from '@/services/firestore.service';
import type { Livestock, HealthRecord, FeedingActivity, DashboardStats } from '@/types/livestock.types';

export interface RfidScanEvent {
  id: string;
  animalId: string;
  rfid: string;
  name?: string;
  type?: string;
  breed?: string;
  location?: string;
  scannedAt: Date;
  scannedBy?: string;
}

export interface DashboardRealtimeData {
  stats: DashboardStats | null;
  livestock: Livestock[];
  recentLivestock: Livestock[];
  recentFeedings: FeedingActivity[];
  upcomingCheckups: HealthRecord[];
  rfidActivity: RfidScanEvent[];
  unreadAlerts: number;
  loading: boolean;
  lastUpdated: Date | null;
}

export function useDashboardRealtime(): DashboardRealtimeData {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<FeedingActivity[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const [salesStats, setSalesStats] = useState({ totalRevenue: 0, pendingSalesCount: 0 });
  const [breedingStats, setBreedingStats] = useState({ activeBreedingCount: 0 });
  const [overdueVaccines, setOverdueVaccines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadedCount = useRef(0);
  const mountedRef = useRef(true);
  const TOTAL_LISTENERS = 3; // animals, feedings, checkups

  useEffect(() => {
    mountedRef.current = true;
    loadedCount.current = 0;
    const db = getFirebaseDb();
    const unsubs: (() => void)[] = [];

    const markLoaded = () => {
      loadedCount.current += 1;
      if (loadedCount.current >= TOTAL_LISTENERS && mountedRef.current) {
        setLoading(false);
      }
    };

    // 1. Livestock listener
    unsubs.push(
      onSnapshot(
        query(collection(db, 'animals')),
        (snap) => {
          if (!mountedRef.current) return;
          const data = snap.docs
            .map((doc) => adaptFirebaseToLivestock({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
          setLivestock(data);
          setLastUpdated(new Date());
          markLoaded();
        },
        () => markLoaded()
      )
    );

    // 2. Recent feedings listener
    unsubs.push(
      onSnapshot(
        query(collection(db, 'feedingActivities'), orderBy('fedAt', 'desc'), limit(5)),
        (snap) => {
          if (!mountedRef.current) return;
          setRecentFeedings(
            snap.docs.map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                ...d,
                fedAt: d.fedAt instanceof Timestamp ? d.fedAt.toDate() : new Date(d.fedAt),
                createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt ?? Date.now()),
              } as FeedingActivity;
            })
          );
          markLoaded();
        },
        () => markLoaded()
      )
    );

    // 3. Upcoming checkups listener
    unsubs.push(
      onSnapshot(
        query(collection(db, 'health_records'), where('status', '==', 'scheduled'), limit(20)),
        (snap) => {
          if (!mountedRef.current) return;
          const now = new Date();
          setUpcomingCheckups(
            snap.docs
              .map((doc) => {
                const d = doc.data();
                const nextCheckup = d.nextCheckup instanceof Timestamp
                  ? d.nextCheckup.toDate()
                  : d.nextCheckup ? new Date(d.nextCheckup) : undefined;
                return {
                  id: doc.id, ...d,
                  date: d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date ?? Date.now()),
                  nextCheckup,
                  createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt ?? Date.now()),
                } as HealthRecord;
              })
              .filter((r) => !r.nextCheckup || r.nextCheckup >= now)
              .sort((a, b) => (a.nextCheckup?.getTime() ?? 0) - (b.nextCheckup?.getTime() ?? 0))
              .slice(0, 10)
          );
          markLoaded();
        },
        () => markLoaded()
      )
    );

    // One-time fetches for supplemental stats (no listeners needed)
    Promise.allSettled([
      import('@/services/firestore.service').then(({ salesRecordService, breedingRecordService }) =>
        Promise.all([salesRecordService.getAll(), breedingRecordService.getAll()])
      ),
      import('@/services/vaccination.service').then(({ vaccinationService }) =>
        vaccinationService.getOverdue()
      ),
    ]).then(([statsResult, vaccResult]) => {
      if (!mountedRef.current) return;
      if (statsResult.status === 'fulfilled') {
        const [sales, breeding] = statsResult.value;
        setSalesStats({
          totalRevenue: sales.filter((s) => s.paymentStatus === 'completed').reduce((sum, s) => sum + s.price, 0),
          pendingSalesCount: sales.filter((s) => s.deliveryStatus !== 'delivered').length,
        });
        setBreedingStats({
          activeBreedingCount: breeding.filter((b) => b.status === 'pregnant' || b.status === 'planned').length,
        });
      }
      if (vaccResult.status === 'fulfilled') {
        setOverdueVaccines(vaccResult.value.length);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubs.forEach((u) => u());
    };
  }, []);

  // Memoize stats so it only recalculates when livestock/salesStats/breedingStats change
  const stats = useMemo<DashboardStats | null>(() => {
    if (livestock.length === 0 && loading) return null;
    const healthyCount = livestock.filter((l) => l.status === 'healthy').length;
    const sickCount = livestock.filter((l) => l.status === 'sick').length;
    const deceasedCount = livestock.filter((l) => l.status === 'deceased').length;
    const averageWeight = livestock.length > 0
      ? livestock.reduce((sum, l) => sum + (l.weight || 0), 0) / livestock.length
      : 0;
    return {
      totalLivestock: livestock.length,
      healthyCount, sickCount, deceasedCount, averageWeight,
      ...salesStats,
      ...breedingStats,
    };
  }, [livestock, salesStats, breedingStats, loading]);

  // Derive rfidActivity from livestock (no extra listener)
  const rfidActivity = useMemo<RfidScanEvent[]>(() =>
    livestock
      .filter((l) => (l as any).lastScan)
      .map((l) => {
        const raw = l as any;
        const scannedAt = raw.lastScan instanceof Timestamp
          ? raw.lastScan.toDate()
          : new Date(raw.lastScan);
        return { id: l.id, animalId: l.animalId, rfid: l.rfid, name: (l as any).name, type: l.type, breed: l.breed, location: l.location, scannedAt } as RfidScanEvent;
      })
      .sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime())
      .slice(0, 10),
  [livestock]);

  const unreadAlerts = useMemo(
    () => livestock.filter((l) => ['sick', 'Sick', 'quarantine'].includes(l.status)).length + overdueVaccines,
    [livestock, overdueVaccines]
  );

  return {
    stats,
    livestock,
    recentLivestock: livestock.slice(0, 5),
    recentFeedings,
    upcomingCheckups,
    rfidActivity,
    unreadAlerts,
    loading,
    lastUpdated,
  };
}
