import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Plus, RefreshCw, Users } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import EntryList from '../../components/wellbeing/EntryList';
import { useActivities } from '../../components/wellbeing/useActivities';
import { Spinner } from '../../components/ui';
import { addDays, capitalise, formatDateTime, todayKey } from '../../lib/format';

export const PROMPTS = [
  'Send a message to someone you haven’t talked to in a while, just to say hi.',
  'Tell someone one thing you appreciate about them.',
  'Ask a friend or family member how their week is really going, and listen.',
  'Share something that made you smile today with someone.',
  'Invite someone for a short walk or a cup of tea.',
  'Reply to a message you’ve been putting off.',
  'Do a small kind thing for someone: hold a door, help with a task, say thank you.',
  'Join a club, class, group chat or community activity you’ve been curious about.',
  'Call instead of texting someone today.',
  'Sit with someone at lunch or break instead of alone.',
];

const KINDS = [
  ['message', 'Message'],
  ['call', 'Call'],
  ['video', 'Video call'],
  ['in-person', 'In person'],
  ['group', 'Group or club'],
  ['helped-someone', 'Helped someone'],
];
const WITH = ['friend', 'family', 'partner', 'classmate', 'colleague', 'community', 'other'];
const FELT = ['Worse', 'A bit worse', 'The same', 'A bit better', 'Better'];

export default function Connection() {
  const state = useActivities('connection', 30);
  const dayIndex = Math.floor(Date.now() / 86400000);
  const [promptOffset, setPromptOffset] = useState(0);
  const [form, setForm] = useState({ kind: 'message', with: 'friend', feltAfter: 4 });
  const prompt = PROMPTS[(dayIndex + promptOffset) % PROMPTS.length];

  const thisWeek = useMemo(() => {
    const start = addDays(todayKey(), -6);
    return (state.data || []).filter((a) => a.day >= start).length;
  }, [state.data]);

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Stay connected</h1>
          <p>Feeling connected is one of the strongest protectors of wellbeing. Small moments count, and you don’t need to be outgoing.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <div className="stack stack--lg">
          <section className="card card--primary" aria-labelledby="prompt">
            <div className="card__header">
              <p id="prompt" className="card__eyebrow">
                Today’s small connection
              </p>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setPromptOffset((o) => o + 1)} aria-label="Show a different idea">
                <RefreshCw size={15} aria-hidden />
              </button>
            </div>
            <p className="prompt-card">{prompt}</p>
          </section>

          <section className="card" aria-labelledby="log-conn">
            <div className="card__header">
              <h2 id="log-conn" className="card__title">
                Log a connection
              </h2>
              <span className="badge badge--primary">{thisWeek} this week</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                state.log(form, 'Connection logged. Those moments matter.').catch(() => {});
              }}
            >
              <div className="stack">
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                    How did you connect?
                  </legend>
                  <div className="chip-group" role="radiogroup">
                    {KINDS.map(([k, l]) => (
                      <button key={k} type="button" role="radio" aria-checked={form.kind === k} className="chip" onClick={() => setForm((f) => ({ ...f, kind: k }))}>
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                    With
                  </legend>
                  <div className="chip-group" role="radiogroup">
                    {WITH.map((w) => (
                      <button key={w} type="button" role="radio" aria-checked={form.with === w} className="chip" onClick={() => setForm((f) => ({ ...f, with: w }))}>
                        {capitalise(w)}
                      </button>
                    ))}
                  </div>
                  <p className="field__hint" style={{ marginTop: 'var(--space-2)' }}>
                    We only ask for the type of relationship, never names.
                  </p>
                </fieldset>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                    How did you feel afterwards?
                  </legend>
                  <div className="segmented" role="radiogroup">
                    {FELT.map((f, i) => (
                      <button key={f} type="button" role="radio" aria-checked={form.feltAfter === i + 1} className="chip" onClick={() => setForm((x) => ({ ...x, feltAfter: i + 1 }))}>
                        {f}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <button type="submit" className="btn btn--primary" disabled={state.saving}>
                    {state.saving ? <Spinner /> : <Plus size={18} aria-hidden />} Save
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>

        <div className="stack stack--lg">
          <EntryList
            title="Recent connections"
            state={state}
            icon={Users}
            empty="No connections logged yet."
            describe={(e) => `connection from ${formatDateTime(e.createdAt)}`}
            render={(e) => (
              <>
                <div className="list-row__title">
                  {KINDS.find(([k]) => k === e.kind)?.[1]} · {capitalise(e.with)}
                </div>
                <div className="list-row__meta">
                  {e.feltAfter ? `Felt ${FELT[e.feltAfter - 1].toLowerCase()} · ` : ''}
                  {formatDateTime(e.createdAt)}
                </div>
              </>
            )}
          />
          <EvidenceNote id="social-connection" />
          <p className="small muted">
            Feeling lonely is common and nothing to be ashamed of. If loneliness feels heavy, <Link to="/chat">talking it through</Link> or reaching a support line can help.
          </p>
        </div>
      </div>
    </>
  );
}
