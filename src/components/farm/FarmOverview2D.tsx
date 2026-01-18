'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Home, 
  Plus, 
  MapPin, 
  Activity,
  Thermometer,
  Droplets,
  AlertTriangle,
  Check,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  X,
  UtensilsCrossed,
  DoorOpen
} from 'lucide-react';
import { kandangService } from '@/services/farm.service';
import { livestockService } from '@/services/firestore.service';
import { Kandang } from '@/types/farm.types';
import { Livestock } from '@/types/livestock.types';

// Simple 2D Kandang Card Component
function KandangCard({ 
  kandang, 
  animals, 
  isSelected, 
  onClick,
  onUpdatePositions
}: { 
  kandang: Kandang; 
  animals: Livestock[];
  isSelected: boolean;
  onClick: () => void;
  onUpdatePositions: (id: string, foodSpot: { x: number; y: number }, entrance: { x: number; y: number }) => void;
}) {
  const [draggedItem, setDraggedItem] = useState<'food' | 'entrance' | null>(null);
  
  // Match animals by kandang name (location field in livestock)
  const kandangAnimals = animals.filter(a => a.location === kandang.name);
  const healthyCount = kandangAnimals.filter(a => a.status === 'healthy').length;
  const sickCount = kandangAnimals.filter(a => a.status === 'sick' || a.status === 'quarantine').length;
  const capacity = kandang.capacity || 20;
  const occupancyPercent = (kandangAnimals.length / capacity) * 100;

  const getStatusColor = () => {
    if (sickCount > 0) return 'border-red-400 bg-red-50';
    if (occupancyPercent > 80) return 'border-orange-400 bg-orange-50';
    return 'border-emerald-400 bg-emerald-50';
  };

  const getStatusIcon = () => {
    if (sickCount > 0) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (occupancyPercent > 80) return <Activity className="w-4 h-4 text-orange-500" />;
    return <Check className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200
        ${isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-lg' : 'shadow-md hover:shadow-lg'}
        ${getStatusColor()}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-emerald-500' : 'bg-white/80'}`}>
            {kandang.type === 'goat' ? (
              <Image src="/goat.png" alt="Goat" width={40} height={40} className="object-cover" />
            ) : kandang.type === 'cow' ? (
              <Image src="/cow.jpg" alt="Cow" width={40} height={40} className="object-cover rounded" />
            ) : (
              <div className="flex gap-0.5">
                <Image src="/cow.jpg" alt="Cow" width={20} height={40} className="object-cover" />
                <Image src="/goat.png" alt="Goat" width={20} height={40} className="object-cover" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{kandang.name}</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {kandang.location || 'No location'}
            </p>
            <p className="text-xs font-medium text-emerald-600">
              {kandang.type === 'cow' && '🐮 Cow Only'}
              {kandang.type === 'goat' && '🐐 Goat Only'}
              {kandang.type !== 'cow' && kandang.type !== 'goat' && '🐮🐐 Mixed'}
            </p>
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {/* 2D Farm Grid - Realistic Kandang with Grass & Border */}
      <div 
        className="mb-3 p-4 rounded-xl shadow-2xl relative overflow-hidden border-8 border-amber-800"
        style={{
          backgroundImage: 'url(/grass.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '360px'
        }}
      >
        {/* Farm Content */}
        <div className="relative z-10 grid grid-cols-4 gap-4 p-3">
          {[...Array(16)].map((_, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            
            // Scatter animals randomly across grid
            const animalPositions = kandangAnimals.map((_, idx) => {
              const seed = idx * 7 + 13;
              return (seed % 16);
            });
            
            const animalsInThisCell = kandangAnimals.filter((_, idx) => animalPositions[idx] === i);
            
            // Check if this is food spot
            const isFoodSpot = kandang.foodSpot && 
              Math.floor(kandang.foodSpot.x) === col && 
              Math.floor(kandang.foodSpot.y) === row;
            
            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              if (draggedItem === 'food') {
                onUpdatePositions(kandang.id, { x: col, y: row }, { 
                  x: kandang.waterSpot?.x || 3, 
                  y: kandang.waterSpot?.y || 0 
                });
              }
              setDraggedItem(null);
            };
            
            const handleDragOver = (e: React.DragEvent) => {
              e.preventDefault();
            };
            
            return (
              <div
                key={i}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`
                  aspect-square rounded flex flex-col items-center justify-center
                  transition-all duration-200 relative
                  ${draggedItem ? 'bg-yellow-200/40 border-2 border-dashed border-yellow-600' : ''}
                `}
                style={{
                  minHeight: '70px'
                }}
              >
                {/* Food Spot - Draggable Image */}
                {isFoodSpot && (
                  <div 
                    draggable
                    onDragStart={() => setDraggedItem('food')}
                    onDragEnd={() => setDraggedItem(null)}
                    className="absolute inset-0 cursor-move hover:scale-110 transition-transform z-20 flex items-center justify-center"
                    title="Drag to move food spot"
                  >
                    <Image 
                      src="/tempat_makan.png" 
                      alt="Food Spot" 
                      width={140} 
                      height={140}
                      className="object-contain drop-shadow-2xl"
                      draggable={false}
                    />
                  </div>
                )}
                
                {/* Animals as bullet points scattered */}
                {animalsInThisCell.length > 0 && !isFoodSpot && (
                  <div className="flex flex-wrap gap-1.5 items-center justify-center">
                    {animalsInThisCell.map((animal, idx) => (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full shadow-xl border-2 border-white ${
                          animal.status === 'sick' || animal.status === 'quarantine'
                            ? 'bg-red-500' 
                            : 'bg-red-600 animate-pulse'
                        }`}
                        style={
                          animal.status !== 'sick' && animal.status !== 'quarantine'
                            ? { animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
                            : undefined
                        }
                        title={`${animal.animalId} - ${animal.status}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="relative z-10 flex items-center justify-center gap-6 text-sm font-semibold pt-3 mt-2 border-t-2 border-amber-800/40 bg-white/95 rounded-xl px-4 py-2.5 shadow-xl mx-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse" style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <span className="text-gray-700">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
            <span className="text-gray-700">Sick</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src="/tempat_makan.png" alt="Food" width={24} height={24} className="object-contain" />
            <span className="text-gray-700">Food (Drag)</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/80 rounded-lg p-2">
          <p className="text-lg font-bold text-emerald-600">{kandangAnimals.length}</p>
          <p className="text-xs text-gray-500">Animals</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2">
          <p className="text-lg font-bold text-blue-600">{healthyCount}</p>
          <p className="text-xs text-gray-500">Healthy</p>
        </div>
        <div className="bg-white/80 rounded-lg p-2">
          <p className="text-lg font-bold text-red-600">{sickCount}</p>
          <p className="text-xs text-gray-500">Sick</p>
        </div>
      </div>

      {/* Occupancy Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Occupancy</span>
          <span>{Math.round(occupancyPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(occupancyPercent, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${
              occupancyPercent > 80 ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Sidebar Detail Panel
function DetailPanel({ 
  kandang, 
  animals, 
  onClose,
  onEdit
}: { 
  kandang: Kandang | null; 
  animals: Livestock[];
  onClose: () => void;
  onEdit: (kandang: Kandang) => void;
}) {
  if (!kandang) return null;

  const kandangAnimals = animals.filter(a => a.location === kandang.name);

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">{kandang.name}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(kandang)}
            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
            title="Edit Kandang"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Kandang Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Location</span>
            <span className="font-medium">{kandang.location || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Type</span>
            <span className="font-medium capitalize">{kandang.type || 'Standard'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Capacity</span>
            <span className="font-medium">{kandang.capacity || 20} animals</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Current</span>
            <span className="font-medium text-emerald-600">{kandangAnimals.length} animals</span>
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <Thermometer className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-600">
            {kandang.environment?.temperature || 28}°C
          </p>
          <p className="text-xs text-gray-500">Temperature</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3 text-center">
          <Droplets className="w-5 h-5 text-cyan-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-cyan-600">
            {kandang.environment?.humidity || 65}%
          </p>
          <p className="text-xs text-gray-500">Humidity</p>
        </div>
      </div>

      {/* Animals List */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Animals ({kandangAnimals.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {kandangAnimals.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No animals in this kandang</p>
          ) : (
            kandangAnimals.map((animal) => (
              <div 
                key={animal.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${
                    animal.status === 'healthy' 
                      ? 'bg-emerald-500' 
                      : animal.status === 'sick'
                      ? 'bg-red-500'
                      : 'bg-orange-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">#{animal.animalId}</p>
                    <p className="text-xs text-gray-500">{animal.breed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-medium
                    ${animal.status === 'healthy' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : animal.status === 'sick'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                    }
                  `}>
                    {animal.status}
                  </span>
                  <a
                    href="/admin/livestock"
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
                    title="Inspect Livestock"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Add Kandang Modal
function AddKandangModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onAdd: (data: Partial<Kandang>) => void;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    location: string;
    type: 'cow' | 'goat';
    capacity: number;
    foodSpotX: number;
    foodSpotY: number;
    entranceX: number;
    entranceY: number;
  }>({
    name: '',
    location: '',
    type: 'cow',
    capacity: 20,
    foodSpotX: 0,
    foodSpotY: 0,
    entranceX: 3,
    entranceY: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      position: { x: 0, y: 0, z: 0 },
      size: { width: 10, height: 5, depth: 8 },
      foodSpot: { x: formData.foodSpotX, y: formData.foodSpotY, z: 0 },
      waterSpot: { x: formData.entranceX, y: formData.entranceY, z: 0 },
      environment: { temperature: 28, humidity: 65 }
    });
    setFormData({ 
      name: '', 
      location: '', 
      type: 'cow', 
      capacity: 20,
      foodSpotX: 0,
      foodSpotY: 0,
      entranceX: 3,
      entranceY: 0
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Kandang</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Kandang A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              <option value="Zone A - North">Zone A - North</option>
              <option value="Zone B - South">Zone B - South</option>
              <option value="Zone C - East">Zone C - East</option>
              <option value="Zone D - West">Zone D - West</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'cow' | 'goat' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="cow">Cow</option>
              <option value="goat">Goat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min={1}
              max={100}
            />
          </div>

          {/* 2D Farm Layout Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Farm Layout (4x4 Grid)
            </h3>
            
            {/* Food Spot Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                Food Spot Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Column (0-3)</label>
                  <input
                    type="number"
                    value={formData.foodSpotX}
                    onChange={(e) => setFormData({ ...formData, foodSpotX: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Row (0-3)</label>
                  <input
                    type="number"
                    value={formData.foodSpotY}
                    onChange={(e) => setFormData({ ...formData, foodSpotY: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
              </div>
            </div>

            {/* Entrance/Exit Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-blue-500" />
                Entrance/Exit Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Column (0-3)</label>
                  <input
                    type="number"
                    value={formData.entranceX}
                    onChange={(e) => setFormData({ ...formData, entranceX: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Row (0-3)</label>
                  <input
                    type="number"
                    value={formData.entranceY}
                    onChange={(e) => setFormData({ ...formData, entranceY: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="grid grid-cols-4 gap-1">
                {[...Array(16)].map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isFoodSpot = col === formData.foodSpotX && row === formData.foodSpotY;
                  const isEntrance = col === formData.entranceX && row === formData.entranceY;
                  
                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square rounded border flex items-center justify-center text-xs
                        ${isFoodSpot ? 'bg-orange-100 border-orange-400' : ''}
                        ${isEntrance ? 'bg-blue-100 border-blue-400' : ''}
                        ${!isFoodSpot && !isEntrance ? 'bg-gray-100 border-gray-300' : ''}
                      `}
                    >
                      {isFoodSpot && <UtensilsCrossed className="w-3 h-3 text-orange-600" />}
                      {isEntrance && <DoorOpen className="w-3 h-3 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Add Kandang
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Edit Kandang Modal
function EditKandangModal({ 
  isOpen, 
  onClose, 
  onUpdate,
  kandang
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Kandang>) => void;
  kandang: Kandang;
}) {
  const [formData, setFormData] = useState<{
    name: string;
    location: string;
    type: 'cow' | 'goat';
    capacity: number;
    foodSpotX: number;
    foodSpotY: number;
    entranceX: number;
    entranceY: number;
  }>({
    name: kandang.name || '',
    location: kandang.location || '',
    type: (kandang.type as 'cow' | 'goat') || 'cow',
    capacity: kandang.capacity || 20,
    foodSpotX: kandang.foodSpot?.x || 0,
    foodSpotY: kandang.foodSpot?.y || 0,
    entranceX: kandang.waterSpot?.x || 3,
    entranceY: kandang.waterSpot?.y || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(kandang.id, {
      name: formData.name,
      location: formData.location,
      type: formData.type,
      capacity: formData.capacity,
      foodSpot: { x: formData.foodSpotX, y: formData.foodSpotY, z: 0 },
      waterSpot: { x: formData.entranceX, y: formData.entranceY, z: 0 },
      environment: kandang.environment || { temperature: 28, humidity: 65 }
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Kandang</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Kandang A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              <option value="Zone A - North">Zone A - North</option>
              <option value="Zone B - South">Zone B - South</option>
              <option value="Zone C - East">Zone C - East</option>
              <option value="Zone D - West">Zone D - West</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'cow' | 'goat' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="cow">Cow</option>
              <option value="goat">Goat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min={1}
              max={100}
            />
          </div>

          {/* 2D Farm Layout Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Farm Layout (4x4 Grid)
            </h3>
            
            {/* Food Spot Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                Food Spot Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Column (0-3)</label>
                  <input
                    type="number"
                    value={formData.foodSpotX}
                    onChange={(e) => setFormData({ ...formData, foodSpotX: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Row (0-3)</label>
                  <input
                    type="number"
                    value={formData.foodSpotY}
                    onChange={(e) => setFormData({ ...formData, foodSpotY: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
              </div>
            </div>

            {/* Entrance/Exit Position */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-blue-500" />
                Entrance/Exit Position
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Column (0-3)</label>
                  <input
                    type="number"
                    value={formData.entranceX}
                    onChange={(e) => setFormData({ ...formData, entranceX: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Row (0-3)</label>
                  <input
                    type="number"
                    value={formData.entranceY}
                    onChange={(e) => setFormData({ ...formData, entranceY: Math.min(3, Math.max(0, Number(e.target.value))) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={0}
                    max={3}
                  />
                </div>
              </div>
            </div>

            {/* Visual Preview */}
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div className="grid grid-cols-4 gap-1">
                {[...Array(16)].map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isFoodSpot = col === formData.foodSpotX && row === formData.foodSpotY;
                  const isEntrance = col === formData.entranceX && row === formData.entranceY;
                  
                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square rounded border flex items-center justify-center text-xs
                        ${isFoodSpot ? 'bg-orange-100 border-orange-400' : ''}
                        ${isEntrance ? 'bg-blue-100 border-blue-400' : ''}
                        ${!isFoodSpot && !isEntrance ? 'bg-gray-100 border-gray-300' : ''}
                      `}
                    >
                      {isFoodSpot && <UtensilsCrossed className="w-3 h-3 text-orange-600" />}
                      {isEntrance && <DoorOpen className="w-3 h-3 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Update Kandang
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Main Component
export function FarmOverview2D() {
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingKandang, setEditingKandang] = useState<Kandang | null>(null);
  const [kandangs, setKandangs] = useState<Kandang[]>([]);
  const [animals, setAnimals] = useState<Livestock[]>([]);
  const [selectedKandang, setSelectedKandang] = useState<Kandang | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [kandangData, livestockData] = await Promise.all([
          kandangService.getAll(),
          livestockService.getAll()
        ]);
        setKandangs(kandangData);
        setAnimals(livestockData);
      } catch (error) {
        console.error('Failed to load farm data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate stats from current data
  const stats = {
    totalKandang: kandangs.length,
    totalAnimals: animals.length,
    healthyAnimals: animals.filter(a => a.status === 'healthy').length,
    sickAnimals: animals.filter(a => a.status === 'sick' || a.status === 'quarantine').length,
  };

  const handleAddKandang = async (data: Partial<Kandang>) => {
    try {
      const newId = await kandangService.create(data as Omit<Kandang, 'id'>);
      const newKandang = { ...data, id: newId } as Kandang;
      setKandangs([...kandangs, newKandang]);
    } catch (error) {
      console.error('Failed to add kandang:', error);
    }
  };

  const handleUpdateKandang = async (id: string, data: Partial<Kandang>) => {
    try {
      await kandangService.update(id, data);
      setKandangs(kandangs.map(k => k.id === id ? { ...k, ...data } : k));
      setShowEditModal(false);
      setEditingKandang(null);
      // Update selected kandang if it was being viewed
      if (selectedKandang?.id === id) {
        setSelectedKandang({ ...selectedKandang, ...data });
      }
    } catch (error) {
      console.error('Failed to update kandang:', error);
    }
  };

  const handleUpdatePositions = async (
    id: string, 
    foodSpot: { x: number; y: number }, 
    entrance: { x: number; y: number }
  ) => {
    try {
      const updateData = {
        foodSpot: { x: foodSpot.x, y: foodSpot.y, z: 0 },
        waterSpot: { x: entrance.x, y: entrance.y, z: 0 }
      };
      await kandangService.update(id, updateData);
      setKandangs(kandangs.map(k => k.id === id ? { ...k, ...updateData } : k));
      // Update selected kandang if it was being viewed
      if (selectedKandang?.id === id) {
        setSelectedKandang({ ...selectedKandang, ...updateData });
      }
    } catch (error) {
      console.error('Failed to update positions:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading farm data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header with Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white"
          >
            <Home className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.totalKandang}</p>
            <p className="text-emerald-100 text-sm">Total Kandang</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white"
          >
            <Activity className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.totalAnimals}</p>
            <p className="text-blue-100 text-sm">Total Animals</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white"
          >
            <Check className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.healthyAnimals}</p>
            <p className="text-green-100 text-sm">Healthy</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white"
          >
            <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats.sickAnimals}</p>
            <p className="text-red-100 text-sm">Need Attention</p>
          </motion.div>
        </div>

        {/* Kandang Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Farm Kandang</h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Kandang
          </button>
        </div>

        {/* Kandang Grid */}
        {kandangs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No kandang found</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Add Your First Kandang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {kandangs.map((kandang: Kandang) => (
                <KandangCard
                  key={kandang.id}
                  kandang={kandang}
                  animals={animals}
                  isSelected={selectedKandang?.id === kandang.id}
                  onClick={() => setSelectedKandang(
                    selectedKandang?.id === kandang.id ? null : kandang
                  )}
                  onUpdatePositions={handleUpdatePositions}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Sidebar */}
      <AnimatePresence>
        {selectedKandang && (
          <DetailPanel 
            kandang={selectedKandang} 
            animals={animals}
            onClose={() => setSelectedKandang(null)}
            onEdit={(kandang) => {
              setEditingKandang(kandang);
              setShowEditModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddKandangModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddKandang}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingKandang && (
          <EditKandangModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingKandang(null);
            }}
            onUpdate={handleUpdateKandang}
            kandang={editingKandang}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
