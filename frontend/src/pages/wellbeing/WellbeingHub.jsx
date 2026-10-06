import { Link } from 'react-router';
import { ArrowRight, CalendarHeart, Flower2, Footprints, Moon, Users, Wind } from 'lucide-react';

const TOOLS = [
  { to: '/wellbeing/breathing', icon: Wind, tone: 'sage', title: 'Guided breathing', text: 'Slow your breathing to settle your body in 1–5 minutes.', tag: 'Calm' },
  { to: '/wellbeing/mindfulness', icon: Flower2, tone: 'info', title: 'Mindfulness sessions', text: 'Grounding, a body scan and other short guided practices.', tag: 'Evidence-based' },
  { to: '/wellbeing/movement', icon: Footprints, tone: 'sun', title: 'Movement', text: 'Log activity and build toward 150 active minutes a week.', tag: 'Evidence-based' },
  { to: '/wellbeing/plans', icon: CalendarHeart, tone: '', title: 'Plan something good', text: 'Schedule small enjoyable things and notice how they lift your mood.', tag: 'Evidence-based' },
  { to: '/wellbeing/sleep', icon: Moon, tone: 'info', title: 'Sleep & routine', text: 'A simple sleep diary with practical tips for better nights.', tag: 'Evidence-based' },
  { to: '/wellbeing/connection', icon: Users, tone: 'accent', title: 'Stay connected', text: 'Small daily prompts to reach out, and a log of who lifted you up.', tag: 'Evidence-based' },
];

export default function WellbeingHub() {
  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Wellbeing toolkit</h1>
          <p>Small, practical things that are known to help. Pick whatever feels doable today, even five minutes counts.</p>
        </div>
        <Link to="/about" className="btn btn--soft btn--sm">
          About the evidence
        </Link>
      </div>
      <div className="grid grid--3">
        {TOOLS.map(({ to, icon: Icon, tone, title, text, tag }) => (
          <Link key={to} to={to} className="card card--interactive tool-card">
            <div className="row row--between">
              <span className={`icon-badge${tone ? ` icon-badge--${tone}` : ''}`}>
                <Icon size={22} aria-hidden />
              </span>
              <span className={`badge${tag === 'Calm' ? '' : ' badge--primary'}`}>{tag}</span>
            </div>
            <h2 className="card__title">{title}</h2>
            <p className="muted small">{text}</p>
            <span className="tool-card__go small">
              Open <ArrowRight size={14} aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
