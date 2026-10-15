import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Footprints, Plus } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import EntryList from '../../components/wellbeing/EntryList';
import { useActivities } from '../../components/wellbeing/useActivities';
import WeekBars from '../../components/charts/WeekBars';
import { Field, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { addDays, capitalise, formatDateTime, todayKey } from '../../lib/format';

const KINDS = ['walk', 'run', 'cycle', 'sport', 'dance', 'strength', 'yoga', 'chores', 'other'];
const INTENSITY = [
  { v: 'light', label: 'Light', hint: 'Easy, you could sing' },
  { v: 'moderate', label: 'Moderate', hint: 'Breathing faster, you can still talk' },
  { v: 'vigorous', label: 'Vigorous', hint: 'Hard to say more than a few words' },
];

/** WHO counts 1 vigorous minute as 2 moderate minutes; light activity isn't counted toward the target. */
export const whoMinutes = (a) => (a.intensity === 'vigorous' ? a.minutes * 2 : a.intensity === 'moderate' ? a.minutes : 0);

export default function Movement() {
  const { profile } = useAuth();
  const state = useActivities('movement', 14);
  const [form, setForm] = useState({ kind: 'walk', minutes: 20, intensity: 'moderate' });
  const [error, setError] = useState('');
  const goal = profile?.preferences.weeklyMovementGoal || 150;

  const week = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i - 6));
    const list = state.data || [];
    return {
      bars: days.map((day) => ({ day, value: list.filter((a) => a.day === day).reduce((s, a) => s + a.minutes, 0) })),
      who: list.filter((a) => days.includes(a.day)).reduce((s, a) => s + whoMinutes(a), 0),
    };
  }, [state.data]);

  async function submit(e) {
    e.preventDefault();
    const minutes = Number(form.minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) return setError('Enter the number of minutes, between 1 and 600.');
    setError('');
    await state.log({ ...form, minutes }, `${minutes} minutes logged. Your body and mind thank you.`).catch(() => {});
  }

  const pct = Math.min(100, Math.round((week.who / goal) * 100));

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Movement</h1>
          <p>Any movement counts. A brisk walk, dancing in your room or carrying shopping all help your mood as well as your body.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <div className="stack stack--lg">
          <section className="card" aria-labelledby="week-move">
            <div className="card__header">
              <div>
                <p className="card__eyebrow">This week</p>
                <h2 id="week-move" className="card__title">
                  {week.who} of {goal} active minutes
                </h2>
              </div>
              <span className="badge badge--primary">{pct}%</span>
            </div>
            <div className="progress" role="progressbar" aria-label="Progress toward weekly goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={week.who}>
              <div className="progress__bar" style={{ width: `${pct}%` }} />
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              The WHO recommends 150–300 minutes of moderate activity a week (vigorous minutes count double). If that feels like a lot, start small: some activity is better than none.
            </p>
            <WeekBars data={week.bars} label="Minutes of movement each day this week" />
          </section>

          <section className="card" aria-labelledby="log-move">
            <h2 id="log-move" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
              Log activity
            </h2>
            <form onSubmit={submit} noValidate>
              <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 var(--space-5)' }}>
                <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                  What did you do?
                </legend>
                <div className="chip-group" role="radiogroup">
                  {KINDS.map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={form.kind === k} className="chip" onClick={() => setForm((f) => ({ ...f, kind: k }))}>
                      {capitalise(k)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Field label="Minutes" error={error}>
                {(p) => <input {...p} className="input" type="number" inputMode="numeric" min={1} max={600} style={{ maxWidth: 160 }} value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} />}
              </Field>
              <fieldset className="field" style={{ border: 0, padding: 0, margin: '0 0 var(--space-5)' }}>
                <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                  How hard did it feel?
                </legend>
                <div className="pattern-options" role="radiogroup">
                  {INTENSITY.map((i) => (
                    <button key={i.v} type="button" role="radio" aria-checked={form.intensity === i.v} className="pattern-option" onClick={() => setForm((f) => ({ ...f, intensity: i.v }))}>
                      <strong>{i.label}</strong>
                      <span className="small muted">{i.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="btn btn--primary" disabled={state.saving}>
                {state.saving ? <Spinner /> : <Plus size={18} aria-hidden />} Log activity
              </button>
            </form>
          </section>
        </div>

        <div className="stack stack--lg">
          <EntryList
            title="Recent activity"
            state={state}
            icon={Footprints}
            empty="Nothing logged in the last two weeks."
            describe={(e) => `${e.kind} from ${formatDateTime(e.createdAt)}`}
            render={(e) => (
              <>
                <div className="list-row__title">
                  {capitalise(e.kind)} · {e.minutes} min
                </div>
                <div className="list-row__meta">
                  {capitalise(e.intensity)} · {formatDateTime(e.createdAt)}
                </div>
              </>
            )}
          />
          <EvidenceNote id="physical-activity" />
        </div>
      </div>
    </>
  );
}
