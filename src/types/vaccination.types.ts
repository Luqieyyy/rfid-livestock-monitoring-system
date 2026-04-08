export type VaccineStatus = 'scheduled' | 'completed' | 'overdue';

export interface VaccinationRecord {
  id: string;
  animalId: string;       // references animals doc id
  animalTagId?: string;   // display tag e.g. "00001"
  animalName?: string;
  animalType?: string;    // cow / goat / sheep
  vaccineType: string;    // e.g. "FMD", "Brucellosis"
  batchNumber?: string;
  dosage?: string;
  administeredBy?: string;
  administeredAt: Date;
  nextDueAt?: Date;
  status: VaccineStatus;
  notes?: string;
  kandangId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaccineScheduleTemplate {
  id: string;
  vaccineType: string;
  intervalDays: number;
  applicableTypes: string[];  // ['cow','goat','sheep'] or ['all']
  notes?: string;
  createdAt: Date;
}
