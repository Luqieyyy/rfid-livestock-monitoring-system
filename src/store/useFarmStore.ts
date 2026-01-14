import { create } from 'zustand';
import { Kandang, Animal, KandangStats, FarmStats } from '@/types/farm.types';

interface FarmStore {
  // State
  kandangs: Kandang[];
  animals: Animal[];
  selectedKandang: Kandang | null;
  selectedAnimal: Animal | null;
  loading: boolean;
  error: string | null;

  // Actions
  setKandangs: (kandangs: Kandang[]) => void;
  setAnimals: (animals: Animal[]) => void;
  setSelectedKandang: (kandang: Kandang | null) => void;
  setSelectedAnimal: (animal: Animal | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getAnimalsInKandang: (kandangId: string) => Animal[];
  getKandangStats: (kandangId: string) => KandangStats;
  calculateFarmStats: () => FarmStats;
}

// @ts-ignore - Zustand v5 typing issue
export const useFarmStore = create<FarmStore>((set: any, get: any) => ({
  // Initial state
  kandangs: [],
  animals: [],
  selectedKandang: null,
  selectedAnimal: null,
  loading: false,
  error: null,

  // Actions
  setKandangs: (kandangs: Kandang[]) => {
    set({ kandangs });
  },

  setAnimals: (animals: Animal[]) => {
    set({ animals });
  },

  setSelectedKandang: (kandang: Kandang | null) => set({ selectedKandang: kandang }),
  
  setSelectedAnimal: (animal: Animal | null) => set({ selectedAnimal: animal }),
  
  setLoading: (loading: boolean) => set({ loading }),
  
  setError: (error: string | null) => set({ error }),

  // Get animals in specific kandang
  getAnimalsInKandang: (kandangId: string) => {
    return get().animals.filter((animal: Animal) => animal.kandangId === kandangId);
  },

  // Get stats for a specific kandang
  getKandangStats: (kandangId: string) => {
    const kandang = get().kandangs.find((k: Kandang) => k.id === kandangId);
    const animals = get().getAnimalsInKandang(kandangId);
    
    if (!kandang) {
      return {
        total: 0,
        healthy: 0,
        sick: 0,
        critical: 0,
        available: 0,
        occupancyPercent: 0,
      };
    }

    const healthy = animals.filter((a: Animal) => a.status === 'healthy').length;
    const sick = animals.filter((a: Animal) => a.status === 'sick').length;
    const critical = animals.filter((a: Animal) => a.status === 'critical').length;
    const total = animals.length;
    const available = kandang.capacity - total;
    const occupancyPercent = Math.round((total / kandang.capacity) * 100);

    return {
      total,
      healthy,
      sick,
      critical,
      available,
      occupancyPercent,
    };
  },

  // Calculate overall farm stats
  calculateFarmStats: () => {
    const { kandangs, animals } = get();
    
    const totalKandang = kandangs.length;
    const totalAnimals = animals.length;
    const totalCapacity = kandangs.reduce((sum: number, k: Kandang) => sum + k.capacity, 0);
    const averageOccupancy = totalCapacity > 0 
      ? Math.round((totalAnimals / totalCapacity) * 100) 
      : 0;
    
    const atCapacity = kandangs.filter((k: Kandang) => {
      const animalsInKandang = animals.filter((a: Animal) => a.kandangId === k.id).length;
      return (animalsInKandang / k.capacity) >= 0.9;
    }).length;

    const healthyAnimals = animals.filter((a: Animal) => a.status === 'healthy').length;
    const sickAnimals = animals.filter((a: Animal) => a.status === 'sick').length;
    const criticalAnimals = animals.filter((a: Animal) => a.status === 'critical').length;

    return {
      totalKandang,
      totalAnimals,
      totalCapacity,
      averageOccupancy,
      atCapacity,
      healthyAnimals,
      sickAnimals,
      criticalAnimals,
    };
  },
}));
