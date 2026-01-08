// TypeScript interfaces for Firestore data models
// These should match the data structure used by your Flutter mobile app

// Firebase data structure (what's actually in the database)
export interface FirebaseLivestock {
  id: string;
  tagId: string;
  type: 'cows' | 'goat' | 'sheep';
  breed: string;
  age: string;
  name: string;
  status: string;
  photoUrl?: string;
  rfid?: string;
  eatingStatus?: string;
  lastScan?: any;
}

// App data structure (what the app expects)
export interface Livestock {
  id: string;
  tagId: string;
  type: 'cows' | 'goat' | 'sheep';
  breed: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  status: 'healthy' | 'sick' | 'quarantine' | 'deceased';
  weight: number;
  location: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from Firebase
  name?: string;
  photoUrl?: string;
  rfid?: string;
  age?: string;
}

export interface HealthRecord {
  id: string;
  livestockId: string;
  date: Date;
  type: 'vaccination' | 'treatment' | 'checkup' | 'diagnosis';
  description: string;
  veterinarian?: string;
  medication?: string;
  dosage?: string;
  nextCheckup?: Date;
  status: 'completed' | 'ongoing' | 'scheduled';
  createdAt: Date;
}

export interface BreedingRecord {
  id: string;
  motherId: string;
  fatherId?: string;
  breedingDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  numberOfOffspring?: number;
  offspringIds?: string[];
  status: 'planned' | 'pregnant' | 'delivered' | 'failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesRecord {
  id: string;
  livestockId: string;
  buyerName: string;
  buyerContact: string;
  saleDate: Date;
  price: number;
  paymentStatus: 'pending' | 'partial' | 'completed';
  deliveryStatus: 'pending' | 'in-transit' | 'delivered';
  notes?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalLivestock: number;
  healthyCount: number;
  sickCount: number;
  deceasedCount: number;
  activeBreedingCount: number;
  pendingSalesCount: number;
  totalRevenue: number;
  averageWeight: number;
}

export interface FeedingSchedule {
  id: string;
  name: string;
  time: string; // Format: "07:00" or "17:00"
  feedType: string;
  quantity: number; // in kg
  unit: 'kg' | 'lbs';
  livestockTypes: string[]; // ['cows', 'goat', 'sheep']
  isActive: boolean;
  notificationEnabled: boolean;
  notifyBefore: number; // minutes before feeding time
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedingActivity {
  id: string;
  scheduleId?: string;
  scheduleName?: string;
  livestockId: string;
  livestockTagId: string;
  farmerId: string;
  farmerName: string;
  feedType: string;
  quantity: number;
  unit: 'kg' | 'lbs';
  fedAt: Date;
  notes?: string;
  location?: string;
  photoUrl?: string;
  createdAt: Date;
}

export interface NotificationSettings {
  id: string;
  type: 'feeding' | 'health' | 'general';
  enabled: boolean;
  recipients: string[]; // farmer IDs or 'all'
  scheduleIds?: string[]; // specific feeding schedules
  createdAt: Date;
  updatedAt: Date;
}

export interface PushNotification {
  id: string;
  type: 'feeding' | 'health' | 'breeding' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
  recipientId?: string; // specific farmer or null for all
  scheduleId?: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'failed';
  readAt?: Date;
}
