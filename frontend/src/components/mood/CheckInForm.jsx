import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, HeartHandshake } from 'lucide-react';
import MoodFace from './MoodFace';
import CrisisResourceList from '../crisis/CrisisResourceList';
import { Alert, Field, Spinner } from '../ui';
import { api, tzOffset } from '../../lib/api';
import { EMOTIONS, MOOD_LEVELS, capitalise } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

/**
 * "How are you feeling today?" check-in.
 * Saves to the API and shows supportive next steps tailored to the answer.
 */
export default function CheckInForm({ onSaved, compact = false }) {
  const { profile } = useAuth();
  const [score, setScore] = useState(null);
  const [emotions, setEmotions] = useState([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const toggle = (e) => setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : cur.length < 6 ? [...cur, e] : cur));

  async function submit(ev) {
    ev.preventDefault();
    if (!score) return setError({ message: 'Choose the face that feels closest to how you are right now.' });
    setSaving(true);
    setError(null);
    try {
      const data = await api.post('/moods', { score, emotions, note: note.trim() || undefined, tzOffset: tzOffset() });
      setResult(data);
      onSaved?.(data.entry);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setScore(null);
    setEmotions([]);
    setNote('');
    setResult(null);
  }

  if (result) {
    const { support } = result;
    return (
      <div className="checkin-result stack" aria-live="polite">
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <MoodFace score={result.entry.score} size={44} />
          <div>
            <h3 style={{ marginBottom: 4 }}>Check-in saved</h3>
            <p className="muted" style={{ margin: 0 }}>
              {support.message}
            </p>
          </div>
        </div>
        {support.safety.showResources && (
          <div className="support-banner">
            <h3>
              <HeartHandshake size={18} aria-hidden /> Support is available right now
            </h3>
            <p className="small">If things feel unbearable or you might not be safe, please reach out to someone now.</p>
            <CrisisResourceList region={profile?.region} compact />
          </div>
        )}
        {support.suggestions.length > 0 && (
          <div>
            <p className="card__eyebrow">Something that might help</p>
            <ul className="list-plain stack--sm stack">
              {support.suggestions.map((s) => (
                <li key={s.id}>
                  <Link to={s.route} className="suggestion-link">
                    <span>{s.text}</span>
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="row">
          <Link to="/chat" className="btn btn--soft btn--sm">
            Talk it through
          </Link>
          <button type="button" className="btn btn--ghost btn--sm" onClick={reset}>
            New check-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="checkin" noValidate>
      <fieldset className="checkin__faces">
        <legend className={compact ? 'sr-only' : 'checkin__legend'}>How are you feeling today?</legend>
        <div className="mood-options" role="radiogroup" aria-label="How are you feeling today?">
          {MOOD_LEVELS.map((m) => (
            <button
              key={m.score}
              type="button"
              role="radio"
              aria-checked={score === m.score}
              className={`mood-option mood-${m.score}`}
              onClick={() => {
                setScore(m.score);
                setError(null);
              }}
            >
              <MoodFace score={m.score} size={compact ? 36 : 44} />
              <span>{m.short}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {score && (
        <div className="checkin__details">
          <fieldset className="checkin__emotions">
            <legend className="field__label">Anything else you’re feeling? (optional)</legend>
            <div className="chip-group">
              {EMOTIONS.map((e) => (
                <button key={e} type="button" className="chip" aria-pressed={emotions.includes(e)} onClick={() => toggle(e)}>
                  {emotions.includes(e) && <Check size={14} aria-hidden />}
                  {capitalise(e)}
                </button>
              ))}
            </div>
          </fieldset>
          <Field label="Want to say more? (optional)" hint="Only you can see this. It’s stored privately in your account and you can delete it any time.">
            {(p) => <textarea {...p} className="textarea" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What’s on your mind today…" rows={compact ? 2 : 3} />}
          </Field>
        </div>
      )}

      {error && <Alert type="error">{error.message}</Alert>}

      <div className="row" style={{ marginTop: 'var(--space-4)' }}>
        <button type="submit" className="btn btn--primary" disabled={saving || !score}>
          {saving ? <Spinner /> : <Check size={18} aria-hidden />}
          {saving ? 'Saving…' : 'Save check-in'}
        </button>
        {!score && <span className="small muted">Pick a face to continue</span>}
      </div>
    </form>
  );
}
