import { PlaceType } from '@/types';

const PLACE_TYPES: PlaceType[] = [
  'restaurant', 'cafe', 'bar', 'hotel', 'attraction', 'shopping',
];

interface PlaceTypeSelectorProps {
  value?: PlaceType;
  onChange: (type: PlaceType | undefined) => void;
  label?: string;
}

export default function PlaceTypeSelector({ value, onChange, label }: PlaceTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          className={`px-3 py-1 rounded border text-sm ${!value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
          onClick={() => onChange(undefined)}
        >
          All Types
        </button>
        {PLACE_TYPES.map(type => (
          <button
            key={type}
            type="button"
            className={`px-3 py-1 rounded border text-sm ${value === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => onChange(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
} 