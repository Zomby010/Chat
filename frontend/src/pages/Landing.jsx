import { Link } from 'react-router';
import { ArrowRight, CalendarHeart, Footprints, HeartHandshake, Lock, MessageCircleHeart, Moon, ShieldCheck, Smile, Wind } from 'lucide-react';
import MoodFace from '../components/mood/MoodFace';
import { EVIDENCE } from '../data/evidence';
import { useCrisis } from '../context/CrisisContext';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Smile, title: 'Gentle daily check-ins', text: 'Notice how you’re feeling in a few taps, and see patterns over time without scores or judgement.', tone: '' },
  { icon: MessageCircleHeart, title: 'A supportive companion', text: 'Talk things through with an AI that listens, suggests small next steps, and knows when to point you to real people.', tone: 'accent' },
  { icon: Wind, title: 'Breathing & mindfulness', text: 'Short guided sessions to calm your body and come back to the present moment.', tone: 'sage' },
  { icon: Footprints, title: 'Movement that counts', text: 'Log walks, sport or dancing and watch your week build toward the WHO activity guideline.', tone: 'sun' },
  { icon: Moon, title: 'Sleep & routine', text: 'A simple sleep diary with practical, evidence-based tips for better nights.', tone: 'info' },
  { icon: CalendarHeart, title: 'Plan something good', text: 'Schedule small enjoyable activities and see how they lift your mood.', tone: '' },
];

export default function Landing() {
  const { openCrisis } = useCrisis();
  const { status } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <div className="landing">
      <section className="hero container">
        <div className="hero__text">
          <p className="badge badge--primary hero__badge">
            <ShieldCheck size={14} aria-hidden /> Private by design · Free to use
          </p>
          <h1>A calm place to look after your mind.</h1>
          <p className="hero__lead">
            MindMate helps you check in with yourself, build small healthy habits and talk things through, whenever you need to. Kind, private, and grounded in evidence.
          </p>
          <div className="row hero__cta">
            <Link to={signedIn ? '/home' : '/signup'} className="btn btn--primary btn--lg">
              {signedIn ? 'Open MindMate' : 'Start for free'} <ArrowRight size={18} aria-hidden />
            </Link>
            {!signedIn && (
              <Link to="/login" className="btn btn--lg">
                I have an account
              </Link>
            )}
          </div>
          <p className="small muted">Not a medical service. If you need urgent help, <button type="button" className="link-button" onClick={openCrisis}>find a crisis line now</button>.</p>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero-card hero-card--checkin">
            <p className="hero-card__title">How are you feeling today?</p>
            <div className="hero-faces">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`hero-face${s === 4 ? ' is-selected' : ''} mood-${s}`}>
                  <MoodFace score={s} size={34} />
                </span>
              ))}
            </div>
            <div className="hero-chips">
              <span>Hopeful</span>
              <span>Tired</span>
            </div>
          </div>
          <div className="hero-card hero-card--breathe">
            <span className="hero-breathe" />
            <div>
              <p className="hero-card__title">Breathe in…</p>
              <p className="small muted">Calm breathing · 1 min</p>
            </div>
          </div>
          <div className="hero-card hero-card--chat">
            <p className="hero-bubble hero-bubble--user">Exams are really stressing me out.</p>
            <p className="hero-bubble">That sounds like a lot to carry. Want to try a two-minute reset together, or talk through what feels heaviest?</p>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="features-title">
        <div className="section-intro">
          <h2 id="features-title">Everything in one gentle place</h2>
          <p className="muted">Each part of MindMate connects to the others, so a check-in can lead to a breathing exercise, a walk or a conversation.</p>
        </div>
        <div className="grid grid--3">
          {FEATURES.map(({ icon: Icon, title, text, tone }) => (
            <article key={title} className="card feature-card">
              <span className={`icon-badge${tone ? ` icon-badge--${tone}` : ''}`}>
                <Icon size={22} aria-hidden />
              </span>
              <h3>{title}</h3>
              <p className="muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section container" aria-labelledby="evidence-title">
        <div className="evidence-band">
          <div>
            <h2 id="evidence-title">Built on evidence, honest about limits</h2>
            <p className="muted">
              MindMate’s wellbeing tools are based on recommendations from the WHO, NICE, the NHS and peer-reviewed research. We show the source behind each one, and what it can’t do.
            </p>
            <Link to="/about" className="btn btn--soft">
              See the evidence <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <ul className="list-plain evidence-list">
            {EVIDENCE.map((e) => (
              <li key={e.id}>
                <strong>{e.title}</strong>
                <span className="small muted">{e.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section container" aria-labelledby="trust-title">
        <h2 id="trust-title" className="sr-only">What MindMate is and isn’t</h2>
        <div className="grid grid--3">
          <div className="card card--tinted">
            <span className="icon-badge">
              <Lock size={20} aria-hidden />
            </span>
            <h3>Your data stays yours</h3>
            <p className="muted small">Only you can see your check-ins and conversations. Export everything, or delete it permanently, from your profile at any time.</p>
          </div>
          <div className="card card--tinted">
            <span className="icon-badge icon-badge--accent">
              <MessageCircleHeart size={20} aria-hidden />
            </span>
            <h3>Support, not diagnosis</h3>
            <p className="muted small">The companion is an AI. It won’t diagnose you or advise on medication, and it’s honest about that.</p>
          </div>
          <div className="card card--tinted">
            <span className="icon-badge icon-badge--crisis">
              <HeartHandshake size={20} aria-hidden />
            </span>
            <h3>Help is always one tap away</h3>
            <p className="muted small">Crisis lines for your country are available on every screen, even when you’re signed out or offline.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="cta-band">
          <h2>Start with one small check-in.</h2>
          <p>It takes ten seconds, and it’s a kind thing to do for yourself.</p>
          <Link to={signedIn ? '/home' : '/signup'} className="btn btn--lg cta-band__btn">
            {signedIn ? 'Go to my space' : 'Create my free account'} <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
