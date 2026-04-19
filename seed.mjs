/**
 * FarmSense — Firestore Seed Script
 * Seeds: kandang (3), animals (50), health_records (~70), vaccinations (~50), feedings (~50)
 * Run: node seed.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

// ─── Firebase Config ────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyAG58RiFhpteOjkbDuzOiuhpEZon3LSVPg',
  authDomain: 'rfid-livestock-monitoring.firebaseapp.com',
  projectId: 'rfid-livestock-monitoring',
  storageBucket: 'rfid-livestock-monitoring.firebasestorage.app',
  messagingSenderId: '608616411896',
  appId: '1:608616411896:web:7f41f0f6cae328979e410d',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ts = (date) => Timestamp.fromDate(new Date(date));
const now = () => Timestamp.now();
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n, len = 5) => String(n).padStart(len, '0');

// ─── Reference Data ──────────────────────────────────────────────────────────
const cowBreeds    = ['Kedah-Kelantan', 'Brahman', 'Friesian', 'Simmental', 'Limousin'];
const goatBreeds   = ['Boer', 'Jamnapari', 'Katjang', 'Saanen', 'Anglo-Nubian'];
const vets         = ['Dr. Ahmad Farid', 'Dr. Nurul Ain', 'Dr. Hafizuddin', 'Dr. Siti Ramlah'];
const farmers      = [
  { id: 'farmer001', name: 'Ahmad Razif' },
  { id: 'farmer002', name: 'Mohd Hafiz' },
  { id: 'farmer003', name: 'Zulaikha Binti Ali' },
];
const feedTypes    = ['Rumput Napier', 'Hay', 'Silage', 'Pellet Concentrate', 'Dedak Padi', 'Corn Silage'];
const vaccineTypes = ['FMD', 'Brucellosis', 'Anthrax', 'Hemorrhagic Septicemia', 'PPR', 'Rabies'];
const locations    = ['Kandang A', 'Kandang B', 'Kandang C'];
const healthStatuses = ['completed', 'ongoing', 'scheduled'];
const recordTypes  = ['vaccination', 'treatment', 'checkup', 'diagnosis'];
const medications  = ['Penicillin 500mg', 'Ivermectin', 'Oxytetracycline', 'Albendazole', 'Dexamethasone', 'Vitamin B Complex'];

// ─── 1. Kandang ──────────────────────────────────────────────────────────────
const kandangData = [
  {
    name: 'Kandang A',
    type: 'cow',
    capacity: 15,
    location: 'Blok Utara',
    foodSpot: 'Slot F-A1',
    waterSpot: 'Slot W-A1',
    createdAt: ts('2024-01-10'),
    updatedAt: ts('2025-03-01'),
  },
  {
    name: 'Kandang B',
    type: 'cow',
    capacity: 15,
    location: 'Blok Utara',
    foodSpot: 'Slot F-B1',
    waterSpot: 'Slot W-B1',
    createdAt: ts('2024-01-10'),
    updatedAt: ts('2025-03-01'),
  },
  {
    name: 'Kandang C',
    type: 'goat',
    capacity: 25,
    location: 'Blok Selatan',
    foodSpot: 'Slot F-C1',
    waterSpot: 'Slot W-C1',
    createdAt: ts('2024-01-15'),
    updatedAt: ts('2025-03-01'),
  },
];

// ─── 2. Animals (50 total: 25 cow, 25 goat) ─────────────────────────────────
const animalStatuses = ['healthy', 'healthy', 'healthy', 'sick', 'quarantine', 'sold'];

function buildAnimals() {
  const animals = [];

  // Cows — 25 (animalId 00001–00025 for type=cow)
  for (let i = 1; i <= 25; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const dob = new Date(2022, randNum(0, 11), randNum(1, 28));
    const age = `${Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))} years`;
    animals.push({
      animalId: pad(i),
      type: 'cow',
      breed: rand(cowBreeds),
      age,
      status: rand(animalStatuses),
      gender,
      weight: randNum(280, 520),
      location: i <= 13 ? 'Kandang A' : 'Kandang B',
      rfid: `COW${pad(i, 8)}`,
      tagId: `TAG-C${pad(i, 4)}`,
      dateOfBirth: ts(dob),
      notes: rand([
        'Healthy and active.',
        'Requires vitamin supplement.',
        'Recently dewormed.',
        'Good appetite.',
        null,
      ]),
      eatingStatus: rand(['normal', 'normal', 'low', 'high']),
      lastScan: ts(new Date(Date.now() - randNum(1, 30) * 86400000)),
      photoUrl: `https://placehold.co/400x300/166534/ffffff?text=Cow+${pad(i)}`,
      purchasePrice: randNum(2500, 5000),
      purchaseDate: ts(new Date(2023, randNum(0, 11), randNum(1, 28))),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  // Goats — 25 (animalId 00001–00025 for type=goat)
  for (let i = 1; i <= 25; i++) {
    const gender = i % 2 === 0 ? 'female' : 'male';
    const dob = new Date(2022, randNum(0, 11), randNum(1, 28));
    const age = `${Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000))} years`;
    animals.push({
      animalId: pad(i),
      type: 'goat',
      breed: rand(goatBreeds),
      age,
      status: rand(animalStatuses),
      gender,
      weight: randNum(25, 80),
      location: 'Kandang C',
      rfid: `GOT${pad(i, 8)}`,
      tagId: `TAG-G${pad(i, 4)}`,
      dateOfBirth: ts(dob),
      notes: rand([
        'Healthy and active.',
        'Requires vitamin supplement.',
        'Post-pregnancy recovery.',
        'Good milk producer.',
        null,
      ]),
      eatingStatus: rand(['normal', 'normal', 'low', 'high']),
      lastScan: ts(new Date(Date.now() - randNum(1, 30) * 86400000)),
      photoUrl: `https://placehold.co/400x300/1e3a5f/ffffff?text=Goat+${pad(i)}`,
      purchasePrice: randNum(500, 1500),
      purchaseDate: ts(new Date(2023, randNum(0, 11), randNum(1, 28))),
      createdAt: now(),
      updatedAt: now(),
    });
  }

  return animals;
}

// ─── 3. Health Records (builder) ──────────────────────────────────────────
function buildHealthRecords(animalDocIds) {
  const records = [];
  // ~1-2 health records per animal, total ~70
  animalDocIds.forEach((id, idx) => {
    const count = randNum(1, 2);
    for (let r = 0; r < count; r++) {
      const baseDate = new Date(Date.now() - randNum(10, 365) * 86400000);
      const nextCheckup = new Date(baseDate.getTime() + randNum(30, 90) * 86400000);
      records.push({
        livestockId: id,
        type: rand(recordTypes),
        description: rand([
          'Routine health checkup. Animal in good condition.',
          'Treated for mild respiratory infection.',
          'Deworming treatment administered.',
          'Weight loss noted — dietary adjustment recommended.',
          'Post-vaccination observation. No adverse reaction.',
          'Hoof trimming and foot rot treatment.',
          'Eye infection treated with antibiotic eye drops.',
          'Skin lesion examination — no sign of disease.',
        ]),
        status: rand(healthStatuses),
        veterinarian: rand(vets),
        medication: rand([...medications, null, null]),
        dosage: rand(['5ml', '10ml', '1 tablet', '2 tablets', '500mg', null]),
        date: ts(baseDate),
        nextCheckup: ts(nextCheckup),
        createdAt: now(),
      });
    }
  });
  return records;
}

// ─── 4. Vaccination Records (builder) ───────────────────────────────────────
function buildVaccinations(animalDocIds, animalsMeta) {
  const records = [];
  animalDocIds.forEach((id, idx) => {
    const meta = animalsMeta[idx];
    const adminDate = new Date(Date.now() - randNum(30, 300) * 86400000);
    const nextDue = new Date(adminDate.getTime() + randNum(90, 365) * 86400000);
    const isPast = nextDue < new Date();
    records.push({
      animalId: id,
      animalTagId: meta.animalId,
      animalName: `${meta.type.charAt(0).toUpperCase() + meta.type.slice(1)} ${meta.animalId}`,
      animalType: meta.type,
      vaccineType: rand(vaccineTypes),
      batchNumber: `BATCH-${randNum(1000, 9999)}`,
      dosage: rand(['2ml', '5ml', '1ml', '3ml']),
      administeredBy: rand(vets),
      administeredAt: ts(adminDate),
      nextDueAt: ts(nextDue),
      status: isPast ? 'overdue' : rand(['completed', 'completed', 'scheduled']),
      notes: rand([
        'No adverse reactions observed.',
        'Mild swelling at injection site — resolved in 2 days.',
        'Annual booster dose.',
        null,
      ]),
      kandangId: meta.location,
      createdAt: now(),
      updatedAt: now(),
    });
  });
  return records;
}

// ─── 5. Vaccine Schedule Templates ──────────────────────────────────────────
const vaccineScheduleTemplates = [
  {
    vaccineType: 'FMD',
    intervalDays: 180,
    applicableTypes: ['cow', 'goat'],
    notes: 'Foot and Mouth Disease — biannual vaccination compulsory.',
    createdAt: now(),
  },
  {
    vaccineType: 'Brucellosis',
    intervalDays: 365,
    applicableTypes: ['cow', 'goat'],
    notes: 'Annual — female animals only. Brucella S19 or RB51.',
    createdAt: now(),
  },
  {
    vaccineType: 'Anthrax',
    intervalDays: 365,
    applicableTypes: ['cow', 'goat'],
    notes: 'Annual — required in high-risk areas.',
    createdAt: now(),
  },
  {
    vaccineType: 'Hemorrhagic Septicemia',
    intervalDays: 180,
    applicableTypes: ['cow'],
    notes: 'HS vaccine — biannual, especially before rainy season.',
    createdAt: now(),
  },
  {
    vaccineType: 'PPR',
    intervalDays: 365,
    applicableTypes: ['goat'],
    notes: 'Peste des Petits Ruminants — annual for goat.',
    createdAt: now(),
  },
];

// ─── 6. Feeding Activities (builder) ────────────────────────────────────────
function buildFeedings(animalDocIds, animalsMeta) {
  const records = [];
  // ~1 feeding record per animal, spread across last 30 days
  animalDocIds.forEach((id, idx) => {
    const meta = animalsMeta[idx];
    const farmer = rand(farmers);
    const daysAgo = randNum(0, 30);
    const fedAt = new Date(Date.now() - daysAgo * 86400000);
    const isCow = meta.type === 'cow';
    records.push({
      livestockId: id,
      livestockAnimalId: meta.animalId,
      livestockTagId: meta.tagId ?? `TAG-${meta.animalId}`,
      farmerId: farmer.id,
      farmerName: farmer.name,
      feedType: isCow ? rand(['Rumput Napier', 'Silage', 'Hay', 'Pellet Concentrate']) : rand(feedTypes),
      quantity: isCow ? randNum(5, 15) : randNum(1, 5),
      unit: 'kg',
      fedAt: ts(fedAt),
      location: meta.location,
      notes: rand([
        'Morning feeding session.',
        'Evening feeding session.',
        'Additional feed — post-checkup.',
        null,
      ]),
      createdAt: now(),
    });
  });
  return records;
}

// ─── Main Seeder ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 FarmSense Seed Script Starting...\n');

  // 1. Kandang
  console.log('📦 Seeding kandang...');
  const kandangIds = [];
  for (const k of kandangData) {
    const ref = await addDoc(collection(db, 'kandang'), k);
    kandangIds.push(ref.id);
    console.log(`  ✓ ${k.name} → ${ref.id}`);
  }

  // 2. Animals
  console.log('\n🐄 Seeding animals (50: 25 cow + 25 goat)...');
  const animalsMeta = buildAnimals();
  const animalDocIds = [];
  for (let i = 0; i < animalsMeta.length; i++) {
    const ref = await addDoc(collection(db, 'animals'), animalsMeta[i]);
    animalDocIds.push(ref.id);
    if ((i + 1) % 10 === 0) console.log(`  ✓ ${i + 1}/50 animals seeded`);
  }

  // 3. Health Records
  console.log('\n🏥 Seeding health_records...');
  const healthRecs = buildHealthRecords(animalDocIds);
  for (const rec of healthRecs) {
    await addDoc(collection(db, 'health_records'), rec);
  }
  console.log(`  ✓ ${healthRecs.length} health records seeded`);

  // 4. Vaccination Records
  console.log('\n💉 Seeding vaccinations...');
  const vaccRecs = buildVaccinations(animalDocIds, animalsMeta);
  for (const rec of vaccRecs) {
    await addDoc(collection(db, 'vaccinations'), rec);
  }
  console.log(`  ✓ ${vaccRecs.length} vaccination records seeded`);

  // 5. Vaccine Schedule Templates
  console.log('\n📅 Seeding vaccine_schedules (templates)...');
  for (const tmpl of vaccineScheduleTemplates) {
    const ref = await addDoc(collection(db, 'vaccine_schedules'), tmpl);
    console.log(`  ✓ ${tmpl.vaccineType} → ${ref.id}`);
  }

  // 6. Feeding Activities
  console.log('\n🌾 Seeding feedings...');
  const feedRecs = buildFeedings(animalDocIds, animalsMeta);
  for (const rec of feedRecs) {
    await addDoc(collection(db, 'feedings'), rec);
  }
  console.log(`  ✓ ${feedRecs.length} feeding records seeded`);

  console.log('\n✅ Seed complete!');
  console.log(`
Summary:
  kandang          : ${kandangData.length}
  animals          : ${animalsMeta.length}
  health_records   : ${healthRecs.length}
  vaccinations     : ${vaccRecs.length}
  vaccine_schedules: ${vaccineScheduleTemplates.length}
  feedings         : ${feedRecs.length}
`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
