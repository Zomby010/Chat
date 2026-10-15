import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

const STORED = [
  ['Account', 'Your email address and display name (Firebase Authentication). Your password is handled by Firebase and never reaches MindMate’s server.'],
  ['Profile', 'Your chosen country for support lines, your goals and your privacy settings.'],
  ['Check-ins', 'Mood scores, emotion tags and any notes you write.'],
  ['Wellbeing logs', 'Breathing and mindfulness sessions, movement, sleep diary entries, connections (type of relationship only, never names) and plans.'],
  ['Conversations', 'Messages you send to the AI companion and its replies, plus a safety level the app uses to decide when to show crisis contacts.'],
];

/** Plain-language privacy notice. Kept accurate to what the code actually does. */
export default function Privacy() {
  const { status } = useAuth();
  return (
    <article className="prose-page">
      <div className="page-header">
        <div className="page-header__text">
          <h1>Privacy</h1>
          <p>What MindMate stores, who can see it, and how you stay in control. Written in plain language.</p>
        </div>
      </div>

      <section className="card section">
        <h2 className="card__title">The short version</h2>
        <ul>
          <li>Your data is stored so the app can show you your history and trends. Nothing is sold, and there are no ads or trackers.</li>
          <li>Only you can read your data through the app. Every request is checked against your signed-in account.</li>
          <li>Messages you send to the AI companion are sent to an AI provider to generate a reply.</li>
          <li>You can download everything, or delete it, at any time from your profile.</li>
        </ul>
      </section>

      <section className="card section">
        <h2 className="card__title">What we store</h2>
        <dl className="evidence-dl">
          {STORED.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="small muted" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
          Data is kept in Google Cloud Firestore through Firebase, encrypted in transit and at rest by Google. It is not end-to-end encrypted, which means the people who run this deployment of MindMate could technically access the database. Your data stays until you delete it.
        </p>
      </section>

      <section className="card section">
        <h2 className="card__title">The AI companion</h2>
        <p>
          When you send a message, MindMate’s server sends it, along with the recent messages in that conversation, to the configured AI provider (Google Gemini or OpenAI) to write a reply. Your email address is never sent.
        </p>
        <ul>
          <li>Your chosen country is included so it can point you to the right support lines.</li>
          <li>Your first name is included so replies feel personal. You can turn this off in your profile.</li>
          <li>Your latest mood check-in is only included if you switch on “Share my recent mood with the companion”. It is off by default.</li>
          <li>
            AI providers have their own data policies. Some free API plans allow the provider to use content to improve their services. Avoid sharing details that identify you or other people, such as full names, addresses or ID numbers.
          </li>
        </ul>
      </section>

      <section className="card section">
        <h2 className="card__title">Logs</h2>
        <p style={{ marginBottom: 0 }}>
          The server keeps short technical logs (the address of each request, whether it succeeded and how long it took) to keep the service working. Logs never include what you write.
        </p>
      </section>

      <section className="card section">
        <h2 className="card__title">Your choices</h2>
        <ul>
          <li>Download a copy of all your data as a file.</li>
          <li>Delete individual check-ins, entries, plans or conversations.</li>
          <li>Delete all your data while keeping your account, or delete your account entirely.</li>
        </ul>
        {status === 'signedIn' ? (
          <Link to="/profile" className="btn btn--soft btn--sm">
            Go to your privacy settings
          </Link>
        ) : (
          <p className="small muted" style={{ marginBottom: 0 }}>These options are in your profile once you sign in.</p>
        )}
      </section>

      <section className="card card--tinted section">
        <h2 className="card__title">Please note</h2>
        <p style={{ marginBottom: 0 }}>
          MindMate is a student project and self-care tool, not a healthcare provider. It has not been certified under health-data regulations such as HIPAA or assessed as a medical device. Please don’t rely on it as your only source of support.
        </p>
      </section>
    </article>
  );
}
