/**
 * FarmSense — Animal Photo Seeder
 * Downloads cow/goat images from Unsplash, uploads to Firebase Storage,
 * then updates photoUrl in each Firestore animal document.
 * Run AFTER seed.mjs: node seed-photos.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const storage = getStorage(app);

// ─── Unsplash fixed photo IDs (stable direct URLs) ───────────────────────────
// Using specific photo IDs — these are permanent links, not random
// Lorem Picsum — stable, free, no auth, returns real photos by seed ID
// Using fixed seed IDs so same animal always gets same photo
const COW_PHOTOS = [
  'https://picsum.photos/seed/cow1/600/400',
  'https://picsum.photos/seed/cow2/600/400',
  'https://picsum.photos/seed/cow3/600/400',
  'https://picsum.photos/seed/cow4/600/400',
  'https://picsum.photos/seed/cow5/600/400',
];

const GOAT_PHOTOS = [
  'https://picsum.photos/seed/goat1/600/400',
  'https://picsum.photos/seed/goat2/600/400',
  'https://picsum.photos/seed/goat3/600/400',
  'https://picsum.photos/seed/goat4/600/400',
  'https://picsum.photos/seed/goat5/600/400',
];

// ─── Download image as buffer ────────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FarmSense-Seeder/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url} — ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Upload to Firebase Storage & return download URL ───────────────────────
async function uploadToStorage(buffer, path) {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, buffer, { contentType: 'image/jpeg' });
  return await getDownloadURL(snapshot.ref);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function seedPhotos() {
  console.log('📸 FarmSense Photo Seeder Starting...\n');

  const snapshot = await getDocs(collection(db, 'animals'));
  const animals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Found ${animals.length} animals in Firestore.\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < animals.length; i++) {
    const animal = animals[i];
    const isCow = animal.type === 'cow';
    const photoPool = isCow ? COW_PHOTOS : GOAT_PHOTOS;
    const photoUrl = photoPool[i % photoPool.length];

    try {
      process.stdout.write(`  [${i + 1}/${animals.length}] ${animal.type} ${animal.animalId} — downloading...`);

      const buffer = await downloadImage(photoUrl);

      process.stdout.write(' uploading...');
      const storagePath = `animals/${animal.id}.jpg`;
      const downloadUrl = await uploadToStorage(buffer, storagePath);

      await updateDoc(doc(db, 'animals', animal.id), { photoUrl: downloadUrl });

      process.stdout.write(' ✓\n');
      success++;

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      process.stdout.write(` ✗ (${err.message})\n`);
      failed++;
    }
  }

  console.log(`\n✅ Done! ${success} updated, ${failed} failed.`);
  process.exit(0);
}

seedPhotos().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
