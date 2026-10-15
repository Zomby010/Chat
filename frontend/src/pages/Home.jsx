import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, CalendarHeart, Check, Footprints, HeartHandshake, Lightbulb, MessageCircleHeart, Minus, Moon, Smile, TrendingDown, TrendingUp, Users, Wind } from 'lucide-react';
import CheckInForm from '../components/mood/CheckInForm';
import MoodFace from '../components/mood/MoodFace';
import DailyCards from '../components/daily/DailyCards';
import MoodChart from '../components/charts/MoodChart';
import Ring from '../components/charts/Ring';
import { EmptyState, ErrorState, PageLoader } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { api, tzOffset } from '../lib/api';
import { formatDateTime, greeting, minutesToHours } from '../lib/format';

const TREND = {
  up: { icon: TrendingUp, text: 'A little brighter than last week' },
  down: { icon: TrendingDown, text: 'A bit heavier than last week. Be kind to yourself' },
  steady: { icon: Minus, text: 'About the same as last week' },
};

export default function Home() {
  const { profile, user } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApiData(() => api.get('/dashboard', { query: { tzOffset: tzOffset() } }), []);
  // Keep the form (and its supportive result) on screen after saving, instead of swapping to the summary.
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const showSummary = data?.mood.checkedInToday && !justCheckedIn;

  const name = (profile?.displayName || user?.displayName || '').split(' ')[0];
  const isNew = profile && Date.now() - new Date(profile.createdAt).getTime() < 15 * 60 * 1000 && data && !data.mood.latest;

  async function completePlan(plan) {
    try {
      const updated = await api.patch(`/plans/${plan.id}`, { status: 'done' });
      setData((d) => ({ ...d, plans: { ...d.plans, today: d.plans.today.map((p) => (p.id === plan.id ? updated : p)), doneThisWeek: d.plans.doneThisWeek + 1 } }));
      toast.success('Nice work. Marked as done.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>
            {greeting()}
            {name ? `, ${name}` : ''}.
          </h1>
          <p>{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {isNew && (
        <div className="card card--tinted welcome-card section">
          <h2>Welcome to MindMate</h2>
          <p className="muted">This is your private space. A good first step is a quick check-in below. After that, try a one-minute breathing exercise or say hello to the companion. Nothing here is graded, and you can go at your own pace.</p>
        </div>
      )}

      <div className="grid grid--main-aside section">
        <section className="card" aria-labelledby="checkin-title">
          <h2 id="checkin-title" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
            {showSummary ? 'Your latest check-in' : 'How are you feeling today?'}
          </h2>
          {loading && !data ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : showSummary ? (
            <div className="stack">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <MoodFace score={data.mood.latest.score} size={48} />
                <div>
                  <strong>{data.mood.latest.label}</strong>
                  <div className="small muted">{formatDateTime(data.mood.latest.createdAt)}</div>
                </div>
              </div>
              <div className="row">
                <Link to="/mood" className="btn btn--soft btn--sm">
                  Check in again
                </Link>
                <Link to="/mood#history" className="btn btn--ghost btn--sm">
                  See history
                </Link>
              </div>
            </div>
          ) : (
            <CheckInForm
              compact
              onSaved={() => {
                setJustCheckedIn(true);
                reload();
              }}
            />
          )}
        </section>

        <section aria-label="Quick actions" className="quick-actions">
          <Link to="/wellbeing/breathing" className="quick-action">
            <span className="icon-badge icon-badge--sage">
              <Wind size={20} aria-hidden />
            </span>
            <span>
              <strong>Breathe for a minute</strong>
              <span className="small muted">A quick reset for your body</span>
            </span>
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link to="/chat" className="quick-action">
            <span className="icon-badge icon-badge--accent">
              <MessageCircleHeart size={20} aria-hidden />
            </span>
            <span>
              <strong>Talk it through</strong>
              <span className="small muted">Your companion is here</span>
            </span>
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link to="/wellbeing/plans" className="quick-action">
            <span className="icon-badge">
              <CalendarHeart size={20} aria-hidden />
            </span>
            <span>
              <strong>Plan something good</strong>
              <span className="small muted">One small thing for today</span>
            </span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </div>

      <section className="section" aria-label="Daily inspiration">
        <DailyCards />
      </section>

      {error && (
        <div className="section">
          <ErrorState error={error} onRetry={reload} title="Your progress didn’t load" />
        </div>
      )}
      {loading && !data && !error && <PageLoader label="Gathering your week…" />}

      {data && (
        <>
          <section className="section" aria-labelledby="week-title">
            <div className="section__title">
              <h2 id="week-title">Your week</h2>
              <span className="small muted">Last 7 days</span>
            </div>
            <div className="grid grid--4">
              <Link to="/mood" className="card card--interactive tile">
                <div className="tile__head">
                  <Smile size={18} aria-hidden /> Mood
                </div>
                {data.mood.average7 !== null ? (
                  <>
                    <div className="stat__value">
                      {data.mood.average7}
                      <span className="stat__unit">/ 5</span>
                    </div>
                    <div className="stat__label">
                      {data.mood.trend ? (
                        <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                          {(() => {
                            const T = TREND[data.mood.trend].icon;
                            return <T size={15} aria-hidden />;
                          })()}
                          {TREND[data.mood.trend].text}
                        </span>
                      ) : (
                        `${data.mood.checkInsThisWeek} check-in${data.mood.checkInsThisWeek === 1 ? '' : 's'} · ${data.mood.streak}-day streak`
                      )}
                    </div>
                  </>
                ) : (
                  <p className="small muted">No check-ins yet this week.</p>
                )}
              </Link>
              <Link to="/wellbeing/movement" className="card card--interactive tile">
                <div className="tile__head">
                  <Footprints size={18} aria-hidden /> Movement
                </div>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Ring value={data.movement.whoMinutesThisWeek} max={data.movement.goal} label={`${data.movement.whoMinutesThisWeek} of ${data.movement.goal} active minutes`} />
                  <div>
                    <div className="stat__value" style={{ fontSize: 'var(--text-2xl)' }}>
                      {data.movement.whoMinutesThisWeek}
                      <span className="stat__unit">/ {data.movement.goal} min</span>
                    </div>
                    <div className="stat__label">Moderate-or-more minutes</div>
                  </div>
                </div>
              </Link>
              <Link to="/wellbeing/mindfulness" className="card card--interactive tile">
                <div className="tile__head">
                  <Wind size={18} aria-hidden /> Calm
                </div>
                <div className="stat__value">
                  {data.calm.sessionsThisWeek}
                  <span className="stat__unit">sessions</span>
                </div>
                <div className="stat__label">{data.calm.minutesThisWeek} minutes of breathing & mindfulness</div>
              </Link>
              <Link to="/wellbeing/sleep" className="card card--interactive tile">
                <div className="tile__head">
                  <Moon size={18} aria-hidden /> Sleep
                </div>
                {data.sleep.averageHours ? (
                  <>
                    <div className="stat__value">
                      {minutesToHours(data.sleep.averageHours * 60)}
                    </div>
                    <div className="stat__label">Average over {data.sleep.nightsLogged} night{data.sleep.nightsLogged === 1 ? '' : 's'}</div>
                  </>
                ) : (
                  <p className="small muted">Log last night’s sleep to see your pattern.</p>
                )}
              </Link>
            </div>
          </section>

          <div className="grid grid--main-aside section">
            <section className="card" aria-labelledby="trend-title">
              <div className="card__header">
                <h2 id="trend-title" className="card__title">
                  Mood over the last 30 days
                </h2>
                <Link to="/mood" className="small">
                  Details
                </Link>
              </div>
              {data.mood.series.some((d) => d.count) ? (
                <MoodChart series={data.mood.series} />
              ) : (
                <EmptyState icon={Smile} title="Your mood chart will appear here">
                  Check in on a few days and you’ll start to see how your week flows.
                </EmptyState>
              )}
            </section>

            <div className="stack">
              <section className="card" aria-labelledby="plans-title">
                <div className="card__header">
                  <h2 id="plans-title" className="card__title">
                    Today’s plans
                  </h2>
                  <Link to="/wellbeing/plans" className="small">
                    All plans
                  </Link>
                </div>
                {data.plans.today.length ? (
                  <ul className="list-plain">
                    {data.plans.today.map((p) => (
                      <li key={p.id} className="list-row">
                        <div className="list-row__main">
                          <div className="list-row__title" style={p.status === 'done' ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>
                            {p.title}
                          </div>
                          <div className="list-row__meta">{p.category}</div>
                        </div>
                        {p.status === 'planned' ? (
                          <button type="button" className="btn btn--soft btn--sm" onClick={() => completePlan(p)}>
                            <Check size={15} aria-hidden /> Done
                          </button>
                        ) : (
                          <span className="badge badge--success">{p.status}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small muted" style={{ margin: 0 }}>
                    Nothing planned for today. <Link to="/wellbeing/plans">Add one small thing</Link> you’d enjoy.
                  </p>
                )}
              </section>

              <section className="card card--tinted" aria-labelledby="insights-title">
                <h2 id="insights-title" className="card__title row" style={{ gap: 8, marginBottom: 'var(--space-3)' }}>
                  <Lightbulb size={18} aria-hidden /> What we’re noticing
                </h2>
                {data.insights.length ? (
                  <>
                    <ul className="list-plain stack">
                      {data.insights.map((i) => (
                        <li key={i.id} className="small">
                          {i.text}
                        </li>
                      ))}
                    </ul>
                    <p className="tiny muted" style={{ marginTop: 'var(--space-3)' }}>
                      These are patterns in your own entries, not proof of cause and effect.
                    </p>
                  </>
                ) : (
                  <p className="small muted" style={{ margin: 0 }}>
                    As you check in and log activities, MindMate will point out patterns, like how movement or sleep lines up with your mood.
                  </p>
                )}
                <div className="row small" style={{ marginTop: 'var(--space-4)', gap: 'var(--space-4)' }}>
                  <span className="row" style={{ gap: 6 }}>
                    <Users size={15} aria-hidden /> {data.connection.thisWeek} connection{data.connection.thisWeek === 1 ? '' : 's'}
                  </span>
                  <span className="row" style={{ gap: 6 }}>
                    <HeartHandshake size={15} aria-hidden /> {data.plans.doneThisWeek} plan{data.plans.doneThisWeek === 1 ? '' : 's'} done
                  </span>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
