import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { MailCheck } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Alert, Field, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../lib/firebase';

export default function ForgotPassword() {
  const { resetPassword, firebaseConfigured } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter the email address you signed up with.');
    setBusy(true);
    setError('');
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Don't reveal whether an account exists for this email.
      if (err.code === 'auth/user-not-found') setSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a secure link to choose a new one."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {sent ? (
        <Alert type="success" title="Check your inbox" icon={MailCheck}>
          If an account exists for <strong>{email.trim()}</strong>, a reset link is on its way. It can take a few minutes, and may land in spam.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <Field label="Email" error={error}>
            {(p) => <input {...p} className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />}
          </Field>
          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || !firebaseConfigured}>
            {busy && <Spinner />} {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
