import { Link } from 'react-router';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { EVIDENCE } from '../../data/evidence';
import { useAuth } from '../../context/AuthContext';

/** What MindMate is, and the research behind each feature, including limits. */
export default function About() {
  const { status } = useAuth();
  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>About MindMate and the evidence</h1>
          <p>
            MindMate is a self-care companion built as a final-year project. Every wellbeing tool in it is based on published research or guidance from bodies such as the WHO, NICE and the NHS. Here is what each one is based on, and where its limits are.
          </p>
        </div>
      </div>

      <section className="card card--tinted section" aria-labelledby="what-it-is">
        <h2 id="what-it-is" className="card__title">
          What MindMate is, and isn’t
        </h2>
        <div className="grid grid--2" style={{ marginTop: 'var(--space-3)' }}>
          <div>
            <strong>It is</strong>
            <ul className="small">
              <li>A private space to check in on your mood and notice patterns</li>
              <li>A set of short, evidence-informed self-help tools</li>
              <li>An AI companion for reflection and gentle next steps</li>
              <li>A quick route to crisis lines and human support</li>
            </ul>
          </div>
          <div>
            <strong>It isn’t</strong>
            <ul className="small">
              <li>A medical device, diagnosis or treatment</li>
              <li>A therapist, counsellor or doctor, human or AI</li>
              <li>An emergency service: it can’t call anyone or see your location</li>
              <li>A replacement for professional care when you need it</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="stack stack--lg section">
        {EVIDENCE.map((e) => (
          <article key={e.id} className="card" aria-labelledby={`ev-${e.id}`}>
            <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <h2 id={`ev-${e.id}`} className="card__title">
                {e.title}
              </h2>
              {status === 'signedIn' && (
                <Link to={e.route} className="btn btn--soft btn--sm">
                  Open <ArrowRight size={14} aria-hidden />
                </Link>
              )}
            </div>
            <p>{e.summary}</p>
            <dl className="evidence-dl">
              <dt>The evidence</dt>
              <dd>{e.evidence}</dd>
              <dt>Limits</dt>
              <dd>{e.limits}</dd>
              <dt>Take care</dt>
              <dd>{e.risks}</dd>
              <dt>Sources</dt>
              <dd>
                <ul className="list-plain stack stack--sm">
                  {e.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label} <ExternalLink size={12} aria-hidden style={{ display: 'inline', verticalAlign: -1 }} />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </article>
        ))}
      </div>

      <section className="card section" aria-labelledby="ai">
        <h2 id="ai" className="card__title">
          About the AI companion
        </h2>
        <p className="muted">
          The companion uses a general-purpose large language model with instructions to listen, reflect and suggest small coping steps. It is told never to diagnose, prescribe, give medication advice or claim to be a professional, and its replies are checked for those things before you see them.
        </p>
        <p className="muted">
          Before a message reaches the AI, MindMate checks it for signs of crisis. If it finds them, you see crisis contacts immediately, and for the most urgent messages MindMate replies with a fixed safety message rather than AI text. This check is keyword-based: it can miss things and sometimes misread them, so please use the “Get help now” button any time you need it.
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          AI can be wrong. Treat what it says as a conversation, not advice.
        </p>
      </section>
    </>
  );
}
