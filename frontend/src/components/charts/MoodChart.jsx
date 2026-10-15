import { formatDay, moodLabel } from '../../lib/format';

const W = 640;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 34 };

/**
 * 30-day mood line. Days without a check-in leave a gap rather than being
 * interpolated, so the chart never invents data. A data table is provided
 * for screen readers.
 */
export default function MoodChart({ series, height = H }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (series.length <= 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - ((v - 1) / 4) * innerH;

  // Build path segments that break at missing days.
  const segments = [];
  let current = [];
  series.forEach((d, i) => {
    if (d.average === null) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push([x(i), y(d.average)]);
  });
  if (current.length) segments.push(current);

  const points = series.map((d, i) => ({ ...d, cx: x(i) })).filter((d) => d.average !== null);
  const labelEvery = Math.ceil(series.length / 6);

  return (
    <figure className="chart" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`Mood over the last ${series.length} days. ${points.length} days with check-ins.`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className="chart__grid" />
            <text x={PAD.left - 10} y={y(v) + 4} textAnchor="end" className="chart__axis">
              {v}
            </text>
          </g>
        ))}
        {series.map((d, i) =>
          i % labelEvery === 0 || i === series.length - 1 ? (
            <text key={d.day} x={x(i)} y={height - 8} textAnchor="middle" className="chart__axis">
              {formatDay(d.day, { day: 'numeric', month: 'short' })}
            </text>
          ) : null
        )}
        {segments.map((seg, i) =>
          seg.length > 1 ? (
            <polyline key={i} points={seg.map((p) => p.join(',')).join(' ')} className="chart__line" />
          ) : null
        )}
        {points.map((d) => (
          <circle key={d.day} cx={d.cx} cy={y(d.average)} r={5} className={`chart__dot mood-${Math.round(d.average)}`}>
            <title>{`${formatDay(d.day)}: ${moodLabel(d.average)} (${d.average})`}</title>
          </circle>
        ))}
      </svg>
      <details className="chart__table">
        <summary className="small">Show as a table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Average mood (1–5)</th>
              <th scope="col">Check-ins</th>
            </tr>
          </thead>
          <tbody>
            {series
              .filter((d) => d.count)
              .map((d) => (
                <tr key={d.day}>
                  <td>{formatDay(d.day)}</td>
                  <td>
                    {d.average} · {moodLabel(d.average)}
                  </td>
                  <td>{d.count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
