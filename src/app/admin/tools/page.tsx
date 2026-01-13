'use client';

import { useState } from 'react';
import { migrateAnimalIds, verifyMigration, MigrationResult } from '@/utils/migrate-animal-ids';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/utils/constants';

export default function AdminToolsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [showAnimals, setShowAnimals] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const handleMigration = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Starting migration...');
    
    try {
      const migrationResult = await migrateAnimalIds();
      setResult(migrationResult);
      
      if (migrationResult.success) {
        addLog(`✅ Migration completed successfully!`);
        addLog(`Updated: ${migrationResult.updated}, Skipped: ${migrationResult.skipped}`);
      } else {
        addLog(`❌ Migration completed with errors`);
        migrationResult.errors.forEach(err => addLog(`Error: ${err}`));
      }
    } catch (error) {
      addLog(`❌ Migration failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Starting verification...');
    
    try {
      await verifyMigration();
      addLog('✅ Verification completed - check console for details');
    } catch (error) {
      addLog(`❌ Verification failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllAnimals = async () => {
    setLoading(true);
    addLog('Loading all animals from Firestore...');
    
    try {
      const livestockRef = collection(db, COLLECTIONS.LIVESTOCK);
      const snapshot = await getDocs(livestockRef);
      
      const animalData = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      
      setAnimals(animalData);
      setShowAnimals(true);
      addLog(`✅ Loaded ${animalData.length} animals`);
    } catch (error) {
      addLog(`❌ Failed to load animals: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnimal = async (docId: string, animalId: string) => {
    if (!confirm(`Are you sure you want to delete animal ${animalId}?`)) {
      return;
    }
    
    setLoading(true);
    addLog(`Deleting animal ${animalId}...`);
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.LIVESTOCK, docId));
      addLog(`✅ Deleted animal ${animalId}`);
      // Reload animals
      await loadAllAnimals();
    } catch (error) {
      addLog(`❌ Failed to delete animal: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAnimalId = async (docId: string, oldId: string) => {
    const newId = prompt(`Enter new Animal ID for ${oldId}:`, oldId);
    if (!newId || newId === oldId) return;
    
    setLoading(true);
    addLog(`Updating animal ID from ${oldId} to ${newId}...`);
    
    try {
      await updateDoc(doc(db, COLLECTIONS.LIVESTOCK, docId), { animalId: newId });
      addLog(`✅ Updated animal ID to ${newId}`);
      // Reload animals
      await loadAllAnimals();
    } catch (error) {
      addLog(`❌ Failed to update animal ID: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Tools</h1>
        <p className="text-gray-500 mt-1">Database management and migration tools</p>
      </div>

      {/* Migration Tools */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Migration Tools</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2">Add Animal IDs</h3>
            <p className="text-sm text-blue-700 mb-4">
              Generate sequential animal IDs (000001, 000002...) for all existing livestock records
            </p>
            <button
              onClick={handleMigration}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Running...' : 'Run Migration'}
            </button>
          </div>

          <div className="p-4 bg-green-50 rounded-xl">
            <h3 className="font-semibold text-green-900 mb-2">Verify Migration</h3>
            <p className="text-sm text-green-700 mb-4">
              Check which records have animal IDs and which ones are missing
            </p>
            <button
              onClick={handleVerification}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Verify Database'}
            </button>
          </div>
        </div>

        {/* Migration Result */}
        {result && (
          <div className={`p-4 rounded-xl ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              Migration Result
            </h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">✅ Updated: {result.updated} records</p>
              <p className="text-gray-700">⏭️ Skipped: {result.skipped} records</p>
              <p className="text-gray-700">❌ Errors: {result.errors.length}</p>
              {result.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-100 rounded">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-800 text-xs">{err}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Database Browser */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Database Browser</h2>
          <button
            onClick={loadAllAnimals}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Load All Animals'}
          </button>
        </div>

        {showAnimals && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Total animals: {animals.length}</p>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {animals.map((animal, index) => (
                <div key={animal.docId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-emerald-600">
                          #{animal.animalId || 'NO ID'}
                        </span>
                        <span className="text-xs text-gray-500">{animal.tagId}</span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {animal.breed}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Type: {animal.type} | Gender: {animal.gender} | Status: {animal.status}</p>
                        <p>Weight: {animal.weight}kg | Location: {animal.location}</p>
                        {animal.photoUrl && (
                          <p className="text-blue-600 truncate">Photo: {animal.photoUrl}</p>
                        )}
                        <p className="text-gray-400 font-mono">Doc ID: {animal.docId}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateAnimalId(animal.docId, animal.animalId || 'N/A')}
                        disabled={loading}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        Edit ID
                      </button>
                      <button
                        onClick={() => deleteAnimal(animal.docId, animal.animalId || animal.tagId)}
                        disabled={loading}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Activity Log</h2>
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-green-400 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Always verify your database before running migrations</li>
              <li>Animal IDs are sequential (000001, 000002, etc.)</li>
              <li>Migration will skip records that already have an animalId</li>
              <li>Use the Database Browser to view, edit, and delete records directly</li>
              <li>All operations are logged in the Activity Log below</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
