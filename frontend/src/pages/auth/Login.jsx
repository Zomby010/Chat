import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';
import { Alert, Field, PasswordInput, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../lib/firebase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { signIn, signInWithGoogle, firebaseConfigured, sessionMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const go = () => navigate(location.state?.from || '/home', { replace: true });

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter the email address you signed up with.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setSubmitError('');
    clearSessionMessage();
    try {
      await signIn(form.email, form.password);
      go();
    } catch (err) {
      setSubmitError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setSubmitError('');
    try {
      await signInWithGoogle();
      go();
    } catch (err) {
      setSubmitError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue looking after yourself."
      footer={
        <>
          New to MindMate? <Link to="/signup">Create a free account</Link>
        </>
      }
    >
      {sessionMessage && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert type="info">{sessionMessage}</Alert>
        </div>
      )}
      <GoogleButton onClick={onGoogle} disabled={busy || !firebaseConfigured} />
      <form onSubmit={onSubmit} noValidate>
        <Field label="Email" error={errors.email}>
          {(p) => <input {...p} className="input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} disabled={busy} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(p) => <PasswordInput {...p} value={form.password} onChange={set('password')} disabled={busy} />}
        </Field>
        <div className="row row--end" style={{ marginTop: 'calc(var(--space-3) * -1)', marginBottom: 'var(--space-5)' }}>
          <Link to="/forgot-password" state={{ email: form.email }} className="small">
            Forgot your password?
          </Link>
        </div>
        {submitError && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert type="error">{submitError}</Alert>
          </div>
        )}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || !firebaseConfigured}>
          {busy ? <Spinner /> : null}
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy && <ArrowRight size={18} aria-hidden />}
        </button>
      </form>
    </AuthLayout>
  );
}
