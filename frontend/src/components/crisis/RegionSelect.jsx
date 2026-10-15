import { useId } from 'react';
import { REGIONS } from '../../lib/region';

export default function RegionSelect({ value, onChange, label = 'Showing services for' }) {
  const id = useId();
  return (
    <div className="row" style={{ gap: 'var(--space-2)' }}>
      <label htmlFor={id} className="small muted">
        {label}
      </label>
      <select id={id} className="select" style={{ width: 'auto', minHeight: 38, paddingTop: 6, paddingBottom: 6 }} value={value} onChange={(e) => onChange(e.target.value)}>
        {REGIONS.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
