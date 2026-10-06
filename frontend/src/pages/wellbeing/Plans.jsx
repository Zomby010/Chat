import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, CalendarHeart, Check, Lightbulb, Plus, SkipForward, Trash2, Undo2 } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import MoodFace from '../../components/mood/MoodFace';
import { EmptyState, ErrorState, Field, Spinner } from '../../components/ui';
import { useApiData } from '../../hooks/useApiData';
import { useToast } from '../../context/ToastContext';
import { api, fieldErrors } from '../../lib/api';
import { MOOD_LEVELS, addDays, relativeDay, todayKey } from '../../lib/format';

export const CATEGORIES = [
  ['enjoyment', 'Enjoyment'],
  ['achievement', 'Achievement'],
  ['connection', 'Connection'],
  ['movement', 'Movement'],
  ['self-care', 'Self-care'],
];

/** Small, concrete starting points, grouped by the BA categories. */
export const IDEAS = {
  enjoyment: ['Listen to an album you love', 'Cook something you enjoy', 'Watch one episode of a comfort show', 'Sit outside with a drink for 10 minutes'],
  achievement: ['Tidy one small area', 'Answer one email you’ve been avoiding', 'Study for 25 minutes', 'Do one load of laundry'],
  connection: ['Message a friend to say hi', 'Call a family member', 'Have a meal with someone'],
  movement: ['Walk around the block', 'Stretch for 10 minutes', 'Dance to two songs'],
  'self-care': ['Have a warm shower', 'Go to bed 30 minutes earlier', 'Make a proper breakfast'],
};

function MoodPicker({ value, onChange, label }) {
  return (
    <div className="mood-options mood-options--compact" role="radiogroup" aria-label={label}>
      {MOOD_LEVELS.map((m) => (
        <button key={m.score} type="button" role="radio" aria-checked={value === m.score} className={`mood-option mood-${m.score}`} onClick={() => onChange(value === m.score ? undefined : m.score)}>
          <MoodFace score={m.score} size={28} />
          <span>{m.short}</span>
        </button>
      ))}
    </div>
  );
}

function PlanItem({ plan, onUpdate, onDelete }) {
  const [rating, setRating] = useState(false);
  const [moodAfter, setMoodAfter] = useState(plan.moodBefore);
  const [busy, setBusy] = useState(false);
  const done = plan.status === 'done';
  const skipped = plan.status === 'skipped';
  const category = CATEGORIES.find(([k]) => k === plan.category)?.[1];

  async function run(patch) {
    setBusy(true);
    try {
      await onUpdate(plan.id, patch);
      setRating(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`plan${done ? ' is-done' : ''}`}>
      <div className="plan__main">
        <div className="plan__title" style={{ fontWeight: 600 }}>
          {plan.title}
        </div>
        <div className="small muted">
          {category}
          {skipped && ' · Skipped'}
          {done && plan.moodBefore && plan.moodAfter && ` · Mood ${plan.moodBefore} → ${plan.moodAfter}`}
          {done && !plan.moodBefore && plan.moodAfter && ` · Felt ${MOOD_LEVELS[plan.moodAfter - 1].label.toLowerCase()} after`}
        </div>
      </div>
      <div className="row" style={{ gap: 'var(--space-2)' }}>
        {plan.status === 'planned' ? (
          <>
            <button type="button" className="btn btn--soft btn--sm" onClick={() => setRating((r) => !r)} aria-expanded={rating} disabled={busy}>
              <Check size={15} aria-hidden /> Done
            </button>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => run({ status: 'skipped' })} aria-label={`Skip ${plan.title}`} disabled={busy}>
              <SkipForward size={15} aria-hidden />
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => run({ status: 'planned' })} aria-label={`Mark ${plan.title} as not done yet`} disabled={busy}>
            <Undo2 size={15} aria-hidden />
          </button>
        )}
        <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => onDelete(plan.id)} aria-label={`Delete ${plan.title}`} disabled={busy}>
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
      {rating && (
        <div className="plan__rate">
          <p className="small" style={{ width: '100%', margin: 0 }}>
            Nice one. How do you feel now? This helps you see which activities lift you.
          </p>
          <MoodPicker value={moodAfter} onChange={setMoodAfter} label="Mood after the activity" />
          <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => run({ status: 'done', ...(moodAfter ? { moodAfter } : {}) })}>
            {busy && <Spinner />} Save
          </button>
        </div>
      )}
    </li>
  );
}

export default function Plans() {
  const toast = useToast();
  const list = useApiData(() => api.get('/plans', { query: { days: 14 } }), []);
  const [form, setForm] = useState({ title: '', category: 'enjoyment', date: todayKey(), moodBefore: undefined });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const today = todayKey();

  const groups = useMemo(() => {
    const plans = list.data || [];
    const upcoming = plans.filter((p) => p.date >= today);
    const past = plans.filter((p) => p.date < today).reverse();
    const byDate = new Map();
    for (const p of upcoming) byDate.set(p.date, [...(byDate.get(p.date) || []), p]);
    return { byDate: [...byDate.entries()], past };
  }, [list.data, today]);

  const stats = useMemo(() => {
    const done = (list.data || []).filter((p) => p.status === 'done');
    const rated = done.filter((p) => p.moodBefore && p.moodAfter);
    const lift = rated.length ? rated.reduce((s, p) => s + (p.moodAfter - p.moodBefore), 0) / rated.length : null;
    return { done: done.length, rated: rated.length, lift };
  }, [list.data]);

  async function submit(e) {
    e.preventDefault();
    if (form.title.trim().length < 2) {
      setErrors({ title: 'Give your plan a short title.' });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const payload = { title: form.title.trim(), category: form.category, date: form.date };
      if (form.moodBefore) payload.moodBefore = form.moodBefore;
      const plan = await api.post('/plans', payload);
      list.setData((d) => [...(d || []), plan].sort((a, b) => a.date.localeCompare(b.date)));
      setForm((f) => ({ ...f, title: '', moodBefore: undefined }));
      toast.success(form.date === today ? 'Planned for today.' : `Planned for ${relativeDay(form.date).toLowerCase()}.`);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function update(id, patch) {
    try {
      const updated = await api.patch(`/plans/${id}`, patch);
      list.setData((d) => d.map((p) => (p.id === id ? updated : p)));
      if (patch.status === 'done') toast.success('Marked as done. Well done for following through.');
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  }

  async function remove(id) {
    try {
      await api.del(`/plans/${id}`);
      list.setData((d) => d.filter((p) => p.id !== id));
      toast.success('Plan deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const ideas = IDEAS[form.category];

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Plan something good</h1>
          <p>When mood is low, we tend to do less, which can make us feel worse. Planning small, doable things, then noticing how they feel, can gently turn that around.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <div className="stack stack--lg">
          <section className="card" aria-labelledby="add-plan">
            <h2 id="add-plan" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
              Add a plan
            </h2>
            <form onSubmit={submit} noValidate>
              <div className="stack">
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                    Type of activity
                  </legend>
                  <div className="chip-group" role="radiogroup">
                    {CATEGORIES.map(([k, l]) => (
                      <button key={k} type="button" role="radio" aria-checked={form.category === k} className="chip" onClick={() => setForm((f) => ({ ...f, category: k }))}>
                        {l}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <Field label="What will you do?" error={errors.title} hint="Keep it small and specific. “Walk to the shop” beats “get fit”.">
                  {(p) => <input {...p} className="input" maxLength={120} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />}
                </Field>
                <div className="row small" style={{ gap: 'var(--space-2)' }}>
                  <Lightbulb size={15} aria-hidden className="muted" />
                  {ideas.map((idea) => (
                    <button key={idea} type="button" className="chip chip--sm" onClick={() => setForm((f) => ({ ...f, title: idea }))}>
                      {idea}
                    </button>
                  ))}
                </div>
                <Field label="When" error={errors.date}>
                  {(p) => (
                    <select {...p} className="select" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}>
                      {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
                        <option key={d} value={d}>
                          {relativeDay(d)}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="field__label" style={{ marginBottom: 'var(--space-2)' }}>
                    How do you feel right now? (optional)
                  </legend>
                  <MoodPicker value={form.moodBefore} onChange={(v) => setForm((f) => ({ ...f, moodBefore: v }))} label="Mood before the activity" />
                </fieldset>
                <div>
                  <button type="submit" className="btn btn--primary" disabled={saving}>
                    {saving ? <Spinner /> : <Plus size={18} aria-hidden />} Add plan
                  </button>
                </div>
              </div>
            </form>
          </section>

          <section className="card" aria-labelledby="upcoming">
            <h2 id="upcoming" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
              Your plans
            </h2>
            {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
            {list.loading && !list.data && <Spinner label="Loading plans" />}
            {list.data && groups.byDate.length === 0 && (
              <EmptyState icon={CalendarHeart} title="Nothing planned yet">
                Add one small thing for today or tomorrow. Even ten minutes counts.
              </EmptyState>
            )}
            {groups.byDate.map(([date, plans]) => (
              <div key={date} className="plan-day">
                <h3 className="plan-day__title">{relativeDay(date)}</h3>
                <ul className="list-plain">
                  {plans.map((p) => (
                    <PlanItem key={p.id} plan={p} onUpdate={update} onDelete={remove} />
                  ))}
                </ul>
              </div>
            ))}
            {groups.past.length > 0 && (
              <details>
                <summary className="small" style={{ cursor: 'pointer', fontWeight: 600 }}>
                  Earlier plans ({groups.past.length})
                </summary>
                <ul className="list-plain" style={{ marginTop: 'var(--space-3)' }}>
                  {groups.past.map((p) => (
                    <PlanItem key={p.id} plan={p} onUpdate={update} onDelete={remove} />
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="card card--tinted" aria-labelledby="plan-stats">
            <h2 id="plan-stats" className="card__title">
              Last two weeks
            </h2>
            <div className="row" style={{ gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
              <div className="stat">
                <span className="stat__value">{stats.done}</span>
                <span className="stat__label">done</span>
              </div>
              {stats.lift !== null && (
                <div className="stat">
                  <span className="stat__value">{stats.lift > 0 ? '+' : ''}{stats.lift.toFixed(1)}</span>
                  <span className="stat__label">average mood change</span>
                </div>
              )}
            </div>
            <p className="small muted" style={{ marginTop: 'var(--space-3)' }}>
              {stats.rated >= 1
                ? 'Based on plans where you rated your mood before and after.'
                : 'Rate your mood before and after a plan to see how activities affect you.'}
            </p>
          </section>
          <EvidenceNote id="behavioural-activation" />
          <p className="small muted">
            It’s okay if you skip things. Notice what got in the way, and try something smaller next time. No judgement.
          </p>
        </div>
      </div>
    </>
  );
}
