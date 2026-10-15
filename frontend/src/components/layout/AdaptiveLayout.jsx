import AppShell from './AppShell';
import PublicLayout from './PublicLayout';
import { useAuth } from '../../context/AuthContext';

/** Information pages (support, privacy, about) keep the app navigation when signed in. */
export default function AdaptiveLayout() {
  const { status } = useAuth();
  return status === 'signedIn' ? <AppShell /> : <PublicLayout contained />;
}
