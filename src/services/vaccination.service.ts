import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { VaccinationRecord, VaccineScheduleTemplate, VaccineStatus } from '@/types/vaccination.types';

const COL = {
  VACCINATIONS: 'vaccinations',
  SCHEDULES: 'vaccine_schedules',
};

function toDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  return new Date(val);
}

function convertDates(data: any): any {
  return {
    ...data,
    administeredAt: toDate(data.administeredAt),
    nextDueAt: data.nextDueAt ? toDate(data.nextDueAt) : undefined,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

// ==================== VACCINATION RECORDS ====================

export const vaccinationService = {
  async getAll(): Promise<VaccinationRecord[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, COL.VACCINATIONS));
    const records = snap.docs.map((d) => ({ id: d.id, ...convertDates(d.data()) }) as VaccinationRecord);
    // sync overdue status client-side
    return syncOverdueStatus(records);
  },

  async getByAnimal(animalId: string): Promise<VaccinationRecord[]> {
    const db = getFirebaseDb();
    const q = query(collection(db, COL.VACCINATIONS), where('animalId', '==', animalId));
    const snap = await getDocs(q);
    const records = snap.docs.map((d) => ({ id: d.id, ...convertDates(d.data()) }) as VaccinationRecord);
    return syncOverdueStatus(records);
  },

  async getUpcoming(days = 30): Promise<VaccinationRecord[]> {
    const all = await vaccinationService.getAll();
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return all
      .filter((r) => r.nextDueAt && r.nextDueAt <= cutoff)
      .sort((a, b) => (a.nextDueAt?.getTime() ?? 0) - (b.nextDueAt?.getTime() ?? 0));
  },

  async getOverdue(): Promise<VaccinationRecord[]> {
    const all = await vaccinationService.getAll();
    return all.filter((r) => r.status === 'overdue');
  },

  async create(data: Omit<VaccinationRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = getFirebaseDb();
    const id = generateVacId(data.animalTagId || data.animalId, data.vaccineType);
    await setDoc(doc(db, COL.VACCINATIONS, id), {
      ...data,
      administeredAt: Timestamp.fromDate(new Date(data.administeredAt)),
      nextDueAt: data.nextDueAt ? Timestamp.fromDate(new Date(data.nextDueAt)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  },

  async update(id: string, data: Partial<VaccinationRecord>): Promise<void> {
    const db = getFirebaseDb();
    const payload: any = { ...data, updatedAt: serverTimestamp() };
    if (data.administeredAt) payload.administeredAt = Timestamp.fromDate(new Date(data.administeredAt));
    if (data.nextDueAt) payload.nextDueAt = Timestamp.fromDate(new Date(data.nextDueAt));
    await updateDoc(doc(db, COL.VACCINATIONS, id), payload);
  },

  async delete(id: string): Promise<void> {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, COL.VACCINATIONS, id));
  },

  // Mark a scheduled/overdue record as completed and create next scheduled entry
  async markDone(id: string, administeredAt: Date, nextDueAt?: Date, administeredBy?: string): Promise<void> {
    const db = getFirebaseDb();
    await vaccinationService.update(id, { status: 'completed', administeredAt, nextDueAt, administeredBy });
    if (nextDueAt) {
      const snap = await getDoc(doc(db, COL.VACCINATIONS, id));
      if (snap.exists()) {
        const d = snap.data();
        await vaccinationService.create({
          animalId: d.animalId,
          animalTagId: d.animalTagId,
          animalName: d.animalName,
          animalType: d.animalType,
          vaccineType: d.vaccineType,
          status: 'scheduled',
          administeredAt: nextDueAt,
          nextDueAt: undefined,
          kandangId: d.kandangId,
        });
      }
    }
  },
};

// ==================== SCHEDULE TEMPLATES ====================

export const vaccineScheduleService = {
  async getAll(): Promise<VaccineScheduleTemplate[]> {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, COL.SCHEDULES));
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: toDate(d.data().createdAt),
    })) as VaccineScheduleTemplate[];
  },

  async create(data: Omit<VaccineScheduleTemplate, 'id' | 'createdAt'>): Promise<string> {
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, COL.SCHEDULES), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },
};

// ==================== UTILITY ====================

function syncOverdueStatus(records: VaccinationRecord[]): VaccinationRecord[] {
  const now = new Date();
  return records.map((r) => {
    if (r.status === 'completed') return r;
    if (r.nextDueAt && r.nextDueAt < now) return { ...r, status: 'overdue' as VaccineStatus };
    if (r.administeredAt && r.status === 'scheduled' && r.administeredAt < now && !r.nextDueAt) {
      return { ...r, status: 'overdue' as VaccineStatus };
    }
    return r;
  });
}

// e.g. VAC-00003-FMD-20260408-a3f
function generateVacId(animalTag: string, vaccineType: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 5);
  const vac = vaccineType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
  const tag = animalTag.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
  return `VAC-${tag}-${vac}-${date}-${rand}`;
}

export function calcNextDueAt(administeredAt: Date, intervalDays: number): Date {
  return new Date(administeredAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}
