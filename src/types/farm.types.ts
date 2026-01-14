// Firestore Types for Farm Overview
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Size3D {
  width: number;
  height: number;
  depth: number;
}

export interface Kandang {
  id: string;
  name: string;
  capacity: number;
  position: Position3D;
  size: Size3D;
  foodSpot?: Position3D;
  waterSpot?: Position3D;
  color?: string;
  location?: string;
  type?: 'cow' | 'goat' | 'mixed';
  environment?: {
    temperature?: number;
    humidity?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Animal {
  id: string;
  animalId: string;
  tagId?: string;
  type: 'cow' | 'goat' | 'sheep';
  breed: string;
  kandangId: string;
  position?: Position3D;
  status: 'healthy' | 'sick' | 'critical' | 'quarantine';
  healthStatus?: 'healthy' | 'sick' | 'critical' | 'quarantine'; // alias for status
  photoUrl?: string;
  lastScan?: Date;
  weight?: number;
  gender?: 'male' | 'female';
  dateOfBirth?: Date;
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
