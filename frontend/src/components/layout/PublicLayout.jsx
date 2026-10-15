import { Link, Outlet } from 'react-router';
import Logo from './Logo';
import CrisisButton from '../crisis/CrisisButton';
import { SiteFooter } from './AppShell';
import { useAuth } from '../../context/AuthContext';

/** Layout for the landing page, and for information pages when signed out (`contained`). */
export default function PublicLayout({ contained = false }) {
  const { status } = useAuth();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topnav">
        <div className="container topnav__inner">
          <Logo to={status === 'signedIn' ? '/home' : '/'} />
          <div className="topnav__actions">
            <CrisisButton />
            {status === 'signedIn' ? (
              <Link to="/home" className="btn btn--sm btn--primary">
                Open MindMate
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--sm btn--ghost">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn--sm btn--primary public-nav__join">
                  Join free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={contained ? 'app-main container' : undefined}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
