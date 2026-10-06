import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Check } from 'lucide-react';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';
import { Alert, Field, PasswordInput, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../lib/firebase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordChecks = (pw) => [
  { ok: pw.length >= 8, label: 'At least 8 characters' },
  { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: 'A letter and a number' },
];

export function validateSignup({ name, email, password, confirm, agree }) {
  const errs = {};
  if (name.trim().length < 2) errs.name = 'Tell us what to call you (at least 2 characters).';
  if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address, like name@example.com.';
  if (!passwordChecks(password).every((c) => c.ok)) errs.password = 'Your password needs at least 8 characters, including a letter and a number.';
  if (confirm !== password) errs.confirm = 'The passwords don’t match.';
  if (!agree) errs.agree = 'Please confirm you understand what MindMate is for.';
  return errs;
}

export default function Signup() {
  const { signUp, signInWithGoogle, firebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', agree: false });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validateSignup(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setSubmitError('');
    try {
      await signUp({ name: form.name.trim(), email: form.email, password: form.password });
      navigate('/home?welcome=1', { replace: true });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErrors({ email: authErrorMessage(err) });
      else setSubmitError(err.code ? authErrorMessage(err) : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    setSubmitError('');
    try {
      await signInWithGoogle();
      navigate('/home?welcome=1', { replace: true });
    } catch (err) {
      setSubmitError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your space"
      subtitle="Free and private. It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <GoogleButton onClick={onGoogle} disabled={busy || !firebaseConfigured} label="Sign up with Google" />
      <form onSubmit={onSubmit} noValidate>
        <Field label="What should we call you?" hint="A first name or nickname is fine." error={errors.name}>
          {(p) => <input {...p} className="input" autoComplete="given-name" value={form.name} onChange={set('name')} disabled={busy} maxLength={60} />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(p) => <input {...p} className="input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={set('email')} disabled={busy} />}
        </Field>
        <Field label="Password" error={errors.password}>
          {(p) => (
            <>
              <PasswordInput {...p} autoComplete="new-password" value={form.password} onChange={set('password')} disabled={busy} />
              <ul className="list-plain pw-checks" aria-label="Password requirements">
                {passwordChecks(form.password).map((c) => (
                  <li key={c.label} className={c.ok ? 'ok' : ''}>
                    <Check size={14} aria-hidden /> {c.label}
                    <span className="sr-only">{c.ok ? ' (met)' : ' (not met yet)'}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" value={form.confirm} onChange={set('confirm')} disabled={busy} />}
        </Field>
        <div className="field">
          <label className="checkbox small">
            <input type="checkbox" checked={form.agree} onChange={set('agree')} disabled={busy} aria-invalid={errors.agree ? 'true' : undefined} />
            <span>
              I understand MindMate is a self-care tool, not a medical or emergency service, and I’ve read the <Link to="/privacy">privacy notice</Link>.
            </span>
          </label>
          {errors.agree && <p className="field__error">{errors.agree}</p>}
        </div>
        {submitError && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Alert type="error">{submitError}</Alert>
          </div>
        )}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy || !firebaseConfigured}>
          {busy && <Spinner />}
          {busy ? 'Creating your account…' : 'Create account'}
          {!busy && <ArrowRight size={18} aria-hidden />}
        </button>
      </form>
    </AuthLayout>
  );
}
