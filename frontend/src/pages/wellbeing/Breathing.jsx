import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Pause, Play, RotateCcw, Square, Wind } from 'lucide-react';
import EvidenceNote from '../../components/wellbeing/EvidenceNote';
import EntryList from '../../components/wellbeing/EntryList';
import { useActivities } from '../../components/wellbeing/useActivities';
import { formatDateTime } from '../../lib/format';

export const PATTERNS = {
  calm: { name: 'Calm breathing', desc: 'In 4 · hold 2 · out 6. A longer out-breath helps the body settle.', phases: [['Breathe in', 4, 1], ['Hold', 2, 1], ['Breathe out', 6, 0.62]] },
  box: { name: 'Box breathing', desc: 'In 4 · hold 4 · out 4 · hold 4. Steady and easy to remember.', phases: [['Breathe in', 4, 1], ['Hold', 4, 1], ['Breathe out', 4, 0.62], ['Hold', 4, 0.62]] },
  478: { name: '4-7-8 relaxing breath', desc: 'In 4 · hold 7 · out 8. Many people use it to wind down before sleep.', phases: [['Breathe in', 4, 1], ['Hold', 7, 1], ['Breathe out', 8, 0.62]] },
};
const DURATIONS = [1, 2, 3, 5];

/** Where we are in the pattern after `elapsed` seconds. Pure, so it is testable. */
export function phaseAt(pattern, elapsed) {
  const phases = PATTERNS[pattern].phases;
  const cycle = phases.reduce((s, p) => s + p[1], 0);
  let t = elapsed % cycle;
  for (let i = 0; i < phases.length; i++) {
    if (t < phases[i][1]) return { index: i, label: phases[i][0], length: phases[i][1], remaining: Math.ceil(phases[i][1] - t), scale: phases[i][2] };
    t -= phases[i][1];
  }
  return { index: 0, label: phases[0][0], length: phases[0][1], remaining: phases[0][1], scale: 1 };
}

export default function Breathing() {
  const state = useActivities('breathing');
  const [pattern, setPattern] = useState('calm');
  const [minutes, setMinutes] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | running | paused | done
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const banked = useRef(0);
  const logged = useRef(false);

  const total = minutes * 60;
  const phase = phaseAt(pattern, elapsed);

  const finish = useCallback(
    async (secs) => {
      setStatus('done');
      if (logged.current || secs < 20) return;
      logged.current = true;
      try {
        await state.log({ pattern, durationSec: Math.round(secs) }, 'Breathing session saved. Well done.');
      } catch {
        logged.current = false;
      }
    },
    [pattern, state]
  );

  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (status !== 'running') return undefined;
    const id = setInterval(() => {
      const now = banked.current + (performance.now() - startedAt.current) / 1000;
      if (now >= total) {
        setElapsed(total);
        clearInterval(id);
        finishRef.current(total);
      } else setElapsed(now);
    }, 200);
    return () => clearInterval(id);
  }, [status, total]);

  const start = () => {
    banked.current = 0;
    logged.current = false;
    setElapsed(0);
    startedAt.current = performance.now();
    setStatus('running');
  };
  const pause = () => {
    banked.current += (performance.now() - startedAt.current) / 1000;
    setStatus('paused');
  };
  const resume = () => {
    startedAt.current = performance.now();
    setStatus('running');
  };
  const stop = () => {
    const secs = status === 'running' ? banked.current + (performance.now() - startedAt.current) / 1000 : banked.current;
    finish(secs);
  };

  const active = status === 'running' || status === 'paused';
  const scale = active ? phase.scale : 0.7;
  const label = status === 'idle' ? 'Ready when you are' : status === 'done' ? 'Well done' : status === 'paused' ? 'Paused' : phase.label;

  return (
    <>
      <Link to="/wellbeing" className="back-link">
        <ArrowLeft size={16} aria-hidden /> Wellbeing
      </Link>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Guided breathing</h1>
          <p>Follow the circle: let it grow as you breathe in and shrink as you breathe out. Breathe gently; there’s no need to force it.</p>
        </div>
      </div>

      <div className="grid grid--main-aside section">
        <section className="card" aria-label="Breathing exercise">
          {!active && status !== 'done' && (
            <div className="stack" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="pattern-options" role="radiogroup" aria-label="Breathing pattern">
                {Object.entries(PATTERNS).map(([k, p]) => (
                  <button key={k} type="button" role="radio" aria-checked={pattern === k} className="pattern-option" onClick={() => setPattern(k)}>
                    <strong>{p.name}</strong>
                    <span className="small muted">{p.desc}</span>
                  </button>
                ))}
              </div>
              <div className="row">
                <span className="small muted">Length</span>
                <div className="segmented" role="radiogroup" aria-label="Session length">
                  {DURATIONS.map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={minutes === d} className="chip" onClick={() => setMinutes(d)}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="breath">
            <div className="breath__stage">
              <div className="breath__halo" />
              <div className="breath__circle" style={{ '--breath-scale': scale, transitionDuration: status === 'running' ? `${phase.length}s` : '600ms' }} />
              <span className="breath__label" aria-live="assertive">
                {label}
              </span>
              {status === 'running' && (
                <span className="breath__count" aria-hidden>
                  {phase.remaining}
                </span>
              )}
            </div>
            <div className="breath__progress">
              <div className="progress" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(elapsed)}>
                <div className="progress__bar" style={{ width: `${(elapsed / total) * 100}%` }} />
              </div>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, '0')} of {minutes}:00 · {PATTERNS[pattern].name}
              </p>
            </div>
            <div className="row" style={{ justifyContent: 'center' }}>
              {status === 'idle' && (
                <button type="button" className="btn btn--primary btn--lg" onClick={start}>
                  <Play size={18} aria-hidden /> Start
                </button>
              )}
              {status === 'running' && (
                <button type="button" className="btn btn--lg" onClick={pause}>
                  <Pause size={18} aria-hidden /> Pause
                </button>
              )}
              {status === 'paused' && (
                <button type="button" className="btn btn--primary btn--lg" onClick={resume}>
                  <Play size={18} aria-hidden /> Resume
                </button>
              )}
              {active && (
                <button type="button" className="btn btn--ghost btn--lg" onClick={stop}>
                  <Square size={16} aria-hidden /> Finish
                </button>
              )}
              {status === 'done' && (
                <>
                  <button type="button" className="btn btn--primary" onClick={start}>
                    <RotateCcw size={16} aria-hidden /> Go again
                  </button>
                  <button type="button" className="btn" onClick={() => setStatus('idle')}>
                    Change settings
                  </button>
                  <Link to="/mood" className="btn btn--soft">
                    How do you feel now?
                  </Link>
                </>
              )}
            </div>
            {status === 'done' && elapsed < 20 && <p className="small muted">Sessions shorter than 20 seconds aren’t saved.</p>}
          </div>
        </section>

        <div className="stack stack--lg">
          <EntryList
            title="Your recent sessions"
            state={state}
            icon={Wind}
            empty="No sessions yet. Your first one will appear here."
            describe={(e) => `breathing session from ${formatDateTime(e.createdAt)}`}
            render={(e) => (
              <>
                <div className="list-row__title">{PATTERNS[e.pattern]?.name}</div>
                <div className="list-row__meta">
                  {Math.round(e.durationSec / 60) || '<1'} min · {formatDateTime(e.createdAt)}
                </div>
              </>
            )}
          />
          <EvidenceNote id="mindfulness" />
          <p className="small muted">If you feel dizzy or light-headed, return to normal breathing. Slow breathing should feel comfortable, never strained.</p>
        </div>
      </div>
    </>
  );
}
