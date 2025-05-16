import { District } from '@/types';

const TAIPEI_DISTRICTS: District[] = [
  'Zhongzheng', 'Datong', 'Zhongshan', 'Songshan', 'Daan', 'Wanhua',
  'Xinyi', 'Shilin', 'Beitou', 'Neihu', 'Nangang', 'Wenshan',
];

interface DistrictFilterProps {
  value?: District;
  onChange: (district: District | undefined) => void;
  label?: string;
}

export default function DistrictFilter({ value, onChange, label }: DistrictFilterProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium mb-1">{label}</label>}
      <select
        className="border rounded px-3 py-2 text-sm"
        value={value || ''}
        onChange={e => onChange(e.target.value as District || undefined)}
      >
        <option value="">All Districts</option>
        {TAIPEI_DISTRICTS.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
} 