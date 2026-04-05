/**
 * Firestore Initial Setup Script
 * Run this once to populate kandang collection with sample data
 * 
 * To use:
 * 1. Go to your Firebase Console
 * 2. Navigate to Firestore Database
 * 3. Create collection "kandang"
 * 4. Add these documents manually or use the data below
 */

export const INITIAL_KANDANG_DATA = [
  {
    id: 'kandang_a',
    name: 'Kandang A',
    location: 'Zone A - North',
    type: 'cattle',
    capacity: 25,
    position: { x: 0, y: 0, z: 0 },
    size: { width: 10, height: 5, depth: 8 },
    environment: {
      temperature: 28,
      humidity: 65
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kandang_b',
    name: 'Kandang B',
    location: 'Zone B - South',
    type: 'goat',
    capacity: 30,
    position: { x: 15, y: 0, z: 0 },
    size: { width: 12, height: 5, depth: 8 },
    environment: {
      temperature: 27,
      humidity: 60
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kandang_c',
    name: 'Kandang C',
    location: 'Zone C - East',
    type: 'cattle',
    capacity: 20,
    position: { x: 0, y: 0, z: 15 },
    size: { width: 10, height: 5, depth: 8 },
    environment: {
      temperature: 29,
      humidity: 68
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'kandang_d',
    name: 'Kandang D',
    location: 'Zone D - West',
    type: 'sheep',
    capacity: 35,
    position: { x: -15, y: 0, z: 0 },
    size: { width: 15, height: 5, depth: 10 },
    environment: {
      temperature: 26,
      humidity: 62
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'quarantine_area',
    name: 'Quarantine Area',
    location: 'Quarantine - Isolated',
    type: 'mixed',
    capacity: 10,
    position: { x: 20, y: 0, z: 20 },
    size: { width: 8, height: 5, depth: 6 },
    environment: {
      temperature: 25,
      humidity: 55
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'medical_bay',
    name: 'Medical Bay',
    location: 'Medical - Treatment Area',
    type: 'mixed',
    capacity: 5,
    position: { x: -20, y: 0, z: 20 },
    size: { width: 6, height: 5, depth: 5 },
    environment: {
      temperature: 24,
      humidity: 58
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * MANUAL SETUP INSTRUCTIONS:
 * 
 * 1. Open Firebase Console: https://console.firebase.google.com
 * 2. Select your project: "RFID Livestock Monitoring"
 * 3. Go to Firestore Database
 * 4. Click "Start collection"
 * 5. Collection ID: "kandang"
 * 6. For each item in INITIAL_KANDANG_DATA above:
 *    - Click "Add document"
 *    - Document ID: use the 'id' field (e.g., "kandang_a")
 *    - Add fields as shown in the data structure
 *    - For nested objects (position, size, environment), use "Map" type
 *    - For dates, use "timestamp" type
 * 
 * OR use the automated script below in Firebase Functions or Cloud Shell
 */

/**
 * Automated Setup Script (Firebase Admin SDK)
 * Run this in Firebase Functions or Node.js with Firebase Admin
 */
export const setupKandangCollection = async (adminDb: any) => {
  const batch = adminDb.batch();
  
  INITIAL_KANDANG_DATA.forEach((kandang) => {
    const docRef = adminDb.collection('kandang').doc(kandang.id);
    batch.set(docRef, {
      ...kandang,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  await batch.commit();
  console.log('✅ Kandang collection initialized with', INITIAL_KANDANG_DATA.length, 'documents');
};

/**
 * Quick Copy-Paste for Firebase Console (JSON format)
 * Copy each object and paste in Firebase Console's "Add document" form
 */
export const KANDANG_JSON = `
// Document ID: kandang_a
{
  "name": "Kandang A",
  "location": "Zone A - North",
  "type": "cattle",
  "capacity": 25,
  "position": { "x": 0, "y": 0, "z": 0 },
  "size": { "width": 10, "height": 5, "depth": 8 },
  "environment": { "temperature": 28, "humidity": 65 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}

// Document ID: kandang_b
{
  "name": "Kandang B",
  "location": "Zone B - South",
  "type": "goat",
  "capacity": 30,
  "position": { "x": 15, "y": 0, "z": 0 },
  "size": { "width": 12, "height": 5, "depth": 8 },
  "environment": { "temperature": 27, "humidity": 60 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}

// Document ID: kandang_c
{
  "name": "Kandang C",
  "location": "Zone C - East",
  "type": "cattle",
  "capacity": 20,
  "position": { "x": 0, "y": 0, "z": 15 },
  "size": { "width": 10, "height": 5, "depth": 8 },
  "environment": { "temperature": 29, "humidity": 68 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}

// Document ID: kandang_d
{
  "name": "Kandang D",
  "location": "Zone D - West",
  "type": "sheep",
  "capacity": 35,
  "position": { "x": -15, "y": 0, "z": 0 },
  "size": { "width": 15, "height": 5, "depth": 10 },
  "environment": { "temperature": 26, "humidity": 62 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}

// Document ID: quarantine_area
{
  "name": "Quarantine Area",
  "location": "Quarantine - Isolated",
  "type": "mixed",
  "capacity": 10,
  "position": { "x": 20, "y": 0, "z": 20 },
  "size": { "width": 8, "height": 5, "depth": 6 },
  "environment": { "temperature": 25, "humidity": 55 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}

// Document ID: medical_bay
{
  "name": "Medical Bay",
  "location": "Medical - Treatment Area",
  "type": "mixed",
  "capacity": 5,
  "position": { "x": -20, "y": 0, "z": 20 },
  "size": { "width": 6, "height": 5, "depth": 5 },
  "environment": { "temperature": 24, "humidity": 58 },
  "createdAt": "CURRENT_TIMESTAMP",
  "updatedAt": "CURRENT_TIMESTAMP"
}
`;
