import { ExternalLink, MessageSquareText, Phone, Siren } from 'lucide-react';
import { getRegionResources, smsHref, telHref } from '../../lib/region';

/** Tap-to-call / tap-to-text list of crisis contacts for one region. */
export default function CrisisResourceList({ region, compact = false }) {
  const r = getRegionResources(region);
  return (
    <div className="crisis-list">
      <a className="crisis-emergency" href={r.emergency.phone ? telHref(r.emergency.phone) : undefined}>
        <Siren size={22} aria-hidden />
        <span>
          <strong>
            {r.emergency.phone ? `Call ${r.emergency.phone}` : 'Call your local emergency number'}
            {r.emergency.alt && ` or ${r.emergency.alt}`}
          </strong>
          <span className="crisis-emergency__sub">If you or someone else is in immediate danger</span>
        </span>
      </a>
      <ul className="list-plain crisis-list__items">
        {r.resources.slice(0, compact ? 2 : undefined).map((res) => (
          <li key={res.id} className="crisis-item">
            <div className="crisis-item__text">
              <strong>{res.name}</strong>
              <span className="small muted">
                {res.hours}
                {res.description && !compact ? ` · ${res.description}` : ''}
              </span>
            </div>
            <div className="crisis-item__actions">
              {res.phone && (
                <a className="btn btn--sm btn--soft" href={telHref(res.phone)} aria-label={`Call ${res.name} on ${res.display || res.phone}`}>
                  <Phone size={15} aria-hidden /> {res.display && !res.display.startsWith('Text') ? res.display : res.phone}
                </a>
              )}
              {res.sms && (
                <a className="btn btn--sm btn--soft" href={smsHref(res.sms, res.smsBody)} aria-label={`Text ${res.name}${res.smsBody ? `: send ${res.smsBody} to ${res.sms}` : ''}`}>
                  <MessageSquareText size={15} aria-hidden /> {res.smsBody ? `Text ${res.smsBody} to ${res.sms}` : `Text ${res.sms}`}
                </a>
              )}
              {res.url && !res.phone && !res.sms && (
                <a className="btn btn--sm btn--soft" href={res.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden /> Open
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
