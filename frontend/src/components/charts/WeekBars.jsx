import { formatDay } from '../../lib/format';

/** Simple 7-day bar chart (e.g. minutes of movement per day). */
export default function WeekBars({ data, unit = 'min', label }) {
  const max = Math.max(30, ...data.map((d) => d.value));
  return (
    <figure className="weekbars" style={{ margin: 0 }} aria-label={label}>
      <div className="weekbars__bars" role="list">
        {data.map((d) => (
          <div key={d.day} className="weekbars__col" role="listitem" aria-label={`${formatDay(d.day)}: ${d.value} ${unit}`}>
            <span className="weekbars__value" aria-hidden>
              {d.value || ''}
            </span>
            <span className="weekbars__track" aria-hidden>
              <span className="weekbars__bar" style={{ height: `${(d.value / max) * 100}%` }} />
            </span>
            <span className="weekbars__day" aria-hidden>
              {formatDay(d.day, { weekday: 'narrow' })}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
