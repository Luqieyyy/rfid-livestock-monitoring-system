import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Kandang, Animal, Position3D, Size3D } from '@/types/farm.types';

const COLLECTIONS = {
  KANDANG: 'kandang',
  ANIMALS: 'animals',
};

// Helper to convert Firestore data
const convertTimestamp = (data: any): any => {
  const converted: any = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// ==================== KANDANG SERVICES ====================

export const kandangService = {
  // Get all kandang
  async getAll(): Promise<Kandang[]> {
    try {
      const kandangRef = collection(db, COLLECTIONS.KANDANG);
      const snapshot = await getDocs(kandangRef);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as Kandang[];
    } catch (error) {
      console.error('Error fetching kandang:', error);
      throw error;
    }
  },

  // Get single kandang
  async getById(id: string): Promise<Kandang | null> {
    try {
      const docRef = doc(db, COLLECTIONS.KANDANG, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...convertTimestamp(docSnap.data()),
        } as Kandang;
      }
      return null;
    } catch (error) {
      console.error('Error fetching kandang:', error);
      throw error;
    }
  },

  // Create new kandang
  async create(data: Omit<Kandang, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const kandangRef = collection(db, COLLECTIONS.KANDANG);
      const docRef = await addDoc(kandangRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating kandang:', error);
      throw error;
    }
  },

  // Update kandang
  async update(id: string, data: Partial<Kandang>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.KANDANG, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating kandang:', error);
      throw error;
    }
  },

  // Delete kandang
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.KANDANG, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting kandang:', error);
      throw error;
    }
  },
};

// ==================== ANIMAL SERVICES ====================

export const farmAnimalService = {
  // Get all animals
  async getAll(): Promise<Animal[]> {
    try {
      const animalsRef = collection(db, COLLECTIONS.ANIMALS);
      const snapshot = await getDocs(animalsRef);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as Animal[];
    } catch (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
  },

  // Get animals in specific kandang
  async getByKandang(kandangId: string): Promise<Animal[]> {
    try {
      const animalsRef = collection(db, COLLECTIONS.ANIMALS);
      const q = query(animalsRef, where('kandangId', '==', kandangId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as Animal[];
    } catch (error) {
      console.error('Error fetching animals by kandang:', error);
      throw error;
    }
  },

  // Update animal position (for drag-and-drop)
  async updatePosition(id: string, position: Position3D, kandangId?: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ANIMALS, id);
      const updateData: any = {
        position,
        updatedAt: serverTimestamp(),
      };
      
      if (kandangId) {
        updateData.kandangId = kandangId;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating animal position:', error);
      throw error;
    }
  },

  // Move animal to different kandang
  async moveToKandang(animalId: string, newKandangId: string, newPosition: Position3D): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ANIMALS, animalId);
      await updateDoc(docRef, {
        kandangId: newKandangId,
        position: newPosition,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error moving animal:', error);
      throw error;
    }
  },
};

// ==================== UTILITY FUNCTIONS ====================

export const farmUtils = {
  // Generate random position within kandang bounds
  generateRandomPosition(kandangSize: Size3D): Position3D {
    return {
      x: (Math.random() - 0.5) * (kandangSize.width - 1),
      y: 0,
      z: (Math.random() - 0.5) * (kandangSize.depth - 1),
    };
  },

  // Check if position is valid (within bounds)
  isPositionValid(position: Position3D, kandangSize: Size3D): boolean {
    return (
      Math.abs(position.x) <= kandangSize.width / 2 &&
      Math.abs(position.z) <= kandangSize.depth / 2
    );
  },

  // Calculate distance between two positions
  calculateDistance(pos1: Position3D, pos2: Position3D): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  // Get color based on occupancy percentage
  getOccupancyColor(percentage: number): string {
    if (percentage >= 90) return '#ef4444'; // red
    if (percentage >= 70) return '#f59e0b'; // amber
    if (percentage >= 50) return '#3b82f6'; // blue
    return '#10b981'; // green
  },

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'sick': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  },
};
