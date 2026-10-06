export default function Ring({ value, max, label }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <div className="ring" role="img" aria-label={label}>
      <svg viewBox="0 0 80 80" aria-hidden>
        <circle className="ring__track" cx="40" cy="40" r={r} />
        <circle className="ring__value" cx="40" cy="40" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <span className="ring__label" aria-hidden>
        {Math.round(pct * 100)}%
      </span>
    </div>
  );
}
