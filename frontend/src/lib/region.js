/**
 * Crisis resources are bundled with the app (not fetched) so they are
 * available instantly, offline, and even if the API is down.
 */
import crisisData from '../../../shared/crisisResources.json';

export const REGIONS = Object.entries(crisisData.regions).map(([code, r]) => ({ code, name: r.name }));
export const CRISIS_LAST_VERIFIED = crisisData._meta.lastVerified;

export function getRegionResources(code) {
  const key = String(code || '').toUpperCase();
  const region = crisisData.regions[key] ? key : 'INTL';
  return { code: region, ...crisisData.regions[region] };
}

/** Best guess from the browser locale, e.g. "en-KE" -> "KE". */
export function guessRegion() {
  const langs = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const l of langs) {
    const m = /[-_]([A-Za-z]{2})\b/.exec(l || '');
    if (m && crisisData.regions[m[1].toUpperCase()]) return m[1].toUpperCase();
  }
  return 'INTL';
}

export function telHref(phone) {
  return `tel:${String(phone).replace(/[^\d+]/g, '')}`;
}

export function smsHref(number, body) {
  const n = String(number).replace(/[^\d+]/g, '');
  return body ? `sms:${n}?&body=${encodeURIComponent(body)}` : `sms:${n}`;
}
