'use client';

import { useEffect, useRef, useState } from 'react';
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
  recentLivestock: Livestock[];
  recentFeedings: FeedingActivity[];
  upcomingCheckups: HealthRecord[];
  rfidActivity: RfidScanEvent[];
  unreadAlerts: number;
  loading: boolean;
  lastUpdated: Date | null;
}

function computeStats(livestock: Livestock[]): DashboardStats {
  const healthyCount = livestock.filter((l) => l.status === 'healthy').length;
  const sickCount = livestock.filter((l) => l.status === 'sick').length;
  const deceasedCount = livestock.filter((l) => l.status === 'deceased').length;
  const averageWeight =
    livestock.length > 0
      ? livestock.reduce((sum, l) => sum + (l.weight || 0), 0) / livestock.length
      : 0;

  return {
    totalLivestock: livestock.length,
    healthyCount,
    sickCount,
    deceasedCount,
    activeBreedingCount: 0, // updated by breeding listener
    pendingSalesCount: 0,   // updated by sales listener
    totalRevenue: 0,        // updated by sales listener
    averageWeight,
  };
}

export function useDashboardRealtime(): DashboardRealtimeData {
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [recentFeedings, setRecentFeedings] = useState<FeedingActivity[]>([]);
  const [upcomingCheckups, setUpcomingCheckups] = useState<HealthRecord[]>([]);
  const [rfidActivity, setRfidActivity] = useState<RfidScanEvent[]>([]);
  const [salesStats, setSalesStats] = useState({ totalRevenue: 0, pendingSalesCount: 0 });
  const [breedingStats, setBreedingStats] = useState({ activeBreedingCount: 0 });
  const [overdueVaccines, setOverdueVaccines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Track how many initial listeners have resolved
  const loadedCount = useRef(0);
  const TOTAL_LISTENERS = 4;

  const markLoaded = () => {
    loadedCount.current += 1;
    if (loadedCount.current >= TOTAL_LISTENERS) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const db = getFirebaseDb();

    // 1. Livestock listener — no orderBy to avoid index requirement
    const livestockQ = query(collection(db, 'animals'));
    unsubs.push(
      onSnapshot(
        livestockQ,
        (snap) => {
          const data = snap.docs.map((doc) =>
            adaptFirebaseToLivestock({ id: doc.id, ...doc.data() })
          );
          // Sort client-side by createdAt/timestamp descending
          data.sort((a, b) => {
            const aTime = a.createdAt?.getTime?.() ?? 0;
            const bTime = b.createdAt?.getTime?.() ?? 0;
            return bTime - aTime;
          });
          setLivestock(data);
          setLastUpdated(new Date());
          markLoaded();
        },
        (err) => {
          console.error('Livestock listener error:', err);
          markLoaded();
        }
      )
    );

    // 2. Recent feedings listener
    const feedQ = query(
      collection(db, 'feedingActivities'),
      orderBy('fedAt', 'desc'),
      limit(5)
    );
    unsubs.push(
      onSnapshot(
        feedQ,
        (snap) => {
          const data = snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              fedAt: d.fedAt instanceof Timestamp ? d.fedAt.toDate() : new Date(d.fedAt),
              createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt ?? Date.now()),
            } as FeedingActivity;
          });
          setRecentFeedings(data);
          markLoaded();
        },
        (err) => {
          console.error('Feeding listener error:', err);
          markLoaded();
        }
      )
    );

    // 3. Upcoming checkups listener — simple query, filter client-side
    const checkupQ = query(
      collection(db, 'health_records'),
      where('status', '==', 'scheduled'),
      limit(20)
    );
    unsubs.push(
      onSnapshot(
        checkupQ,
        (snap) => {
          const now = new Date();
          const data = snap.docs
            .map((doc) => {
              const d = doc.data();
              const nextCheckup =
                d.nextCheckup instanceof Timestamp
                  ? d.nextCheckup.toDate()
                  : d.nextCheckup
                  ? new Date(d.nextCheckup)
                  : undefined;
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
          markLoaded();
        },
        (err) => {
          console.error('Checkup listener error:', err);
          markLoaded();
        }
      )
    );

    // 4. RFID scan activity — reuse animals collection, filter client-side
    const rfidQ = query(collection(db, 'animals'), limit(50));
    unsubs.push(
      onSnapshot(
        rfidQ,
        (snap) => {
          const data = snap.docs
            .map((doc) => {
              const d = doc.data();
              if (!d.lastScan) return null;
              const scannedAt =
                d.lastScan instanceof Timestamp ? d.lastScan.toDate() : new Date(d.lastScan);
              return {
                id: doc.id,
                animalId: d.animalId || doc.id,
                rfid: d.rfid || d.rfid_tag || 'Unknown',
                name: d.name,
                type: d.type,
                breed: d.breed,
                location: d.location,
                scannedAt,
                scannedBy: d.scannedBy,
              } as RfidScanEvent;
            })
            .filter(Boolean)
            .sort((a, b) => b!.scannedAt.getTime() - a!.scannedAt.getTime())
            .slice(0, 10) as RfidScanEvent[];
          setRfidActivity(data);
          markLoaded();
        },
        (err) => {
          console.error('RFID listener error:', err);
          markLoaded();
        }
      )
    );

    // 5. Unread alerts — derived from livestock listener, no extra query needed
    // (handled in the stats computation below)

    // Sales & breeding — one-time fetch supplementing realtime (less critical for live updates)
    import('@/services/firestore.service').then(({ salesRecordService, breedingRecordService }) => {
      salesRecordService.getAll().then((sales) => {
        setSalesStats({
          totalRevenue: sales
            .filter((s) => s.paymentStatus === 'completed')
            .reduce((sum, s) => sum + s.price, 0),
          pendingSalesCount: sales.filter((s) => s.deliveryStatus !== 'delivered').length,
        });
      }).catch(() => {});

      breedingRecordService.getAll().then((breeding) => {
        setBreedingStats({
          activeBreedingCount: breeding.filter(
            (b) => b.status === 'pregnant' || b.status === 'planned'
          ).length,
        });
      }).catch(() => {});
    });

    import('@/services/vaccination.service').then(({ vaccinationService }) => {
      vaccinationService.getOverdue().then((overdue) => {
        setOverdueVaccines(overdue.length);
      }).catch(() => {});
    });

    return () => unsubs.forEach((u) => u());
  }, []);

  const baseStats = computeStats(livestock);
  const stats: DashboardStats | null =
    livestock.length > 0 || !loading
      ? {
          ...baseStats,
          ...salesStats,
          ...breedingStats,
        }
      : null;

  const sickAlerts = livestock.filter((l) =>
    ['sick', 'Sick', 'treatment', 'quarantine'].includes(l.status)
  ).length;

  return {
    stats,
    recentLivestock: livestock.slice(0, 5),
    recentFeedings,
    upcomingCheckups,
    rfidActivity,
    unreadAlerts: sickAlerts + overdueVaccines,
    loading,
    lastUpdated,
  };
}
