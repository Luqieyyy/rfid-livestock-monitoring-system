# Kandang Collection Setup Guide

## Firebase Firestore Setup Instructions

### Method 1: Firebase Console (Recommended for Quick Setup)

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your project: **RFID Livestock Monitoring**

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - You should see your existing collections: `animals`, etc.

3. **Create Kandang Collection**
   - Click "Start collection" or "+ Add collection"
   - Collection ID: `kandang`

4. **Add Documents**
   Copy and paste each document below (6 documents total):

#### Document 1: kandang_a
```
Document ID: kandang_a

Fields:
name: "Kandang A" (string)
location: "Zone A - North" (string)
type: "cattle" (string)
capacity: 25 (number)
position: (map)
  - x: 0 (number)
  - y: 0 (number)
  - z: 0 (number)
size: (map)
  - width: 10 (number)
  - height: 5 (number)
  - depth: 8 (number)
environment: (map)
  - temperature: 28 (number)
  - humidity: 65 (number)
createdAt: [Click "Current timestamp"]
updatedAt: [Click "Current timestamp"]
```

#### Document 2: kandang_b
```
Document ID: kandang_b

Fields:
name: "Kandang B" (string)
location: "Zone B - South" (string)
type: "goat" (string)
capacity: 30 (number)
position: (map)
  - x: 15 (number)
  - y: 0 (number)
  - z: 0 (number)
size: (map)
  - width: 12 (number)
  - height: 5 (number)
  - depth: 8 (number)
environment: (map)
  - temperature: 27 (number)
  - humidity: 60 (number)
createdAt: [Current timestamp]
updatedAt: [Current timestamp]
```

#### Document 3: kandang_c
```
Document ID: kandang_c

Fields:
name: "Kandang C" (string)
location: "Zone C - East" (string)
type: "cattle" (string)
capacity: 20 (number)
position: (map)
  - x: 0 (number)
  - y: 0 (number)
  - z: 15 (number)
size: (map)
  - width: 10 (number)
  - height: 5 (number)
  - depth: 8 (number)
environment: (map)
  - temperature: 29 (number)
  - humidity: 68 (number)
createdAt: [Current timestamp]
updatedAt: [Current timestamp]
```

#### Document 4: kandang_d
```
Document ID: kandang_d

Fields:
name: "Kandang D" (string)
location: "Zone D - West" (string)
type: "sheep" (string)
capacity: 35 (number)
position: (map)
  - x: -15 (number)
  - y: 0 (number)
  - z: 0 (number)
size: (map)
  - width: 15 (number)
  - height: 5 (number)
  - depth: 10 (number)
environment: (map)
  - temperature: 26 (number)
  - humidity: 62 (number)
createdAt: [Current timestamp]
updatedAt: [Current timestamp]
```

#### Document 5: quarantine_area
```
Document ID: quarantine_area

Fields:
name: "Quarantine Area" (string)
location: "Quarantine - Isolated" (string)
type: "mixed" (string)
capacity: 10 (number)
position: (map)
  - x: 20 (number)
  - y: 0 (number)
  - z: 20 (number)
size: (map)
  - width: 8 (number)
  - height: 5 (number)
  - depth: 6 (number)
environment: (map)
  - temperature: 25 (number)
  - humidity: 55 (number)
createdAt: [Current timestamp]
updatedAt: [Current timestamp]
```

#### Document 6: medical_bay
```
Document ID: medical_bay

Fields:
name: "Medical Bay" (string)
location: "Medical - Treatment Area" (string)
type: "mixed" (string)
capacity: 5 (number)
position: (map)
  - x: -20 (number)
  - y: 0 (number)
  - z: 20 (number)
size: (map)
  - width: 6 (number)
  - height: 5 (number)
  - depth: 5 (number)
environment: (map)
  - temperature: 24 (number)
  - humidity: 58 (number)
createdAt: [Current timestamp]
updatedAt: [Current timestamp]
```

---

### Method 2: Quick Import Script

If you have Firebase Admin SDK setup, run this in Node.js or Firebase Functions:

```javascript
const admin = require('firebase-admin');

// Initialize (if not already done)
// admin.initializeApp();

const db = admin.firestore();

const kandangData = [
  {
    id: 'kandang_a',
    name: 'Kandang A',
    location: 'Zone A - North',
    type: 'cattle',
    capacity: 25,
    position: { x: 0, y: 0, z: 0 },
    size: { width: 10, height: 5, depth: 8 },
    environment: { temperature: 28, humidity: 65 }
  },
  {
    id: 'kandang_b',
    name: 'Kandang B',
    location: 'Zone B - South',
    type: 'goat',
    capacity: 30,
    position: { x: 15, y: 0, z: 0 },
    size: { width: 12, height: 5, depth: 8 },
    environment: { temperature: 27, humidity: 60 }
  },
  {
    id: 'kandang_c',
    name: 'Kandang C',
    location: 'Zone C - East',
    type: 'cattle',
    capacity: 20,
    position: { x: 0, y: 0, z: 15 },
    size: { width: 10, height: 5, depth: 8 },
    environment: { temperature: 29, humidity: 68 }
  },
  {
    id: 'kandang_d',
    name: 'Kandang D',
    location: 'Zone D - West',
    type: 'sheep',
    capacity: 35,
    position: { x: -15, y: 0, z: 0 },
    size: { width: 15, height: 5, depth: 10 },
    environment: { temperature: 26, humidity: 62 }
  },
  {
    id: 'quarantine_area',
    name: 'Quarantine Area',
    location: 'Quarantine - Isolated',
    type: 'mixed',
    capacity: 10,
    position: { x: 20, y: 0, z: 20 },
    size: { width: 8, height: 5, depth: 6 },
    environment: { temperature: 25, humidity: 55 }
  },
  {
    id: 'medical_bay',
    name: 'Medical Bay',
    location: 'Medical - Treatment Area',
    type: 'mixed',
    capacity: 5,
    position: { x: -20, y: 0, z: 20 },
    size: { width: 6, height: 5, depth: 5 },
    environment: { temperature: 24, humidity: 58 }
  }
];

async function setupKandang() {
  const batch = db.batch();
  
  kandangData.forEach(data => {
    const { id, ...fields } = data;
    const docRef = db.collection('kandang').doc(id);
    batch.set(docRef, {
      ...fields,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log('✅ Kandang collection created with', kandangData.length, 'documents');
}

setupKandang();
```

---

## Verification

After setup, verify in Firebase Console:
1. Go to Firestore Database
2. Click on `kandang` collection
3. You should see 6 documents:
   - kandang_a
   - kandang_b
   - kandang_c
   - kandang_d
   - quarantine_area
   - medical_bay

## Next Steps

Once kandang collection is created:
1. ✅ Farm Overview page will display all kandang
2. ✅ Livestock forms will show kandang dropdown
3. ✅ Animals will be grouped by their kandang location
4. ✅ Stats will calculate based on kandang occupancy

## Troubleshooting

**Issue:** Kandang dropdown is empty in Livestock form
- **Solution:** Make sure the `kandang` collection exists and has documents

**Issue:** Animals not showing in Farm Overview
- **Solution:** Make sure animal `location` field matches kandang `name` exactly
  - Example: Animal location should be "Kandang A" to match the kandang named "Kandang A"

**Issue:** Can't add documents
- **Solution:** Check Firestore rules - ensure you have write permissions
