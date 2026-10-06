import { BookOpen, ExternalLink } from 'lucide-react';
import { evidenceFor } from '../../data/evidence';

/** "Why this helps" panel: evidence, limits and safety notes with sources. */
export default function EvidenceNote({ id }) {
  const e = evidenceFor(id);
  if (!e) return null;
  return (
    <details className="evidence-note card card--tinted">
      <summary>
        <BookOpen size={18} aria-hidden /> Why this helps, and its limits
      </summary>
      <div className="evidence-note__body">
        <p>
          <strong>Evidence.</strong> {e.evidence}
        </p>
        <p>
          <strong>Limits.</strong> {e.limits}
        </p>
        <p>
          <strong>Take care.</strong> {e.risks}
        </p>
        <ul className="list-plain stack--sm stack">
          {e.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="small">
                {s.label} <ExternalLink size={12} aria-hidden style={{ display: 'inline', verticalAlign: -1 }} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
