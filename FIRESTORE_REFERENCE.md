# Firebase Firestore Collections Reference

This document provides a complete reference for the Firestore collections used by the Livestock Management System.

---

## 📚 Collection: `livestock`

### Purpose
Stores comprehensive information about all livestock on the farm.

### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  tagId: string;                 // Unique livestock tag identifier (e.g., "COW-2024-001")
  type: string;                  // Type of livestock: "cattle" | "goat" | "sheep" | "poultry" | "other"
  breed: string;                 // Breed name (e.g., "Holstein", "Angus", "Boer")
  dateOfBirth: Timestamp;        // Firebase Timestamp
  gender: string;                // "male" | "female"
  status: string;                // "healthy" | "sick" | "quarantine" | "deceased"
  weight: number;                // Weight in kilograms
  location: string;              // Farm location or pen number
  createdAt: Timestamp;          // Firebase Timestamp (server timestamp)
  updatedAt: Timestamp;          // Firebase Timestamp (server timestamp)
}
```

### Example Document

```json
{
  "id": "abc123xyz",
  "tagId": "COW-2024-001",
  "type": "cattle",
  "breed": "Holstein",
  "dateOfBirth": "2022-03-15T00:00:00Z",
  "gender": "female",
  "status": "healthy",
  "weight": 450.5,
  "location": "Barn A - Pen 3",
  "createdAt": "2024-01-10T08:30:00Z",
  "updatedAt": "2024-12-20T14:45:00Z"
}
```

### Firestore Rules Example

```javascript
match /livestock/{livestockId} {
  allow read: if true; // Public read for buyer portal
  allow write: if request.auth != null; // Authenticated write
  
  allow create: if request.resource.data.keys().hasAll([
    'tagId', 'type', 'breed', 'dateOfBirth', 'gender', 
    'status', 'weight', 'location'
  ]);
  
  allow update: if request.auth != null;
}
```

### Indexes Required

```javascript
// Composite index: type + status
Collection: livestock
Fields: type (Ascending), status (Ascending)

// Composite index: status + createdAt  
Collection: livestock
Fields: status (Ascending), createdAt (Descending)
```

---

## 💊 Collection: `health_records`

### Purpose
Tracks all veterinary care, vaccinations, treatments, and medical checkups.

### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  livestockId: string;           // Reference to livestock document ID
  date: Timestamp;               // Date of the health event
  type: string;                  // "vaccination" | "treatment" | "checkup" | "diagnosis"
  description: string;           // Detailed description of the health event
  veterinarian?: string;         // Name of the veterinarian (optional)
  medication?: string;           // Medication name (optional)
  dosage?: string;              // Dosage information (optional)
  nextCheckup?: Timestamp;      // Date of next scheduled checkup (optional)
  status: string;               // "completed" | "ongoing" | "scheduled"
  createdAt: Timestamp;         // Firebase Timestamp (server timestamp)
}
```

### Example Document

```json
{
  "id": "health789",
  "livestockId": "abc123xyz",
  "date": "2024-12-15T10:00:00Z",
  "type": "vaccination",
  "description": "Annual vaccination for foot-and-mouth disease",
  "veterinarian": "Dr. Sarah Johnson",
  "medication": "FMD Vaccine Type O",
  "dosage": "2ml subcutaneous",
  "nextCheckup": "2025-12-15T10:00:00Z",
  "status": "completed",
  "createdAt": "2024-12-15T10:30:00Z"
}
```

### Firestore Rules Example

```javascript
match /health_records/{recordId} {
  allow read: if request.auth != null; // Authenticated read only
  allow write: if request.auth != null; // Authenticated write
  
  allow create: if request.resource.data.keys().hasAll([
    'livestockId', 'date', 'type', 'description', 'status'
  ]);
}
```

### Indexes Required

```javascript
// Composite index: livestockId + date
Collection: health_records
Fields: livestockId (Ascending), date (Descending)

// Composite index: status + nextCheckup
Collection: health_records  
Fields: status (Ascending), nextCheckup (Ascending)

// Composite index: date + type
Collection: health_records
Fields: date (Descending), type (Ascending)
```

---

## 🧬 Collection: `breeding_records`

### Purpose
Manages breeding cycles, pregnancy tracking, and offspring records.

### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  motherId: string;              // Livestock ID of the mother
  fatherId?: string;            // Livestock ID of the father (optional)
  breedingDate: Timestamp;      // Date breeding occurred
  expectedDeliveryDate: Timestamp; // Calculated expected delivery
  actualDeliveryDate?: Timestamp;  // Actual delivery date (optional)
  numberOfOffspring?: number;   // Number of offspring born (optional)
  offspringIds?: string[];     // Array of livestock IDs for offspring (optional)
  status: string;               // "planned" | "pregnant" | "delivered" | "failed"
  notes?: string;              // Additional notes or observations (optional)
  createdAt: Timestamp;         // Firebase Timestamp (server timestamp)
  updatedAt: Timestamp;         // Firebase Timestamp (server timestamp)
}
```

### Example Document

```json
{
  "id": "breed456",
  "motherId": "abc123xyz",
  "fatherId": "def456uvw",
  "breedingDate": "2024-03-20T00:00:00Z",
  "expectedDeliveryDate": "2024-12-15T00:00:00Z",
  "actualDeliveryDate": "2024-12-18T06:30:00Z",
  "numberOfOffspring": 1,
  "offspringIds": ["ghi789rst"],
  "status": "delivered",
  "notes": "Healthy delivery, mother and calf doing well",
  "createdAt": "2024-03-20T08:00:00Z",
  "updatedAt": "2024-12-18T07:00:00Z"
}
```

### Firestore Rules Example

```javascript
match /breeding_records/{recordId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
  
  allow create: if request.resource.data.keys().hasAll([
    'motherId', 'breedingDate', 'expectedDeliveryDate', 'status'
  ]);
}
```

### Indexes Required

```javascript
// Composite index: status + breedingDate
Collection: breeding_records
Fields: status (Ascending), breedingDate (Descending)

// Composite index: motherId + breedingDate
Collection: breeding_records
Fields: motherId (Ascending), breedingDate (Descending)

// Composite index: expectedDeliveryDate + status
Collection: breeding_records
Fields: expectedDeliveryDate (Ascending), status (Ascending)
```

---

## 💰 Collection: `sales`

### Purpose
Records all sales transactions, payments, and delivery information.

### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  livestockId: string;           // Reference to sold livestock
  buyerName: string;             // Name of the buyer
  buyerContact: string;          // Phone or email contact
  saleDate: Timestamp;           // Date of sale
  price: number;                 // Sale price (in local currency)
  paymentStatus: string;         // "pending" | "partial" | "completed"
  deliveryStatus: string;        // "pending" | "in-transit" | "delivered"
  notes?: string;               // Additional sale notes (optional)
  createdAt: Timestamp;          // Firebase Timestamp (server timestamp)
}
```

### Example Document

```json
{
  "id": "sale123",
  "livestockId": "abc123xyz",
  "buyerName": "John Smith Farms",
  "buyerContact": "+1-555-123-4567",
  "saleDate": "2024-12-20T00:00:00Z",
  "price": 1500.00,
  "paymentStatus": "completed",
  "deliveryStatus": "delivered",
  "notes": "Delivered to North Farm location",
  "createdAt": "2024-12-20T09:00:00Z"
}
```

### Firestore Rules Example

```javascript
match /sales/{saleId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
  
  allow create: if request.resource.data.keys().hasAll([
    'livestockId', 'buyerName', 'buyerContact', 
    'saleDate', 'price', 'paymentStatus', 'deliveryStatus'
  ]);
}
```

### Indexes Required

```javascript
// Composite index: saleDate + paymentStatus
Collection: sales
Fields: saleDate (Descending), paymentStatus (Ascending)

// Composite index: deliveryStatus + saleDate
Collection: sales
Fields: deliveryStatus (Ascending), saleDate (Descending)

// Composite index: livestockId + saleDate
Collection: sales
Fields: livestockId (Ascending), saleDate (Descending)
```

---

## 🔧 Setting Up Firestore Collections

### Step 1: Create Collections in Firebase Console

1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Enter collection name: `livestock`
4. Add a sample document with all required fields
5. Repeat for `health_records`, `breeding_records`, and `sales`

### Step 2: Create Composite Indexes

1. Go to Firestore → Indexes tab
2. Click "Create Index"
3. Select collection and add fields as shown above
4. Set Query scope to "Collection"

### Step 3: Configure Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Livestock - Public read, authenticated write
    match /livestock/{livestockId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Health records - Authenticated only
    match /health_records/{recordId} {
      allow read, write: if request.auth != null;
    }
    
    // Breeding records - Authenticated only
    match /breeding_records/{recordId} {
      allow read, write: if request.auth != null;
    }
    
    // Sales - Authenticated only
    match /sales/{saleId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📊 Sample Data for Testing

### Sample Livestock

```javascript
// Firestore console or Firebase CLI
db.collection('livestock').add({
  tagId: 'COW-2024-001',
  type: 'cattle',
  breed: 'Holstein',
  dateOfBirth: firebase.firestore.Timestamp.fromDate(new Date('2022-03-15')),
  gender: 'female',
  status: 'healthy',
  weight: 450.5,
  location: 'Barn A - Pen 3',
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### Sample Health Record

```javascript
db.collection('health_records').add({
  livestockId: 'abc123xyz', // Replace with actual livestock ID
  date: firebase.firestore.Timestamp.fromDate(new Date('2024-12-15')),
  type: 'vaccination',
  description: 'Annual FMD vaccination',
  veterinarian: 'Dr. Sarah Johnson',
  medication: 'FMD Vaccine',
  dosage: '2ml',
  status: 'completed',
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

---

## 🔍 Common Queries

### Get all healthy livestock

```typescript
const q = query(
  collection(db, 'livestock'),
  where('status', '==', 'healthy'),
  orderBy('createdAt', 'desc')
);
```

### Get health records for specific livestock

```typescript
const q = query(
  collection(db, 'health_records'),
  where('livestockId', '==', livestockId),
  orderBy('date', 'desc')
);
```

### Get upcoming breeding deliveries

```typescript
const today = Timestamp.now();
const q = query(
  collection(db, 'breeding_records'),
  where('status', '==', 'pregnant'),
  where('expectedDeliveryDate', '>=', today),
  orderBy('expectedDeliveryDate', 'asc')
);
```

### Get recent sales

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const q = query(
  collection(db, 'sales'),
  where('saleDate', '>=', Timestamp.fromDate(thirtyDaysAgo)),
  orderBy('saleDate', 'desc')
);
```

---

## 📝 Data Validation Rules

### Livestock
- `tagId`: Required, unique, string
- `type`: Required, must be one of allowed types
- `breed`: Required, non-empty string
- `dateOfBirth`: Required, valid timestamp, not in future
- `gender`: Required, "male" or "female"
- `status`: Required, valid status value
- `weight`: Required, positive number
- `location`: Required, non-empty string

### Health Records
- `livestockId`: Required, must reference existing livestock
- `date`: Required, valid timestamp
- `type`: Required, valid type
- `description`: Required, non-empty string
- `status`: Required, valid status value

### Breeding Records
- `motherId`: Required, must reference existing livestock
- `breedingDate`: Required, valid timestamp
- `expectedDeliveryDate`: Required, after breedingDate
- `status`: Required, valid status value

### Sales
- `livestockId`: Required, must reference existing livestock
- `buyerName`: Required, non-empty string
- `buyerContact`: Required, valid contact format
- `saleDate`: Required, valid timestamp
- `price`: Required, positive number
- `paymentStatus`: Required, valid status
- `deliveryStatus`: Required, valid status

---

## 🚨 Important Notes

1. **Server Timestamps**: Always use `FieldValue.serverTimestamp()` for `createdAt` and `updatedAt`
2. **Reference Integrity**: Ensure `livestockId`, `motherId`, `fatherId` reference existing documents
3. **Status Values**: Use consistent status strings across platforms
4. **Indexes**: Create all required composite indexes before heavy usage
5. **Security**: Never expose write access publicly in production
6. **Backup**: Regularly backup Firestore data
7. **Cost**: Monitor Firestore usage to manage costs

---

For more information:
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Query Documentation](https://firebase.google.com/docs/firestore/query-data/queries)
