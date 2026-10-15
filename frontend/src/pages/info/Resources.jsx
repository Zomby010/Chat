import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, HeartHandshake, Stethoscope, UserRound, Wind } from 'lucide-react';
import CrisisResourceList from '../../components/crisis/CrisisResourceList';
import RegionSelect from '../../components/crisis/RegionSelect';
import { useAuth } from '../../context/AuthContext';
import { CRISIS_LAST_VERIFIED, guessRegion } from '../../lib/region';

const WARNING_SIGNS = [
  'Thinking about suicide or wanting to die',
  'Making plans or looking for ways to harm yourself',
  'Feeling trapped, hopeless, or like a burden to others',
  'Withdrawing from everyone, or saying goodbye',
  'Using more alcohol or drugs to cope',
];

/** Crisis and support resources. Public, bundled with the app, works offline. */
export default function Resources() {
  const { profile, status } = useAuth();
  const [region, setRegion] = useState(() => profile?.region || guessRegion());
  useEffect(() => {
    if (profile?.region) setRegion(profile.region);
  }, [profile?.region]);
  const verified = new Date(`${CRISIS_LAST_VERIFIED}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Support when you need it</h1>
          <p>If you’re struggling, you don’t have to cope alone. These services are free, confidential and run by trained people.</p>
        </div>
      </div>

      <div className="grid grid--main-aside">
        <div className="stack stack--lg">
          <section className="card crisis-panel" aria-labelledby="urgent">
            <div className="card__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <h2 id="urgent" className="card__title">
                Talk to someone now
              </h2>
              <RegionSelect value={region} onChange={setRegion} label="Country" />
            </div>
            <CrisisResourceList region={region} />
            <p className="small muted" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
              Numbers checked on {verified}. Services sometimes change, so if a number doesn’t work, use your local emergency number or{' '}
              <a href="https://findahelpline.com" target="_blank" rel="noreferrer">
                findahelpline.com
              </a>
              .
            </p>
          </section>

          <section className="card" aria-labelledby="signs">
            <h2 id="signs" className="card__title">
              When to reach out urgently
            </h2>
            <p className="muted">Please contact a crisis line or emergency services straight away if you, or someone you know, is:</p>
            <ul>
              {WARNING_SIGNS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="muted" style={{ marginBottom: 0 }}>
              If you’re worried about someone else, it’s okay to ask them directly whether they’re thinking about suicide. Asking does not put the idea in their head, and it can be a relief for them to talk.
            </p>
          </section>

          <section className="card" aria-labelledby="ongoing">
            <h2 id="ongoing" className="card__title">
              Getting ongoing help
            </h2>
            <ul className="list-plain stack">
              <li className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <span className="icon-badge icon-badge--info">
                  <Stethoscope size={20} aria-hidden />
                </span>
                <div>
                  <strong>A doctor or clinic</strong>
                  <p className="small muted" style={{ margin: 0 }}>
                    A GP or general doctor is often the first step. They can talk through how you feel, check for physical causes and refer you to talking therapy or other treatment.
                  </p>
                </div>
              </li>
              <li className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <span className="icon-badge icon-badge--sage">
                  <UserRound size={20} aria-hidden />
                </span>
                <div>
                  <strong>Your school, college or university</strong>
                  <p className="small muted" style={{ margin: 0 }}>
                    Most have a free counselling or wellbeing service for students. Ask student services, a tutor or your welfare office.
                  </p>
                </div>
              </li>
              <li className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <span className="icon-badge icon-badge--accent">
                  <HeartHandshake size={20} aria-hidden />
                </span>
                <div>
                  <strong>Someone you trust</strong>
                  <p className="small muted" style={{ margin: 0 }}>
                    A friend, family member, faith leader or teacher. You don’t need to have the right words, “I’m not doing well” is enough to start.
                  </p>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div className="stack stack--lg">
          <section className="card card--tinted" aria-labelledby="right-now">
            <h2 id="right-now" className="card__title">
              While you wait
            </h2>
            <ul className="small">
              <li>Move away from anything you could use to hurt yourself.</li>
              <li>Go somewhere you feel safer, or near other people.</li>
              <li>Breathe slowly: in for 4, out for 6.</li>
              <li>Tell someone you trust how you’re feeling.</li>
            </ul>
            {status === 'signedIn' && (
              <Link to="/wellbeing/breathing" className="btn btn--soft btn--sm">
                <Wind size={15} aria-hidden /> Guided breathing
              </Link>
            )}
          </section>
          <section className="card" aria-labelledby="about-mm">
            <h2 id="about-mm" className="card__title">
              What MindMate can and can’t do
            </h2>
            <p className="small muted">
              MindMate is a self-care tool. Its AI companion is not a therapist or doctor and can’t respond to emergencies, call anyone for you, or see your location.
            </p>
            <p className="small muted" style={{ marginBottom: 0 }}>
              International directory:{' '}
              <a href="https://findahelpline.com" target="_blank" rel="noreferrer">
                findahelpline.com <ExternalLink size={12} aria-hidden style={{ display: 'inline', verticalAlign: -1 }} />
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
