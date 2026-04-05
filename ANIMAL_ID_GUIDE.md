# Animal ID & Database Management - Complete Guide

## 🎯 What's Been Updated

### 1. **Animal ID System**
- Semua animal sekarang ada `animalId` field (contoh: `000001`, `000002`)
- AnimalId ni auto-generate secara sequential bila add animal baru
- AnimalId gantikan nama haiwan sebab livestock takde nama
- Lebih senang untuk search dan identify animals

### 2. **Image Display**
- Livestock page sekarang display gambar actual haiwan dari Firebase Storage
- Kalau takde gambar, akan display emoji (🐄 atau 🐐)
- Card design lebih cantik dengan photo preview di atas

### 3. **Improved Search**
- Boleh search guna:
  - **Animal ID** (000001)
  - **Tag ID** (E200341234)
  - **Breed** (Baka Malaysia)

### 4. **Admin Tools Page**
- Tool untuk manage database secara direct
- Boleh migrate existing data untuk add animal IDs
- View, edit, dan delete records terus dari UI

---

## 📋 How to Use

### A. Migration untuk Existing Data

1. **Navigate to Admin Tools**
   - Go to: http://localhost:3000/admin/tools
   - Atau click "Admin Tools" dalam sidebar

2. **Run Migration**
   - Click button "Run Migration"
   - Tool akan auto-generate animal IDs untuk semua existing animals
   - IDs akan start dari 000001 dan increment

3. **Verify Migration**
   - Click "Verify Database" untuk check
   - Akan show berapa animals ada ID dan berapa yang missing

### B. View & Manage Database

1. **Load All Animals**
   - Click "Load All Animals" button
   - Akan display complete list dengan all details:
     - Animal ID
     - Tag ID
     - Breed, type, gender, status
     - Weight, location
     - Photo URL
     - Document ID

2. **Edit Animal ID**
   - Click "Edit ID" button next to animal
   - Enter new ID
   - ID akan update automatically

3. **Delete Animal**
   - Click "Delete" button
   - Confirm deletion
   - Record will be removed from Firestore

### C. Add New Animal (With Auto ID)

When you add new animal through the livestock page:
1. Animal ID akan auto-generate
2. System akan find highest existing ID
3. Auto increment untuk next animal
4. Example: If last ID is 000005, new animal akan dapat 000006

---

## 🗄️ Database Structure

### Updated Firestore Schema

```typescript
{
  // Document fields in 'animals' collection
  animalId: "000001",        // NEW - Sequential ID
  tagId: "E200341234",        // RFID tag
  type: "cows",               // Type of animal
  breed: "Baka Malaysia",     // Breed name
  age: "3y",                  // Age
  gender: "male",             // Gender
  status: "healthy",          // Health status
  weight: 30,                 // Weight in kg
  location: "Kandang A",      // Location
  photoUrl: "https://...",    // Photo URL from Storage
  dateOfBirth: Timestamp,     // Birth date
  createdAt: Timestamp,       // Created date
  updatedAt: Timestamp,       // Last update
  notes: "...",               // Optional notes
  rfid: "...",                // RFID number
}
```

---

## 🎨 UI Changes

### Before vs After

**Before:**
```
┌─────────────────────────┐
│ 🐄  E200341234         │ ← Tag ID as title
│     Baka Malaysia      │
│                        │
│ Age: 3y | Weight: 30kg │
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ [  PHOTO/IMAGE HERE  ] │ ← Animal photo
│ Status badge           │
├─────────────────────────┤
│ #000001               │ ← Animal ID as main title
│ Baka Malaysia         │
│ E200341234 (small)    │ ← Tag ID secondary
│                       │
│ Age: 3y | Weight: 30kg│
└─────────────────────────┘
```

---

## 🔧 Technical Details

### Files Modified/Created

1. **Type Definitions** (`src/types/livestock.types.ts`)
   - Added `animalId` field to both interfaces
   
2. **Firestore Service** (`src/services/firestore.service.ts`)
   - Added `generateAnimalId()` function
   - Updated `create()` to auto-generate IDs
   - Updated adapter to handle animalId

3. **Livestock Page** (`src/app/admin/livestock/page.tsx`)
   - Updated card UI to display photos
   - Updated search to include animalId
   - Improved responsive design

4. **Migration Script** (`src/utils/migrate-animal-ids.ts`)
   - Standalone migration function
   - Verification function
   - Can be run from console or UI

5. **Admin Tools Page** (`src/app/admin/tools/page.tsx`)
   - NEW PAGE for database management
   - Migration interface
   - Database browser
   - CRUD operations

6. **Admin Layout** (`src/app/admin/layout.tsx`)
   - Added "Admin Tools" to navigation

---

## 📸 Firebase Storage Structure

Make sure your Firebase Storage organized macam ni:

```
gs://rfid-livestock-monitoring.firebasestorage.app/
├── animals/              ← Folder untuk animal photos
│   ├── cow_001.jpg
│   ├── cow_002.jpg
│   └── goat_001.jpg
├── animal_photos/        ← Alternative folder name
├── feeding_photos/
└── user_profile_pictures/
```

### Upload Photos via Console:
1. Go to Firebase Console > Storage
2. Navigate to `animals/` folder (create if not exists)
3. Upload photos
4. Copy download URL
5. Update animal record dengan photoUrl

---

## 🚀 Next Steps

### Immediate Actions:
1. ✅ Run migration untuk add animal IDs to existing data
2. ✅ Verify all animals have IDs
3. ✅ Upload photos to Firebase Storage
4. ✅ Update animal records dengan photo URLs

### Optional Improvements:
- [ ] Add photo upload feature in UI
- [ ] Add bulk photo upload
- [ ] Add image compression
- [ ] Add default placeholder images
- [ ] Add QR code generation for animal IDs

---

## 🐛 Troubleshooting

### Issue: "N/A" appears for Animal ID
**Solution:** Run the migration tool from Admin Tools page

### Issue: Photos not loading
**Solution:** 
1. Check Firebase Storage rules
2. Verify photo URL is correct
3. Check if photo exists in Storage
4. Make sure Storage bucket is public or authenticated

### Issue: Search not working with Animal ID
**Solution:** Make sure migration has run and all animals have animalId field

### Issue: Can't access Admin Tools
**Solution:** Check navigation in layout.tsx includes the Tools link

---

## 📝 Firebase Storage Rules

Update your storage rules untuk allow access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /animals/{allPaths=**} {
      allow read: if true; // Public read for animal photos
      allow write: if request.auth != null; // Authenticated write
    }
  }
}
```

---

## ✨ Benefits

1. **Easy Identification**: `#000001` lebih mudah remember than `E200341234`
2. **Visual Recognition**: Photos help identify animals quickly
3. **Better Search**: Search by ID, tag, or breed
4. **Professional Look**: UI looks more polished
5. **Database Management**: Direct CRUD from admin panel
6. **Migration Support**: Easy to update existing data

---

## 💡 Tips

- Animal IDs are **permanent** - don't change unless necessary
- Photos improve user experience significantly
- Use migration tool before going to production
- Regular verify database untuk ensure data integrity
- Backup database before running migrations

---

Need help? Check the Activity Log in Admin Tools page for detailed operation logs.
