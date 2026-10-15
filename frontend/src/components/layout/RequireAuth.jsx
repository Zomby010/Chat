import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../ui';

/** Protects signed-in routes and remembers where the user was heading. */
export function RequireAuth({ children }) {
  const { status, exitPath } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader label="Opening your space…" />;
  if (status === 'signedOut') {
    // After a deliberate sign-out go where asked; otherwise remember the page to return to.
    if (exitPath) return <Navigate to={exitPath} replace />;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

/** Sends signed-in users away from the login/sign-up pages. */
export function RedirectIfSignedIn({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <PageLoader />;
  if (status === 'signedIn') return <Navigate to={location.state?.from || '/home'} replace />;
  return children;
}
