import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  Livestock,
  HealthRecord,
  BreedingRecord,
  SalesRecord,
  DashboardStats,
} from '@/types/livestock.types';

// Helper function to convert Firestore Timestamp to Date
const convertTimestamp = (data: DocumentData): any => {
  const converted: any = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// Livestock Services
export const livestockService = {
  // Get all livestock
  async getAll(): Promise<Livestock[]> {
    const livestockRef = collection(db, 'livestock');
    const q = query(livestockRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Livestock[];
  },

  // Create new livestock
  async create(data: Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const livestockRef = collection(db, 'livestock');
    const docRef = await addDoc(livestockRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update livestock
  async update(id: string, data: Partial<Livestock>): Promise<void> {
    const docRef = doc(db, 'livestock', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete livestock
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'livestock', id);
    await deleteDoc(docRef);
  },

  // Get livestock by ID
  async getById(id: string): Promise<Livestock | null> {
    const docRef = doc(db, 'livestock', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamp(docSnap.data()),
      } as Livestock;
    }
    return null;
  },

  // Get livestock by status
  async getByStatus(status: string): Promise<Livestock[]> {
    const livestockRef = collection(db, 'livestock');
    const q = query(livestockRef, where('status', '==', status));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Livestock[];
  },

  // Get livestock by type
  async getByType(type: string): Promise<Livestock[]> {
    const livestockRef = collection(db, 'livestock');
    const q = query(livestockRef, where('type', '==', type));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Livestock[];
  },

  // Get available livestock for sale
  async getAvailableForSale(): Promise<Livestock[]> {
    const livestockRef = collection(db, 'livestock');
    const q = query(
      livestockRef,
      where('status', 'in', ['healthy', 'quarantine']),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as Livestock[];
  },
};

// Health Records Services
export const healthRecordService = {
  // Get all health records
  async getAll(): Promise<HealthRecord[]> {
    const healthRef = collection(db, 'health_records');
    const q = query(healthRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as HealthRecord[];
  },

  // Create new health record
  async create(data: Omit<HealthRecord, 'id' | 'createdAt'>): Promise<string> {
    const healthRef = collection(db, 'health_records');
    const docRef = await addDoc(healthRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update health record
  async update(id: string, data: Partial<HealthRecord>): Promise<void> {
    const docRef = doc(db, 'health_records', id);
    await updateDoc(docRef, data);
  },

  // Delete health record
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'health_records', id);
    await deleteDoc(docRef);
  },

  // Get all health records for a specific livestock
  async getByLivestockId(livestockId: string): Promise<HealthRecord[]> {
    const healthRef = collection(db, 'health_records');
    const q = query(
      healthRef,
      where('livestockId', '==', livestockId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as HealthRecord[];
  },

  // Get recent health records (last 30 days)
  async getRecent(days: number = 30): Promise<HealthRecord[]> {
    const healthRef = collection(db, 'health_records');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const q = query(
      healthRef,
      where('date', '>=', cutoffDate),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as HealthRecord[];
  },

  // Get upcoming checkups
  async getUpcomingCheckups(): Promise<HealthRecord[]> {
    const healthRef = collection(db, 'health_records');
    const today = new Date();
    const q = query(
      healthRef,
      where('nextCheckup', '>=', today),
      where('status', '==', 'scheduled'),
      orderBy('nextCheckup', 'asc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as HealthRecord[];
  },
};

// Breeding Records Services
export const breedingRecordService = {
  // Get all breeding records
  async getAll(): Promise<BreedingRecord[]> {
    const breedingRef = collection(db, 'breeding_records');
    const q = query(breedingRef, orderBy('breedingDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BreedingRecord[];
  },

  // Create new breeding record
  async create(data: Omit<BreedingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const breedingRef = collection(db, 'breeding_records');
    const docRef = await addDoc(breedingRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update breeding record
  async update(id: string, data: Partial<BreedingRecord>): Promise<void> {
    const docRef = doc(db, 'breeding_records', id);
    await updateDoc(docRef, data);
  },

  // Delete breeding record
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'breeding_records', id);
    await deleteDoc(docRef);
  },

  // Get breeding records by status
  async getByStatus(status: string): Promise<BreedingRecord[]> {
    const breedingRef = collection(db, 'breeding_records');
    const q = query(
      breedingRef,
      where('status', '==', status),
      orderBy('breedingDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BreedingRecord[];
  },

  // Get breeding records for a specific livestock
  async getByLivestockId(livestockId: string): Promise<BreedingRecord[]> {
    const breedingRef = collection(db, 'breeding_records');
    const q = query(
      breedingRef,
      where('motherId', '==', livestockId),
      orderBy('breedingDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as BreedingRecord[];
  },
};

// Sales Records Services
export const salesRecordService = {
  // Get all sales records
  async getAll(): Promise<SalesRecord[]> {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('saleDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as SalesRecord[];
  },

  // Create new sales record
  async create(data: Omit<SalesRecord, 'id' | 'createdAt'>): Promise<string> {
    const salesRef = collection(db, 'sales');
    const docRef = await addDoc(salesRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update sales record
  async update(id: string, data: Partial<SalesRecord>): Promise<void> {
    const docRef = doc(db, 'sales', id);
    await updateDoc(docRef, data);
  },

  // Delete sales record
  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'sales', id);
    await deleteDoc(docRef);
  },

  // Get recent sales (last 30 days)
  async getRecent(days: number = 30): Promise<SalesRecord[]> {
    const salesRef = collection(db, 'sales');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const q = query(
      salesRef,
      where('saleDate', '>=', cutoffDate),
      orderBy('saleDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as SalesRecord[];
  },

  // Get pending sales
  async getPending(): Promise<SalesRecord[]> {
    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where('deliveryStatus', 'in', ['pending', 'in-transit']),
      orderBy('saleDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...convertTimestamp(doc.data()),
    })) as SalesRecord[];
  },
};

// Dashboard Statistics Service
export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [livestock, sales, breeding] = await Promise.all([
      livestockService.getAll(),
      salesRecordService.getAll(),
      breedingRecordService.getAll(),
    ]);

    const healthyCount = livestock.filter((l: Livestock) => l.status === 'healthy').length;
    const sickCount = livestock.filter((l: Livestock) => l.status === 'sick').length;
    const deceasedCount = livestock.filter((l: Livestock) => l.status === 'deceased').length;
    const activeBreedingCount = breeding.filter(
      (b: BreedingRecord) => b.status === 'pregnant' || b.status === 'planned'
    ).length;
    const pendingSalesCount = sales.filter(
      (s: SalesRecord) => s.deliveryStatus !== 'delivered'
    ).length;
    const totalRevenue = sales
      .filter((s: SalesRecord) => s.paymentStatus === 'completed')
      .reduce((sum: number, s: SalesRecord) => sum + s.price, 0);
    const averageWeight =
      livestock.length > 0
        ? livestock.reduce((sum: number, l: Livestock) => sum + (l.weight || 0), 0) / livestock.length
        : 0;

    return {
      totalLivestock: livestock.length,
      healthyCount,
      sickCount,
      deceasedCount,
      activeBreedingCount,
      pendingSalesCount,
      totalRevenue,
      averageWeight,
    };
  },

  // Optimized: Get stats and recent livestock in one call to avoid duplicate queries
  async getStatsWithLivestock(): Promise<{ stats: DashboardStats; recentLivestock: Livestock[] }> {
    const [livestock, sales, breeding] = await Promise.all([
      livestockService.getAll(),
      salesRecordService.getAll(),
      breedingRecordService.getAll(),
    ]);

    const healthyCount = livestock.filter((l: Livestock) => l.status === 'healthy').length;
    const sickCount = livestock.filter((l: Livestock) => l.status === 'sick').length;
    const deceasedCount = livestock.filter((l: Livestock) => l.status === 'deceased').length;
    const activeBreedingCount = breeding.filter(
      (b: BreedingRecord) => b.status === 'pregnant' || b.status === 'planned'
    ).length;
    const pendingSalesCount = sales.filter(
      (s: SalesRecord) => s.deliveryStatus !== 'delivered'
    ).length;
    const totalRevenue = sales
      .filter((s: SalesRecord) => s.paymentStatus === 'completed')
      .reduce((sum: number, s: SalesRecord) => sum + s.price, 0);
    const averageWeight =
      livestock.length > 0
        ? livestock.reduce((sum: number, l: Livestock) => sum + (l.weight || 0), 0) / livestock.length
        : 0;

    return {
      stats: {
        totalLivestock: livestock.length,
        healthyCount,
        sickCount,
        deceasedCount,
        activeBreedingCount,
        pendingSalesCount,
        totalRevenue,
        averageWeight,
      },
      recentLivestock: livestock.slice(0, 5),
    };
  },
};
