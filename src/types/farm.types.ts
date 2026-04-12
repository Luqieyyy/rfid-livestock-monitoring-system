export interface Kandang {
  id: string;
  name: string;
  type: string;
  capacity: number;
  location?: string;
  foodSpot?: string;
  waterSpot?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Animal {
  id: string;
  animalId: string;
  kandangId: string;
  type: 'cow' | 'goat' | 'sheep';
  breed: string;
  status: 'healthy' | 'sick' | 'critical' | 'quarantine' | 'deceased';
  weight?: number;
  gender?: 'male' | 'female';
  dateOfBirth?: Date;
  rfid?: string;
  photoUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface KandangStats {
  total: number;
  healthy: number;
  sick: number;
  critical: number;
  available: number;
  occupancyPercent: number;
}

export interface FarmStats {
  totalKandang: number;
  totalAnimals: number;
  totalCapacity: number;
  averageOccupancy: number;
  atCapacity: number;
  healthyAnimals: number;
  sickAnimals: number;
  criticalAnimals: number;
}
