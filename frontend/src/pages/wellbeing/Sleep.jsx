import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Check, Moon, Plus } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import EntryList from '../../components/wellbeing/EntryList';
import { useActivities } from '../../components/wellbeing/useActivities';
import { Field, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { addDays, formatDay, minutesToHours, todayKey } from '../../lib/format';

const QUALITY = ['Very poor', 'Poor', 'Okay', 'Good', 'Great'];
const TIPS = [
  'Get up at the same time every day, even after a bad night or at weekends.',
  'Only go to bed when you feel sleepy, and keep your bed for sleep.',
  'If you can’t sleep after about 15 minutes, get up and do something calm in dim light, then try again.',
  'Wind down for an hour before bed, with screens away and lights low.',
  'Avoid caffeine within 6 hours of bed and alcohol within 4 hours.',
  'If worries keep you awake, write them down earlier in the evening (“worry time”).',
  'Try to keep naps short (under 20 minutes) and before 3pm.',
];

export function sleepMinutes(bed, wake) {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let m = wh * 60 + wm - (bh * 60 + bm);
  if (m <= 0) m += 1440;
  return m;
}

export default function Sleep() {
  const { profile } = useAuth();
  const state = useActivities('sleep', 30);
  const [form, setForm] = useState({ night: addDays(todayKey(), -1), bedTime: '23:00', wakeTime: '07:00', quality: 3, windDown: false, screensOff: false });
  const [error, setError] = useState('');
  const goal = profile?.preferences.sleepGoalHours || 8;

  const nights = useMemo(() => [...(state.data || [])].sort((a, b) => (a.night < b.night ? 1 : -1)).slice(0, 14), [state.data]);
  const avg = nights.length ? nights.slice(0, 7).reduce((s, n) => s + n.durationMin, 0) / Math.min(7, nights.length) : null;

  async function submit(e) {
    e.preventDefault();
    const mins = sleepMinutes(form.bedTime, form.wakeTime);
    if (mins > 16 * 60) return setError('That’s more than 16 hours. Please check the times.');
    if (form.night > todayKey()) return setError('Choose a night that has already happened.');
    setError('');
    await state.log(form, `Sleep logged: ${minutesToHours(mins)}.`).catch(() => {});
  }

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Sleep & routine</h1>
          <p>Sleep and mood are closely linked. A short diary helps you spot what makes nights better or worse.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <div className="stack stack--lg">
          <section className="card" aria-labelledby="log-sleep">
            <h2 id="log-sleep" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
              Log a night
            </h2>
            <form onSubmit={submit} noValidate>
              <div className="grid grid--3" style={{ gap: 'var(--space-4)' }}>
                <Field label="Night of">
                  {(p) => <input {...p} className="input" type="date" max={todayKey()} value={form.night} onChange={(e) => setForm((f) => ({ ...f, night: e.target.value }))} />}
                </Field>
                <Field label="Went to bed">
                  {(p) => <input {...p} className="input" type="time" value={form.bedTime} onChange={(e) => setForm((f) => ({ ...f, bedTime: e.target.value }))} />}
                </Field>
                <Field label="Woke up">
                  {(p) => <input {...p} className="input" type="time" value={form.wakeTime} onChange={(e) => setForm((f) => ({ ...f, wakeTime: e.target.value }))} />}
                </Field>
              </div>
              <p className="small muted" style={{ marginTop: 'calc(var(--space-2) * -1)' }}>
                That’s about <strong>{minutesToHours(sleepMinutes(form.bedTime, form.wakeTime))}</strong> in bed.
              </p>
              <fieldset className="field" style={{ border: 0, padding: 0 }}>
                <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                  How well did you sleep?
                </legend>
                <div className="segmented" role="radiogroup">
                  {QUALITY.map((q, i) => (
                    <button key={q} type="button" role="radio" aria-checked={form.quality === i + 1} className="chip" onClick={() => setForm((f) => ({ ...f, quality: i + 1 }))}>
                      {q}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="stack stack--sm" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="checkbox small">
                  <input type="checkbox" checked={form.windDown} onChange={(e) => setForm((f) => ({ ...f, windDown: e.target.checked }))} /> I had a wind-down routine
                </label>
                <label className="checkbox small">
                  <input type="checkbox" checked={form.screensOff} onChange={(e) => setForm((f) => ({ ...f, screensOff: e.target.checked }))} /> Screens were off for the last 30+ minutes
                </label>
              </div>
              {error && <p className="field__error" style={{ marginBottom: 'var(--space-4)' }}>{error}</p>}
              <button type="submit" className="btn btn--primary" disabled={state.saving}>
                {state.saving ? <Spinner /> : <Plus size={18} aria-hidden />} Save night
              </button>
            </form>
          </section>

          <section className="card" aria-labelledby="sleep-pattern">
            <div className="card__header">
              <h2 id="sleep-pattern" className="card__title">
                Your recent nights
              </h2>
              {avg && <span className="badge badge--primary">Avg {minutesToHours(avg)}</span>}
            </div>
            {nights.length ? (
              <div className="sleep-nights">
                {nights.map((n) => (
                  <div key={n.id} className="sleep-night">
                    <span>{formatDay(n.night, { weekday: 'short', day: 'numeric' })}</span>
                    <span className="progress" style={{ height: 12 }} aria-hidden>
                      <span className="sleep-night__bar" style={{ display: 'block', width: `${Math.min(100, (n.durationMin / (goal * 60)) * 100)}%` }} />
                    </span>
                    <span className="muted">{minutesToHours(n.durationMin)}</span>
                  </div>
                ))}
                <p className="tiny muted">Bar shows time in bed against your {goal}-hour goal.</p>
              </div>
            ) : (
              <p className="small muted">Log a few nights to see your pattern.</p>
            )}
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="card card--tinted" aria-labelledby="sleep-tips">
            <h2 id="sleep-tips" className="card__title" style={{ marginBottom: 'var(--space-3)' }}>
              What helps, according to the NHS
            </h2>
            <ul className="list-plain tips">
              {TIPS.map((t) => (
                <li key={t}>
                  <Check size={16} aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </section>
          <EntryList
            title="Diary entries"
            state={state}
            icon={Moon}
            empty="No nights logged yet."
            describe={(e) => `sleep entry for ${formatDay(e.night)}`}
            render={(e) => (
              <>
                <div className="list-row__title">{formatDay(e.night)}</div>
                <div className="list-row__meta">
                  {e.bedTime}–{e.wakeTime} · {minutesToHours(e.durationMin)} · {QUALITY[e.quality - 1]}
                </div>
              </>
            )}
          />
          <EvidenceNote id="sleep" />
        </div>
      </div>
    </>
  );
}
