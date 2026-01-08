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
import { COLLECTIONS } from '@/utils/constants';
import type {
  Livestock,
  FirebaseLivestock,
  HealthRecord,
  BreedingRecord,
  SalesRecord,
  DashboardStats,
  FeedingSchedule,
  FeedingActivity,
  NotificationSettings,
  PushNotification,
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

// Data adapter to convert Firebase data to app format
const adaptFirebaseToLivestock = (firebaseData: any): Livestock => {
  const now = new Date();
  
  // Convert cattle/Cow to cows for consistency
  let animalType: 'cows' | 'goat' | 'sheep' = 'cows';
  if (firebaseData.type) {
    const typeStr = firebaseData.type.toLowerCase();
    if (typeStr.includes('goat') || typeStr.includes('kambing')) {
      animalType = 'goat';
    } else if (typeStr.includes('sheep') || typeStr.includes('biri')) {
      animalType = 'sheep';
    } else if (typeStr.includes('cow') || typeStr.includes('cattle') || typeStr.includes('lembu')) {
      animalType = 'cows';
    }
  }
  
  // Normalize status - Firebase might have "Healthy" instead of "healthy"
  let normalizedStatus = 'healthy';
  if (firebaseData.status) {
    const statusStr = firebaseData.status.toLowerCase().trim();
    if (statusStr === 'healthy' || statusStr === 'success') {
      normalizedStatus = 'healthy';
    } else if (statusStr === 'sick' || statusStr === 'treatment') {
      normalizedStatus = 'sick';
    } else if (statusStr === 'quarantine') {
      normalizedStatus = 'quarantine';
    } else if (statusStr === 'deceased') {
      normalizedStatus = 'deceased';
    }
  }
  
  // Parse age to calculate date of birth
  let calculatedDOB = now;
  if (firebaseData.age) {
    const ageStr = String(firebaseData.age);
    const ageNum = parseInt(ageStr);
    if (!isNaN(ageNum)) {
      calculatedDOB = new Date(now.getFullYear() - ageNum, now.getMonth(), now.getDate());
    }
  }
  
  return {
    id: firebaseData.id || '',
    tagId: firebaseData.tagId || firebaseData.rfid_tag || firebaseData.rfid || 'N/A',
    type: animalType,
    breed: firebaseData.breed || 'Unknown',
    dateOfBirth: calculatedDOB,
    gender: (firebaseData.gender || 'male').toLowerCase() as 'male' | 'female',
    status: normalizedStatus as any,
    weight: parseFloat(firebaseData.weight) || 0,
    location: firebaseData.location || firebaseData.name || 'Farm',
    createdAt: firebaseData.timestamp ? 
      (firebaseData.timestamp instanceof Timestamp ? firebaseData.timestamp.toDate() : new Date(firebaseData.timestamp)) : 
      (firebaseData.lastScan ? (firebaseData.lastScan instanceof Timestamp ? firebaseData.lastScan.toDate() : new Date(firebaseData.lastScan)) : now),
    updatedAt: firebaseData.updatedAt ? 
      (firebaseData.updatedAt instanceof Timestamp ? firebaseData.updatedAt.toDate() : new Date(firebaseData.updatedAt)) : 
      now,
    // Additional fields from Firebase
    name: firebaseData.name,
    photoUrl: firebaseData.photoUrl || firebaseData.photoURL,
    rfid: firebaseData.rfid || firebaseData.rfid_tag,
    age: firebaseData.age,
  };
};

export const livestockService = {
  async getAll(): Promise<Livestock[]> {
    try {
      const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
      const snapshot = await getDocs(livestockRef);
      
      const livestock = snapshot.docs.map((doc) => {
        return adaptFirebaseToLivestock({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return livestock;
    } catch (error) {
      console.error('Error fetching livestock:', error);
      return [];
    }
  },

  async create(data: Omit<Livestock, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
    const docRef = await addDoc(livestockRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // Update livestock
  async update(id: string, data: Partial<Livestock>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.LIVESTOCK, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete livestock
  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.LIVESTOCK, id);
    await deleteDoc(docRef);
  },

  // Get livestock by ID
  async getById(id: string): Promise<Livestock | null> {
    try {
      const docRef = doc(db, COLLECTIONS.LIVESTOCK, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return adaptFirebaseToLivestock({
          id: docSnap.id,
          ...docSnap.data(),
        });
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching livestock by ID:', error);
      return null;
    }
  },

  // Get livestock by status
  async getByStatus(status: string): Promise<Livestock[]> {
    try {
      const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
      const q = query(livestockRef, where('status', '==', status));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => adaptFirebaseToLivestock({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Error fetching livestock by status:', error);
      return [];
    }
  },

  // Get livestock by type
  async getByType(type: string): Promise<Livestock[]> {
    try {
      const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
      const q = query(livestockRef, where('type', '==', type));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => adaptFirebaseToLivestock({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Error fetching livestock by type:', error);
      return [];
    }
  },

  // Get available livestock for sale
  async getAvailableForSale(): Promise<Livestock[]> {
    try {
      const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
      const q = query(
        livestockRef,
        where('status', 'in', ['healthy', 'Healthy'])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => adaptFirebaseToLivestock({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('❌ Error fetching available livestock:', error);
      return [];
    }
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
    try {
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
    } catch (error) {
      console.error('Dashboard error:', error);
      return {
        stats: {
          totalLivestock: 0,
          healthyCount: 0,
          sickCount: 0,
          deceasedCount: 0,
          activeBreedingCount: 0,
          pendingSalesCount: 0,
          totalRevenue: 0,
          averageWeight: 0,
        },
        recentLivestock: [],
      };
    }
  },
};

// Feeding Schedule Service
export const feedingScheduleService = {
  async getAll(): Promise<FeedingSchedule[]> {
    try {
      const q = query(collection(db, 'feedingSchedules'), orderBy('time', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as FeedingSchedule[];
    } catch (error) {
      console.error('Error fetching feeding schedules:', error);
      throw error;
    }
  },

  async getById(id: string): Promise<FeedingSchedule | null> {
    try {
      const docRef = doc(db, 'feedingSchedules', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as FeedingSchedule;
    } catch (error) {
      console.error('Error fetching feeding schedule:', error);
      throw error;
    }
  },

  async create(data: Omit<FeedingSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'feedingSchedules'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating feeding schedule:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<FeedingSchedule>): Promise<void> {
    try {
      const docRef = doc(db, 'feedingSchedules', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating feeding schedule:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'feedingSchedules', id));
    } catch (error) {
      console.error('Error deleting feeding schedule:', error);
      throw error;
    }
  },

  async getActiveSchedules(): Promise<FeedingSchedule[]> {
    try {
      const q = query(
        collection(db, 'feedingSchedules'),
        where('isActive', '==', true),
        orderBy('time', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as FeedingSchedule[];
    } catch (error) {
      console.error('Error fetching active schedules:', error);
      throw error;
    }
  },
};

// Feeding Activity Service
export const feedingActivityService = {
  async getAll(limitCount?: number): Promise<FeedingActivity[]> {
    try {
      let q = query(collection(db, 'feedingActivities'), orderBy('fedAt', 'desc'));
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as FeedingActivity[];
    } catch (error) {
      console.error('Error fetching feeding activities:', error);
      throw error;
    }
  },

  async getByLivestock(livestockId: string): Promise<FeedingActivity[]> {
    try {
      const q = query(
        collection(db, 'feedingActivities'),
        where('livestockId', '==', livestockId),
        orderBy('fedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as FeedingActivity[];
    } catch (error) {
      console.error('Error fetching livestock feeding activities:', error);
      throw error;
    }
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<FeedingActivity[]> {
    try {
      const q = query(
        collection(db, 'feedingActivities'),
        where('fedAt', '>=', startDate),
        where('fedAt', '<=', endDate),
        orderBy('fedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as FeedingActivity[];
    } catch (error) {
      console.error('Error fetching feeding activities by date range:', error);
      throw error;
    }
  },

  async getRecent(limitCount: number = 10): Promise<FeedingActivity[]> {
    return this.getAll(limitCount);
  },

  async getTodayActivities(): Promise<FeedingActivity[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return this.getByDateRange(today, tomorrow);
    } catch (error) {
      console.error('Error fetching today activities:', error);
      throw error;
    }
  },

  async create(data: Omit<FeedingActivity, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'feedingActivities'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating feeding activity:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'feedingActivities', id));
    } catch (error) {
      console.error('Error deleting feeding activity:', error);
      throw error;
    }
  },
};

// Notification Service
export const notificationService = {
  async createNotification(data: Omit<PushNotification, 'id' | 'sentAt' | 'status'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...data,
        sentAt: serverTimestamp(),
        status: 'pending',
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getScheduledNotifications(): Promise<PushNotification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('status', '==', 'pending'),
        orderBy('sentAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as PushNotification[];
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      throw error;
    }
  },

  async getNotificationHistory(limitCount: number = 50): Promise<PushNotification[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        orderBy('sentAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as PushNotification[];
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  },

  async updateNotificationStatus(id: string, status: 'sent' | 'failed'): Promise<void> {
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { status });
    } catch (error) {
      console.error('Error updating notification status:', error);
      throw error;
    }
  },

  async scheduleFeedingNotification(schedule: FeedingSchedule): Promise<string> {
    try {
      const notification: Omit<PushNotification, 'id' | 'sentAt' | 'status'> = {
        type: 'feeding',
        title: `Feeding Time: ${schedule.name}`,
        body: `Time to feed ${schedule.livestockTypes.join(', ')}. ${schedule.quantity}${schedule.unit} of ${schedule.feedType}`,
        data: {
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          feedType: schedule.feedType,
          quantity: schedule.quantity,
          unit: schedule.unit,
          time: schedule.time,
        },
        scheduleId: schedule.id,
      };
      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error scheduling feeding notification:', error);
      throw error;
    }
  },
};

// Notification Settings Service
export const notificationSettingsService = {
  async get(): Promise<NotificationSettings | null> {
    try {
      const q = query(collection(db, 'notificationSettings'), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return { id: doc.id, ...convertTimestamp(doc.data()) } as NotificationSettings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  async create(data: Omit<NotificationSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'notificationSettings'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification settings:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<NotificationSettings>): Promise<void> {
    try {
      const docRef = doc(db, 'notificationSettings', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },
};
