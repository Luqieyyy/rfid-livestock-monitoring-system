/**
 * Migration Script: Add animalId to existing livestock records
 * 
 * This script will:
 * 1. Fetch all animals from Firestore
 * 2. Generate sequential animalId for each animal (000001, 000002, etc.)
 * 3. Update each document with the new animalId field
 * 
 * Usage:
 * - Import this in your admin page or run it from console
 * - Call: migrateAnimalIds()
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';

export interface MigrationResult {
  success: boolean;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Migrate existing livestock records to add animalId field
 */
export async function migrateAnimalIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    console.log('🚀 Starting migration: Adding animalId to livestock...');
    
    // Get all livestock documents
    const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
    const snapshot = await getDocs(livestockRef);
    
    console.log(`📊 Found ${snapshot.docs.length} livestock records`);

    if (snapshot.docs.length === 0) {
      console.log('✅ No records to migrate');
      result.success = true;
      return result;
    }

    // Process each document
    let counter = 1;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      // Skip if animalId already exists
      if (data.animalId && data.animalId !== 'N/A') {
        console.log(`⏭️  Skipping ${docSnapshot.id} - already has animalId: ${data.animalId}`);
        result.skipped++;
        continue;
      }

      // Generate animalId with leading zeros (6 digits)
      const animalId = String(counter).padStart(6, '0');
      
      try {
        // Update document
        const docRef = doc(db, COLLECTIONS.LIVESTOCK, docSnapshot.id);
        await updateDoc(docRef, { animalId });
        
        console.log(`✅ Updated ${docSnapshot.id} with animalId: ${animalId}`);
        result.updated++;
        counter++;
      } catch (error) {
        const errorMsg = `Failed to update ${docSnapshot.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${result.updated}`);
    console.log(`⏭️  Skipped (already had animalId): ${result.skipped}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
}

/**
 * Verify migration results
 */
export async function verifyMigration(): Promise<void> {
  try {
    console.log('\n🔍 Verifying migration...');
    
    const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
    const snapshot = await getDocs(livestockRef);
    
    let withAnimalId = 0;
    let withoutAnimalId = 0;
    const missingIds: string[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.animalId && data.animalId !== 'N/A') {
        withAnimalId++;
      } else {
        withoutAnimalId++;
        missingIds.push(doc.id);
      }
    });
    
    console.log('\n📊 Verification Results:');
    console.log(`✅ Records with animalId: ${withAnimalId}`);
    console.log(`❌ Records without animalId: ${withoutAnimalId}`);
    
    if (missingIds.length > 0) {
      console.log('\n❌ Documents missing animalId:');
      missingIds.forEach(id => console.log(`  - ${id}`));
    } else {
      console.log('\n✅ All records have animalId!');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Export for use in browser console or admin tools
if (typeof window !== 'undefined') {
  (window as any).migrateAnimalIds = migrateAnimalIds;
  (window as any).verifyMigration = verifyMigration;
  console.log('💡 Migration tools loaded! Use: migrateAnimalIds() or verifyMigration()');
}
