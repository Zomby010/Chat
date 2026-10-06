import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Flower2, Pause, Play } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import EntryList from '../../components/wellbeing/EntryList';
import { useActivities } from '../../components/wellbeing/useActivities';
import { formatDateTime } from '../../lib/format';

export const SESSIONS = {
  grounding: {
    name: '5-4-3-2-1 grounding',
    length: '3 min',
    about: 'Brings your attention back to the room when your thoughts are racing or you feel anxious.',
    steps: [
      ['Settle', 'Sit or stand comfortably. Let your shoulders drop. Take one slow breath.', 20],
      ['5 things you can see', 'Look around and name five things you can see. Notice colours, shapes and light.', 35],
      ['4 things you can feel', 'Notice four things you can feel: your feet on the floor, your clothes, the air, the chair.', 35],
      ['3 things you can hear', 'Listen for three sounds, near and far. You don’t need to judge them, just notice.', 30],
      ['2 things you can smell', 'Notice two scents. If you can’t smell anything, think of two smells you like.', 25],
      ['1 thing you can taste', 'Notice one taste in your mouth, or take a sip of water.', 20],
      ['Return', 'Take a slow breath. Notice how you feel now, without needing it to be different.', 20],
    ],
  },
  'body-scan': {
    name: 'Short body scan',
    length: '5 min',
    about: 'Gently moves attention through the body to release tension. Helpful before sleep.',
    steps: [
      ['Arrive', 'Sit or lie down. Close your eyes if that feels okay, or soften your gaze.', 30],
      ['Feet and legs', 'Bring attention to your feet, then slowly up through your calves and knees. Notice any sensation, or none.', 45],
      ['Hips and belly', 'Notice your hips and belly. Feel your belly rise and fall with each breath.', 45],
      ['Chest and back', 'Notice your chest and upper back. If you find tightness, imagine breathing into that space.', 45],
      ['Hands, arms and shoulders', 'Move attention to your hands, arms and shoulders. Let them soften a little.', 45],
      ['Neck, jaw and face', 'Notice your neck, jaw and forehead. Unclench your jaw. Let your face relax.', 45],
      ['Whole body', 'Feel your whole body breathing. When you’re ready, gently open your eyes.', 45],
    ],
  },
  'mindful-minute': {
    name: 'Mindful minute',
    length: '1 min',
    about: 'A quick pause you can take anywhere: between classes, before a meeting, or when you notice stress.',
    steps: [
      ['Pause', 'Stop what you’re doing. Feel your feet on the ground.', 15],
      ['Breathe', 'Notice three slow breaths, in and out. Just watch them.', 25],
      ['Notice', 'What are you feeling right now? Name it kindly: “this is stress”, “this is tiredness”.', 20],
    ],
  },
  kindness: {
    name: 'Kindness practice',
    length: '3 min',
    about: 'Builds warmth toward yourself and others. Useful when you’re being hard on yourself.',
    steps: [
      ['Settle', 'Sit comfortably and take a few easy breaths.', 20],
      ['Someone you care about', 'Picture someone you care about. Silently wish them: “May you be safe. May you be well.”', 40],
      ['Yourself', 'Now offer the same words to yourself: “May I be safe. May I be well. May I be kind to myself.”', 45],
      ['Others', 'Widen the wish to people around you, and everyone who is struggling today.', 40],
      ['Close', 'Notice any warmth, or none. Both are okay. Take one last slow breath.', 20],
    ],
  },
};

function Player({ id, onFinish, onExit }) {
  const session = SESSIONS[id];
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(session.steps[0][2]);
  const [paused, setPaused] = useState(false);
  const started = useRef(Date.now());
  const pausedMs = useRef(0);
  const pausedAt = useRef(0);

  useEffect(() => setLeft(session.steps[step][2]), [step, session]);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [paused, step]);
  useEffect(() => {
    if (left > 0) return;
    if (step < session.steps.length - 1) setStep((s) => s + 1);
    else onFinish(Math.round((Date.now() - started.current - pausedMs.current) / 1000));
  }, [left, step, session, onFinish]);

  const togglePause = () => {
    if (paused) pausedMs.current += Date.now() - pausedAt.current;
    else pausedAt.current = Date.now();
    setPaused((p) => !p);
  };

  const [title, text] = session.steps[step];
  return (
    <div className="player">
      <div className="player__dots" aria-hidden>
        {session.steps.map((_, i) => (
          <span key={i} className={i < step ? 'is-done' : i === step ? 'is-current' : ''} />
        ))}
      </div>
      <div className="player__step" aria-live="polite">
        <p className="tiny muted" style={{ margin: 0 }}>
          Step {step + 1} of {session.steps.length}
        </p>
        <h2 className="player__step-title">{title}</h2>
        <p className="player__step-text">{text}</p>
        <p className="tiny muted" style={{ margin: 0 }} aria-hidden>
          {left}s
        </p>
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn btn--ghost btn--icon" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} aria-label="Previous step">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <button type="button" className="btn btn--primary" onClick={togglePause}>
          {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />} {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={() => (step < session.steps.length - 1 ? setStep((s) => s + 1) : setLeft(0))}
          aria-label={step < session.steps.length - 1 ? 'Next step' : 'Finish'}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>
      <button type="button" className="btn btn--ghost btn--sm" style={{ justifySelf: 'center' }} onClick={() => onExit(Math.round((Date.now() - started.current - pausedMs.current) / 1000))}>
        End session
      </button>
    </div>
  );
}

export default function Mindfulness() {
  const state = useActivities('mindfulness');
  const [active, setActive] = useState(null);
  const [done, setDone] = useState(null);

  const save = async (id, secs) => {
    setActive(null);
    setDone(id);
    if (secs >= 20) await state.log({ session: id, durationSec: secs }, 'Session saved. Thank you for taking this time.').catch(() => {});
  };

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Mindfulness</h1>
          <p>Short guided practices to come back to the present. Wander off? That’s normal. Gently come back.</p>
        </div>
      </div>
      <div className="grid grid--main-aside section">
        <section className="card" aria-label="Sessions">
          {active ? (
            <Player id={active} onFinish={(s) => save(active, s)} onExit={(s) => save(active, s)} />
          ) : (
            <div className="stack">
              {done && (
                <div className="alert alert--success">
                  <Flower2 size={18} aria-hidden />
                  <div className="alert__body">
                    <strong className="alert__title">Session complete</strong>
                    Notice how you feel. <Link to="/mood">Check in</Link> if you’d like to record it.
                  </div>
                </div>
              )}
              {Object.entries(SESSIONS).map(([id, s]) => (
                <div key={id} className="list-row" style={{ alignItems: 'flex-start' }}>
                  <span className="icon-badge icon-badge--info">
                    <Flower2 size={20} aria-hidden />
                  </span>
                  <div className="list-row__main">
                    <div className="list-row__title">
                      {s.name} <span className="badge">{s.length}</span>
                    </div>
                    <p className="small muted" style={{ margin: '4px 0 0' }}>
                      {s.about}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--soft btn--sm"
                    onClick={() => {
                      setDone(null);
                      setActive(id);
                    }}
                  >
                    <Play size={15} aria-hidden /> Begin
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="stack stack--lg">
          <EntryList
            title="Recent practice"
            state={state}
            icon={Flower2}
            empty="Your completed sessions will show here."
            describe={(e) => `${SESSIONS[e.session]?.name} from ${formatDateTime(e.createdAt)}`}
            render={(e) => (
              <>
                <div className="list-row__title">{SESSIONS[e.session]?.name}</div>
                <div className="list-row__meta">
                  {Math.max(1, Math.round(e.durationSec / 60))} min · {formatDateTime(e.createdAt)}
                </div>
              </>
            )}
          />
          <EvidenceNote id="mindfulness" />
        </div>
      </div>
    </>
  );
}
