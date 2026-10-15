import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Laugh, Quote, RefreshCw, Sparkles } from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import { api, tzOffset } from '../../lib/api';
import { ErrorState } from '../ui';

/**
 * Daily positivity: encouragement + suggestion, quote and joke.
 * Each can be refreshed independently; refreshes are deterministic per day.
 */
export default function DailyCards() {
  const [refresh, setRefresh] = useState({ quote: 0, joke: 0, encouragement: 0, suggestion: 0 });
  const [showPunchline, setShowPunchline] = useState(false);
  const { data, error, loading, reload } = useApiData(
    () =>
      api.get('/content/daily', {
        query: { tzOffset: tzOffset(), r_quote: refresh.quote, r_joke: refresh.joke, r_encouragement: refresh.encouragement, r_suggestion: refresh.suggestion },
      }),
    [refresh]
  );

  const bump = (k) => {
    if (k === 'joke') setShowPunchline(false);
    setRefresh((r) => ({ ...r, [k]: r[k] + 1 }));
  };

  if (error) return <ErrorState error={error} onRetry={reload} title="Today’s inspiration didn’t load" />;

  const RefreshBtn = ({ k, label }) => (
    <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => bump(k)} aria-label={label} disabled={loading}>
      <RefreshCw size={15} aria-hidden />
    </button>
  );

  return (
    <div className="daily">
      <article className="card card--primary daily__encourage" aria-busy={loading}>
        <div className="card__header">
          <p className="card__eyebrow">
            <Sparkles size={14} aria-hidden style={{ display: 'inline', verticalAlign: -2 }} /> For you today
          </p>
          <RefreshBtn k="encouragement" label="Show different encouragement" />
        </div>
        <p className="daily__encourage-text">{data?.encouragement || ' '}</p>
        {data?.suggestion && (
          <div className="daily__suggestion">
            <span className="small muted">Small step:</span>
            <Link to={data.suggestion.route} className="suggestion-link">
              <span>{data.suggestion.text}</span>
              <ArrowRight size={16} aria-hidden />
            </Link>
            <button type="button" className="link-button small" onClick={() => bump('suggestion')}>
              Suggest something else
            </button>
          </div>
        )}
      </article>

      <article className="card daily__quote" aria-busy={loading}>
        <div className="card__header">
          <span className="icon-badge icon-badge--sun">
            <Quote size={18} aria-hidden />
          </span>
          <RefreshBtn k="quote" label="Show another quote" />
        </div>
        {data?.quote && (
          <blockquote>
            <p>“{data.quote.text}”</p>
            <footer className="small muted">
              — {data.quote.author}
              {data.quote.source && <cite>, {data.quote.source}</cite>}
            </footer>
          </blockquote>
        )}
      </article>

      <article className="card daily__joke" aria-busy={loading}>
        <div className="card__header">
          <span className="icon-badge icon-badge--accent">
            <Laugh size={18} aria-hidden />
          </span>
          {data?.joke && <RefreshBtn k="joke" label="Tell me another joke" />}
        </div>
        {data?.joke ? (
          <>
            <p className="daily__joke-setup">{data.joke.setup}</p>
            {showPunchline ? (
              <p className="daily__joke-punchline" aria-live="polite">
                {data.joke.punchline}
              </p>
            ) : (
              <button type="button" className="btn btn--soft btn--sm" onClick={() => setShowPunchline(true)}>
                Tell me
              </button>
            )}
          </>
        ) : (
          data && (
            <p className="muted small" style={{ margin: 0 }}>
              {data.jokeHiddenReason === 'disabled'
                ? 'Daily jokes are turned off. You can switch them back on in your profile.'
                : 'We’ve set the jokes aside today. It sounds like things are heavy, and that matters more. Be gentle with yourself.'}
            </p>
          )
        )}
      </article>
    </div>
  );
}
