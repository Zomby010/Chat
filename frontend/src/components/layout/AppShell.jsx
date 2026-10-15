import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { ChevronDown, House, LogOut, MessageCircleHeart, Monitor, Moon, Smile, Sprout, Sun, User, LifeBuoy, BookHeart } from 'lucide-react';
import Logo from './Logo';
import CrisisButton from '../crisis/CrisisButton';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Alert } from '../ui';

const NAV = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/mood', label: 'Check-in', icon: Smile },
  { to: '/chat', label: 'Talk', icon: MessageCircleHeart },
  { to: '/wellbeing', label: 'Wellbeing', icon: Sprout },
  { to: '/resources', label: 'Support', icon: BookHeart, optional: true },
];

const MOBILE_NAV = [...NAV.slice(0, 4), { to: '/profile', label: 'Profile', icon: User }];

function ProfileMenu() {
  const { profile, user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = profile?.displayName || user?.displayName || 'You';
  const nextTheme = { system: 'light', light: 'dark', dark: 'system' }[theme];
  const ThemeIcon = { system: Monitor, light: Sun, dark: Moon }[theme];

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="menu__trigger" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden>
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="menu__name small" style={{ fontWeight: 600 }}>
          {name.split(' ')[0]}
        </span>
        <ChevronDown size={16} aria-hidden />
        <span className="sr-only">Account menu</span>
      </button>
      {open && (
        <div className="menu__panel">
          <div className="menu__label">{user?.email}</div>
          <Link to="/profile" className="menu__item">
            <User size={16} aria-hidden /> Profile & privacy
          </Link>
          <button type="button" className="menu__item" onClick={() => setTheme(nextTheme)}>
            <ThemeIcon size={16} aria-hidden /> Theme: {theme[0].toUpperCase() + theme.slice(1)}
          </button>
          <Link to="/resources" className="menu__item">
            <LifeBuoy size={16} aria-hidden /> Support resources
          </Link>
          <div className="menu__sep" />
          <button
            type="button"
            className="menu__item"
            onClick={async () => {
              await signOut();
              toast.success('You’ve signed out. Take care.');
              navigate('/login');
            }}
          >
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteFooter({ app = false }) {
  return (
    <footer className={`footer${app ? ' footer--app' : ''}`}>
      <div className="container footer__inner">
        <p className="footer__disclaimer">
          MindMate is a self-care and support tool. It is not a medical service and does not replace professional care. In an emergency, contact your local emergency number.
        </p>
        <ul className="footer__links">
          <li>
            <Link to="/resources">Support resources</Link>
          </li>
          <li>
            <Link to="/privacy">Privacy</Link>
          </li>
          <li>
            <Link to="/about">About & evidence</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}

/** Layout for signed-in pages: top nav, mobile bottom nav, crisis button. */
export default function AppShell() {
  const { profileError, reloadProfile } = useAuth();
  const location = useLocation();
  const mainRef = useRef(null);

  // Move focus to the page content on navigation (screen readers announce the new page).
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topnav">
        <div className="container topnav__inner">
          <Logo to="/home" />
          <nav aria-label="Main">
            <ul className="topnav__links">
              {NAV.map(({ to, label, icon: Icon, optional }) => (
                <li key={to}>
                  <NavLink to={to} className="navlink">
                    <Icon size={17} aria-hidden />
                    <span className={optional ? 'navlink__text--optional' : undefined}>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="topnav__actions">
            <CrisisButton />
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main id="main" className="app-main container" ref={mainRef} tabIndex={-1}>
        {profileError && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <Alert
              type="warning"
              title="We couldn’t load your profile"
              action={
                <button type="button" className="btn btn--sm" onClick={reloadProfile}>
                  Retry
                </button>
              }
            >
              {profileError.message}
            </Alert>
          </div>
        )}
        <Outlet />
      </main>
      <SiteFooter app />

      <nav className="bottomnav" aria-label="Main">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <span className="bottomnav__icon">
              <Icon size={20} aria-hidden />
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
