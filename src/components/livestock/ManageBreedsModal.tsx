'use client';

import { useState } from 'react';

interface ManageBreedsModalProps {
  onClose: () => void;
  customBreeds: { cow: string[]; goat: string[] };
  onSaveBreed: (type: 'cow' | 'goat', breedName: string) => Promise<boolean>;
  onDeleteBreed: (type: 'cow' | 'goat', breedName: string) => Promise<boolean>;
}

export default function ManageBreedsModal({ onClose, customBreeds, onSaveBreed, onDeleteBreed }: ManageBreedsModalProps) {
  const [selectedType, setSelectedType] = useState<'cow' | 'goat'>('cow');
  const [newBreed, setNewBreed] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddBreed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreed.trim()) return;

    setSaving(true);
    const success = await onSaveBreed(selectedType, newBreed.trim());
    setSaving(false);

    if (success) {
      setNewBreed('');
      alert('Breed added successfully!');
    } else {
      alert('Failed to add breed. Please try again.');
    }
  };

  const handleDeleteBreed = async (breedName: string) => {
    if (!confirm(`Delete breed "${breedName}"?`)) return;

    const success = await onDeleteBreed(selectedType, breedName);
    if (success) {
      alert('Breed deleted successfully!');
    } else {
      alert('Failed to delete breed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Manage Breeds</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Type Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('cow')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                selectedType === 'cow'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🐄 Cow Breeds
            </button>
            <button
              onClick={() => setSelectedType('goat')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                selectedType === 'goat'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🐐 Goat Breeds
            </button>
          </div>

          {/* Add New Breed Form */}
          <form onSubmit={handleAddBreed} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-emerald-900 mb-2">
              Add New {selectedType === 'cow' ? 'Cow' : 'Goat'} Breed
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBreed}
                onChange={(e) => setNewBreed(e.target.value)}
                placeholder="Enter breed name..."
                className="flex-1 px-4 py-2.5 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={saving || !newBreed.trim()}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Custom Breeds List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Custom {selectedType === 'cow' ? 'Cow' : 'Goat'} Breeds ({customBreeds[selectedType].length})
            </h3>
            {customBreeds[selectedType].length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No custom breeds added yet</p>
                <p className="text-sm mt-1">Add breeds using the form above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customBreeds[selectedType].map((breed) => (
                  <div
                    key={breed}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-300 transition-colors"
                  >
                    <span className="font-medium text-gray-900">{breed}</span>
                    <button
                      onClick={() => handleDeleteBreed(breed)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete breed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">About Breed Management</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>• Custom breeds will be available when adding/editing livestock</li>
                  <li>• Default breeds cannot be deleted</li>
                  <li>• Changes are saved to Firestore automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
