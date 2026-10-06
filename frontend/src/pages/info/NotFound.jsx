import { Link } from 'react-router';
import { Compass } from 'lucide-react';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function NotFound() {
  const { status } = useAuth();
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      <EmptyState
        icon={Compass}
        title="We couldn’t find that page"
        action={
          <Link to={status === 'signedIn' ? '/home' : '/'} className="btn btn--primary">
            Go to {status === 'signedIn' ? 'home' : 'the start'}
          </Link>
        }
      >
        The link may be old, or the page may have moved.
      </EmptyState>
    </div>
  );
}
