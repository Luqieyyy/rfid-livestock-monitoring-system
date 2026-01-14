// Component for Breed Selector based on animal type
import { COW_BREEDS, GOAT_BREEDS, SHEEP_BREEDS, FARM_LOCATIONS } from '@/utils/constants';

interface BreedSelectorProps {
  animalType: 'cows' | 'goat' | 'sheep';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function BreedSelector({ animalType, value, onChange, required = true }: BreedSelectorProps) {
  const getBreedOptions = () => {
    switch (animalType) {
      case 'cows':
        return COW_BREEDS;
      case 'goat':
        return GOAT_BREEDS;
      case 'sheep':
        return SHEEP_BREEDS;
      default:
        return [];
    }
  };

  const breeds = getBreedOptions();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Breed *</label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <option value="">Select Breed</option>
        {breeds.map(breed => (
          <option key={breed.value} value={breed.value}>{breed.label}</option>
        ))}
      </select>
    </div>
  );
}

// Component for Location/Kandang Selector
interface LocationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function LocationSelector({ value, onChange, required = true }: LocationSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Location (Kandang) *</label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <option value="">Select Kandang</option>
        {FARM_LOCATIONS.map(location => (
          <option key={location.value} value={location.value}>
            {location.label}
            {location.capacity && ` (Capacity: ${location.capacity})`}
          </option>
        ))}
      </select>
    </div>
  );
}
