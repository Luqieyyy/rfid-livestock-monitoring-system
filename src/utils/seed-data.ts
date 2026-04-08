import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

// ── helpers ──────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function ts(date: Date) {
  return Timestamp.fromDate(date);
}

// ── sample animals ────────────────────────────────────────────

const ANIMALS = [
  { animalId: '00001', name: 'Lembu Hitam', type: 'cow', breed: 'Kedah-Kelantan', gender: 'male', weight: 320, status: 'healthy', rfid: 'RFC-001-KK', location: 'Kandang A', age: '3 years' },
  { animalId: '00002', name: 'Lembu Coklat', type: 'cow', breed: 'Brahman', gender: 'female', weight: 280, status: 'healthy', rfid: 'RFC-002-BH', location: 'Kandang A', age: '2 years' },
  { animalId: '00003', name: 'Kambing Putih', type: 'goat', breed: 'Boer', gender: 'female', weight: 45, status: 'healthy', rfid: 'RFC-003-BG', location: 'Kandang B', age: '1.5 years' },
  { animalId: '00004', name: 'Kambing Belang', type: 'goat', breed: 'Katjang', gender: 'male', weight: 38, status: 'sick', rfid: 'RFC-004-KJ', location: 'Kandang B', age: '2 years' },
  { animalId: '00005', name: 'Kambing Coklat', type: 'goat', breed: 'Boer', gender: 'female', weight: 42, status: 'healthy', rfid: 'RFC-005-BC', location: 'Kandang B', age: '1.5 years' },
  { animalId: '00006', name: 'Lembu Jantan Besar', type: 'cow', breed: 'Simmental', gender: 'male', weight: 450, status: 'healthy', rfid: 'RFC-006-SM', location: 'Kandang A', age: '4 years' },
  { animalId: '00007', name: 'Kambing Hitam', type: 'goat', breed: 'Boer', gender: 'male', weight: 52, status: 'quarantine', rfid: 'RFC-007-BQ', location: 'Kandang D', age: '2.5 years' },
  { animalId: '00008', name: 'Lembu Betina Muda', type: 'cow', breed: 'Brahman', gender: 'female', weight: 210, status: 'healthy', rfid: 'RFC-008-BM', location: 'Kandang A', age: '1.5 years' },
];

// ── sample vaccinations ───────────────────────────────────────
// Will be built dynamically after animals are inserted so we have their IDs

function buildVaccinations(animalDocs: Array<{ id: string; data: (typeof ANIMALS)[0] }>) {
  const records: any[] = [];

  const get = (animalId: string) => animalDocs.find((a) => a.data.animalId === animalId);

  // Completed — already done, has next due in future
  const a1 = get('00001');
  if (a1) records.push({
    animalId: a1.id, animalTagId: a1.data.animalId, animalName: a1.data.name, animalType: a1.data.type,
    vaccineType: 'FMD', batchNumber: 'LOT-2024-FMD-01', dosage: '2ml IM',
    administeredBy: 'Dr. Azri', administeredAt: ts(daysAgo(180)),
    nextDueAt: ts(daysFromNow(5)), status: 'scheduled', notes: 'Booster due soon',
    kandangId: 'Kandang A', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  const a2 = get('00002');
  if (a2) records.push({
    animalId: a2.id, animalTagId: a2.data.animalId, animalName: a2.data.name, animalType: a2.data.type,
    vaccineType: 'Brucellosis', batchNumber: 'LOT-2024-BRU-03', dosage: '2ml SC',
    administeredBy: 'Dr. Azri', administeredAt: ts(daysAgo(90)),
    nextDueAt: ts(daysFromNow(90)), status: 'scheduled',
    kandangId: 'Kandang A', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  // Overdue
  const a3 = get('00003');
  if (a3) records.push({
    animalId: a3.id, animalTagId: a3.data.animalId, animalName: a3.data.name, animalType: a3.data.type,
    vaccineType: 'PPR', batchNumber: 'LOT-2024-PPR-01', dosage: '1ml IM',
    administeredBy: 'Encik Haris', administeredAt: ts(daysAgo(365)),
    nextDueAt: ts(daysAgo(5)), status: 'overdue', notes: 'Sudah overdue 5 hari',
    kandangId: 'Kandang B', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  const a4 = get('00004');
  if (a4) records.push({
    animalId: a4.id, animalTagId: a4.data.animalId, animalName: a4.data.name, animalType: a4.data.type,
    vaccineType: 'FMD', dosage: '2ml IM',
    administeredBy: 'Dr. Azri', administeredAt: ts(daysAgo(200)),
    nextDueAt: ts(daysAgo(20)), status: 'overdue', notes: 'Haiwan sakit — semak dulu sebelum vaksin',
    kandangId: 'Kandang B', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  // Completed history
  const a5 = get('00005');
  if (a5) {
    records.push({
      animalId: a5.id, animalTagId: a5.data.animalId, animalName: a5.data.name, animalType: a5.data.type,
      vaccineType: 'Anthrax', batchNumber: 'LOT-2023-ANT-07', dosage: '1ml SC',
      administeredBy: 'Dr. Farah', administeredAt: ts(daysAgo(300)),
      nextDueAt: ts(daysFromNow(65)), status: 'scheduled',
      kandangId: 'Kandang C', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    records.push({
      animalId: a5.id, animalTagId: a5.data.animalId, animalName: a5.data.name, animalType: a5.data.type,
      vaccineType: 'FMD', batchNumber: 'LOT-2024-FMD-02', dosage: '2ml IM',
      administeredBy: 'Dr. Farah', administeredAt: ts(daysAgo(120)),
      nextDueAt: ts(daysFromNow(60)), status: 'scheduled',
      kandangId: 'Kandang C', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  }

  const a6 = get('00006');
  if (a6) records.push({
    animalId: a6.id, animalTagId: a6.data.animalId, animalName: a6.data.name, animalType: a6.data.type,
    vaccineType: 'Blackleg', batchNumber: 'LOT-2024-BLK-02', dosage: '5ml IM',
    administeredBy: 'Dr. Azri', administeredAt: ts(daysAgo(30)),
    nextDueAt: ts(daysFromNow(335)), status: 'completed',
    kandangId: 'Kandang A', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  const a7 = get('00007');
  if (a7) records.push({
    animalId: a7.id, animalTagId: a7.data.animalId, animalName: a7.data.name, animalType: a7.data.type,
    vaccineType: 'PPR', dosage: '1ml IM',
    administeredBy: 'Encik Haris', administeredAt: ts(daysAgo(400)),
    nextDueAt: ts(daysAgo(35)), status: 'overdue', notes: 'Dalam kuarantin — pending approval vet',
    kandangId: 'Kandang D', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  const a8 = get('00008');
  if (a8) records.push({
    animalId: a8.id, animalTagId: a8.data.animalId, animalName: a8.data.name, animalType: a8.data.type,
    vaccineType: 'Brucellosis', batchNumber: 'LOT-2024-BRU-05', dosage: '2ml SC',
    administeredBy: 'Dr. Farah', administeredAt: ts(daysAgo(60)),
    nextDueAt: ts(daysFromNow(120)), status: 'completed',
    kandangId: 'Kandang C', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });

  return records;
}

// ── feeding activities seed ───────────────────────────────────

function buildFeedings(animalDocs: Array<{ id: string; data: (typeof ANIMALS)[0] }>) {
  const feedTypes = ['Hay', 'Silage', 'Concentrate', 'Grass', 'Palm kernel'];
  const feeders = ['Ali bin Ahmad', 'Encik Haris', 'Siti Rahimah'];
  const records: any[] = [];

  for (let i = 0; i < 15; i++) {
    const animal = animalDocs[i % animalDocs.length];
    const fedAt = daysAgo(Math.floor(Math.random() * 7));
    records.push({
      livestockId: animal.id,
      livestockAnimalId: animal.data.animalId,
      farmerId: 'staff_001',
      farmerName: feeders[i % feeders.length],
      feedType: feedTypes[i % feedTypes.length],
      quantity: parseFloat((Math.random() * 5 + 1).toFixed(1)),
      unit: 'kg',
      fedAt: ts(fedAt),
      location: animal.data.location,
      createdAt: serverTimestamp(),
    });
  }

  return records;
}

// ── health records seed ───────────────────────────────────────

function buildHealthRecords(animalDocs: Array<{ id: string; data: (typeof ANIMALS)[0] }>) {
  const records: any[] = [];
  const vets = ['Dr. Azri', 'Dr. Farah'];

  const a4 = animalDocs.find((a) => a.data.animalId === '00004');
  if (a4) {
    records.push({
      livestockId: a4.id, type: 'diagnosis', status: 'ongoing',
      description: 'Kambing menunjukkan tanda-tanda demam dan tidak mahu makan.',
      veterinarian: 'Dr. Azri', medication: 'Oxytetracycline', dosage: '10mg/kg',
      date: ts(daysAgo(3)), nextCheckup: ts(daysFromNow(4)),
      createdAt: serverTimestamp(),
    });
  }

  const a7 = animalDocs.find((a) => a.data.animalId === '00007');
  if (a7) {
    records.push({
      livestockId: a7.id, type: 'checkup', status: 'scheduled',
      description: 'Kuarantin — disyaki jangkitan kulit. Perlu pemeriksaan lanjut.',
      veterinarian: 'Dr. Farah',
      date: ts(daysAgo(1)), nextCheckup: ts(daysFromNow(2)),
      createdAt: serverTimestamp(),
    });
  }

  const a1 = animalDocs.find((a) => a.data.animalId === '00001');
  if (a1) {
    records.push({
      livestockId: a1.id, type: 'checkup', status: 'completed',
      description: 'Pemeriksaan rutin 6-bulanan. Semua normal.',
      veterinarian: vets[0],
      date: ts(daysAgo(45)),
      createdAt: serverTimestamp(),
    });
  }

  return records;
}

// ── main seed function ────────────────────────────────────────

export interface SeedResult {
  animalsInserted: number;
  animalsSkipped: number;
  vaccinationsInserted: number;
  feedingsInserted: number;
  healthInserted: number;
  logs: string[];
}

export async function seedFirestore(opts = { skipExistingAnimals: true }): Promise<SeedResult> {
  const db = getFirebaseDb();
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(msg); };

  let animalsInserted = 0;
  let animalsSkipped = 0;

  // 1. Check existing animals
  const existingSnap = await getDocs(collection(db, 'animals'));
  const existingAnimalIds = new Set(existingSnap.docs.map((d) => d.data().animalId));

  log(`Found ${existingSnap.docs.length} existing animals in Firestore.`);

  // 2. Insert animals — use animalId as doc ID e.g. "ANIMAL-00001"
  const animalDocs: Array<{ id: string; data: (typeof ANIMALS)[0] }> = [];

  existingSnap.docs.forEach((d) => {
    const data = d.data();
    const match = ANIMALS.find((a) => a.animalId === data.animalId);
    if (match) animalDocs.push({ id: d.id, data: match });
  });

  for (const animal of ANIMALS) {
    if (opts.skipExistingAnimals && existingAnimalIds.has(animal.animalId)) {
      log(`⏭ Skipped animal ${animal.animalId} — already exists`);
      animalsSkipped++;
      continue;
    }
    const docId = `ANIMAL-${animal.animalId}`;
    await setDoc(doc(db, 'animals', docId), {
      ...animal,
      dateOfBirth: ts(daysAgo(Math.floor(Math.random() * 1000 + 365))),
      lastScan: ts(daysAgo(Math.floor(Math.random() * 7))),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    animalDocs.push({ id: docId, data: animal });
    log(`✅ Inserted animal ${docId} — ${animal.name}`);
    animalsInserted++;
  }

  // 3. Insert vaccinations — e.g. "VAC-00003-PPR-1"
  const vaccinations = buildVaccinations(animalDocs);
  let vaccinationsInserted = 0;
  for (let i = 0; i < vaccinations.length; i++) {
    const vac = vaccinations[i];
    const tag = vac.animalTagId || vac.animalId.slice(-5);
    const vacType = (vac.vaccineType as string).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    const docId = `VAC-${tag}-${vacType}-${String(i + 1).padStart(2, '0')}`;
    await setDoc(doc(db, 'vaccinations', docId), vac);
    vaccinationsInserted++;
  }
  log(`✅ Inserted ${vaccinationsInserted} vaccination records`);

  // 4. Insert feeding activities — e.g. "FEED-001", "FEED-002"
  const feedings = buildFeedings(animalDocs);
  let feedingsInserted = 0;
  for (let i = 0; i < feedings.length; i++) {
    const docId = `FEED-${String(i + 1).padStart(3, '0')}`;
    await setDoc(doc(db, 'feedingActivities', docId), feedings[i]);
    feedingsInserted++;
  }
  log(`✅ Inserted ${feedingsInserted} feeding activity records`);

  // 5. Insert health records — e.g. "HEALTH-00004-01"
  const healthRecords = buildHealthRecords(animalDocs);
  let healthInserted = 0;
  for (let i = 0; i < healthRecords.length; i++) {
    const h = healthRecords[i];
    const animalDoc = animalDocs.find((a) => a.id === h.livestockId);
    const tag = animalDoc?.data.animalId || String(i + 1).padStart(5, '0');
    const docId = `HEALTH-${tag}-${String(i + 1).padStart(2, '0')}`;
    await setDoc(doc(db, 'health_records', docId), h);
    healthInserted++;
  }
  log(`✅ Inserted ${healthInserted} health records`);

  log(`🎉 Seed complete!`);

  return { animalsInserted, animalsSkipped, vaccinationsInserted, feedingsInserted, healthInserted, logs };
}
