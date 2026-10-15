import { Link } from 'react-router';
import { Lock, MessageCircleHeart, Sprout, Smile } from 'lucide-react';
import Logo from '../../components/layout/Logo';
import CrisisButton from '../../components/crisis/CrisisButton';
import { Alert } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

/** Shared two-panel layout for sign-in, sign-up and password reset. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { firebaseConfigured } = useAuth();
  return (
    <div className="auth">
      <aside className="auth__panel" aria-hidden="true">
        <div className="auth__panel-inner">
          <Logo />
          <div>
            <p className="auth__quote">A calm, private space to check in with yourself, one day at a time.</p>
            <ul className="auth__points list-plain">
              <li>
                <Smile size={18} /> Daily check-ins that notice patterns, not scores
              </li>
              <li>
                <MessageCircleHeart size={18} /> A supportive AI companion, available any time
              </li>
              <li>
                <Sprout size={18} /> Small, evidence-informed habits for your wellbeing
              </li>
              <li>
                <Lock size={18} /> Your data stays yours: export or delete it whenever you like
              </li>
            </ul>
          </div>
          <p className="small auth__panel-foot">MindMate supports your wellbeing. It isn’t a substitute for professional care.</p>
        </div>
      </aside>
      <main id="main" className="auth__main" tabIndex={-1}>
        <div className="auth__top">
          <span className="auth__mobile-logo">
            <Logo />
          </span>
          <CrisisButton />
        </div>
        <div className="auth__form">
          <h1>{title}</h1>
          {subtitle && <p className="muted auth__subtitle">{subtitle}</p>}
          {!firebaseConfigured && (
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <Alert type="warning" title="Sign-in isn’t configured yet">
                Add your Firebase web config to <code>frontend/.env</code> (see <code>.env.example</code>), or run the local emulators. Crisis support still works.
              </Alert>
            </div>
          )}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
        <p className="tiny muted auth__legal">
          <Link to="/privacy">Privacy</Link> · <Link to="/">About MindMate</Link>
        </p>
      </main>
    </div>
  );
}
