// TypeScript interfaces for Firestore data models
// These should match the data structure used by your Flutter mobile app

// Firebase data structure (what's actually in the database)
export interface FirebaseLivestock {
  id: string;
  tagId: string;
  type: 'cows' | 'goat';
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
  type: 'cows' | 'goat';
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
