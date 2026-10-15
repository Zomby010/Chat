import { useMemo, useState } from 'react';
import { Smile, Trash2 } from 'lucide-react';
import CheckInForm from '../components/mood/CheckInForm';
import MoodFace from '../components/mood/MoodFace';
import MoodChart from '../components/charts/MoodChart';
import { ConfirmDialog, EmptyState, ErrorState, PageLoader } from '../components/ui';
import { useApiData } from '../hooks/useApiData';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { MOOD_LEVELS, addDays, capitalise, formatDateTime, todayKey } from '../lib/format';

const RANGES = [7, 30, 90];

function buildSeries(entries, days) {
  const byDay = new Map();
  entries.forEach((e) => byDay.set(e.day, [...(byDay.get(e.day) || []), e.score]));
  const today = todayKey();
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - days + 1);
    const s = byDay.get(day) || [];
    return { day, count: s.length, average: s.length ? Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10 : null };
  });
}

export default function Mood() {
  const toast = useToast();
  const [days, setDays] = useState(30);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { data: entries, error, loading, reload, setData } = useApiData(() => api.get('/moods', { query: { days } }), [days]);

  const series = useMemo(() => (entries ? buildSeries(entries, days) : []), [entries, days]);
  const distribution = useMemo(() => MOOD_LEVELS.map((m) => ({ ...m, count: (entries || []).filter((e) => e.score === m.score).length })), [entries]);
  const emotions = useMemo(() => {
    const c = {};
    (entries || []).forEach((e) => (e.emotions || []).forEach((x) => (c[x] = (c[x] || 0) + 1)));
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.del(`/moods/${pendingDelete.id}`);
      setData((list) => list.filter((e) => e.id !== pendingDelete.id));
      toast.success('Check-in deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Check-in</h1>
          <p>There are no right or wrong answers. Noticing how you feel is the whole point.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <section className="card" aria-label="New check-in">
          <CheckInForm onSaved={(entry) => setData((list) => [entry, ...(list || [])])} />
        </section>
        <aside className="card card--tinted">
          <h2 className="card__title" style={{ marginBottom: 'var(--space-3)' }}>
            Why check in?
          </h2>
          <p className="small muted">
            Naming a feeling can make it a little easier to handle. Over time, your check-ins show patterns, like which days feel harder or what tends to help, so you can plan around them.
          </p>
          <p className="small muted">If you notice you’ve felt low for more than two weeks, it’s worth talking to a doctor or counsellor. That’s a sign of strength, not weakness.</p>
        </aside>
      </div>

      <section className="section" id="history" aria-labelledby="history-title">
        <div className="section__title">
          <h2 id="history-title">Your history</h2>
          <div className="segmented" role="radiogroup" aria-label="Time range">
            {RANGES.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={days === r} className="chip" onClick={() => setDays(r)}>
                {r} days
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorState error={error} onRetry={reload} />}
        {loading && !entries && <PageLoader />}
        {entries && !entries.length && (
          <div className="card">
            <EmptyState icon={Smile} title="No check-ins in this period">
              Your first check-in above will start your history.
            </EmptyState>
          </div>
        )}
        {entries && entries.length > 0 && (
          <div className="grid grid--main-aside">
            <div className="stack stack--lg">
              <div className="card">
                <MoodChart series={series} />
              </div>
              <div className="card">
                <h3>All check-ins</h3>
                <ul className="list-plain">
                  {entries.map((e) => (
                    <li key={e.id} className="mood-history__item">
                      <MoodFace score={e.score} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 'var(--space-2)' }}>
                          <strong>{e.label}</strong>
                          <span className="small muted">{formatDateTime(e.createdAt)}</span>
                        </div>
                        {e.emotions?.length > 0 && (
                          <div className="chip-group" style={{ marginTop: 6 }}>
                            {e.emotions.map((x) => (
                              <span key={x} className="badge">
                                {capitalise(x)}
                              </span>
                            ))}
                          </div>
                        )}
                        {e.note && <p className="mood-history__note small">{e.note}</p>}
                      </div>
                      <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setPendingDelete(e)} aria-label={`Delete check-in from ${formatDateTime(e.createdAt)}`}>
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="stack stack--lg">
              <div className="card">
                <h3>How your days have felt</h3>
                <div className="mood-distribution">
                  {distribution.map((d) => (
                    <div key={d.score} className={`mood-distribution__row mood-${d.score}`}>
                      <span>{d.label}</span>
                      <span className="progress" style={{ background: 'var(--color-surface-2)' }}>
                        <span className="mood-distribution__bar" style={{ display: 'block', width: `${(d.count / maxCount) * 100}%` }} />
                      </span>
                      <span className="muted">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {emotions.length > 0 && (
                <div className="card">
                  <h3>Feelings you’ve named most</h3>
                  <div className="chip-group">
                    {emotions.map(([e, n]) => (
                      <span key={e} className="badge badge--primary">
                        {capitalise(e)} · {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} busy={deleting} title="Delete this check-in?">
        This permanently removes the check-in and any note you wrote with it.
      </ConfirmDialog>
    </>
  );
}
