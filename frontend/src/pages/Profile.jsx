import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, LogOut, MessageSquareX, Monitor, Moon, Sun, Trash2, UserX } from 'lucide-react';
import { ConfirmDialog, Field, Spinner, Switch } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api, fieldErrors } from '../lib/api';
import { REGIONS } from '../lib/region';

const THEMES = [
  ['system', 'Match device', Monitor],
  ['light', 'Light', Sun],
  ['dark', 'Dark', Moon],
];

/** Builds a JSON file in the browser and saves it. Exported for tests. */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Profile() {
  const { profile, user, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.displayName || '');
  const [region, setRegion] = useState(profile?.region || 'INTL');
  const [goal, setGoal] = useState(profile?.preferences.weeklyMovementGoal ?? 150);
  const [sleepGoal, setSleepGoal] = useState(profile?.preferences.sleepGoalHours ?? 8);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingPref, setSavingPref] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.displayName || '');
    setRegion(profile.region || 'INTL');
    setGoal(profile.preferences.weeklyMovementGoal);
    setSleepGoal(profile.preferences.sleepGoalHours);
  }, [profile]);

  if (!profile) return <Spinner large label="Loading your profile" />;
  const prefs = profile.preferences;

  async function saveDetails(e) {
    e.preventDefault();
    const next = {};
    if (!name.trim()) return setErrors({ displayName: 'Please enter a name.' });
    const goalNum = Number(goal);
    const sleepNum = Number(sleepGoal);
    if (!Number.isInteger(goalNum) || goalNum < 10 || goalNum > 1000) return setErrors({ weeklyMovementGoal: 'Choose a whole number between 10 and 1000.' });
    if (!(sleepNum >= 4 && sleepNum <= 12)) return setErrors({ sleepGoalHours: 'Choose between 4 and 12 hours.' });
    next.displayName = name.trim();
    next.region = region;
    next.preferences = { weeklyMovementGoal: goalNum, sleepGoalHours: sleepNum };
    setErrors({});
    setSaving(true);
    try {
      await updateProfile(next);
      toast.success('Profile saved.');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePref(key, value) {
    setSavingPref(key);
    try {
      await updateProfile({ preferences: { [key]: value } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPref(null);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const data = await api.get('/me/export');
      downloadJson(data, `mindmate-export-${new Date().toISOString().slice(0, 10)}.json`);
      toast.success('Your data has been downloaded.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  }

  const ACTIONS = {
    chats: {
      title: 'Delete all conversations?',
      body: 'Every conversation with the companion will be permanently deleted. Your check-ins and logs are kept.',
      label: 'Delete conversations',
      run: async () => {
        await api.del('/chat/sessions');
        toast.success('All conversations deleted.');
      },
    },
    data: {
      title: 'Delete all your data?',
      body: 'All check-ins, wellbeing logs, plans and conversations will be permanently deleted. Your account stays, so you can start fresh.',
      label: 'Delete all data',
      run: async () => {
        await api.del('/me/data');
        toast.success('All your data has been deleted.');
        navigate('/home');
      },
    },
    account: {
      title: 'Delete your account?',
      body: 'Your account and everything in it will be permanently deleted. This can’t be undone. You may want to download your data first.',
      label: 'Delete my account',
      typed: true,
      run: async () => {
        await api.del('/me');
        await signOut({ to: '/' }).catch(() => {});
        toast.success('Your account has been deleted. Take care of yourself.');
      },
    },
  };
  const action = confirm && ACTIONS[confirm];

  async function runConfirmed() {
    setBusy(true);
    try {
      await action.run();
      setConfirm(null);
      setConfirmText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header__text">
          <h1>Your profile</h1>
          <p>Signed in as {user?.email || profile.email}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => signOut()}>
          <LogOut size={16} aria-hidden /> Sign out
        </button>
      </div>

      <div className="grid grid--2 section" style={{ alignItems: 'start' }}>
        <section className="card" aria-labelledby="details">
          <h2 id="details" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
            Your details
          </h2>
          <form onSubmit={saveDetails} noValidate>
            <Field label="Name" error={errors.displayName}>
              {(p) => <input {...p} className="input" maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
            </Field>
            <Field label="Country for support lines" error={errors.region} hint="We use this to show the right crisis numbers. Choose “International” if yours isn’t listed.">
              {(p) => (
                <select {...p} className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="grid grid--2" style={{ gap: 'var(--space-4)' }}>
              <Field label="Weekly activity goal (minutes)" error={errors.weeklyMovementGoal} hint="WHO suggests 150–300.">
                {(p) => <input {...p} className="input" type="number" inputMode="numeric" min={10} max={1000} step={10} value={goal} onChange={(e) => setGoal(e.target.value)} />}
              </Field>
              <Field label="Sleep goal (hours)" error={errors.sleepGoalHours} hint="Most adults need 7–9.">
                {(p) => <input {...p} className="input" type="number" inputMode="decimal" min={4} max={12} step={0.5} value={sleepGoal} onChange={(e) => setSleepGoal(e.target.value)} />}
              </Field>
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving && <Spinner />} Save changes
            </button>
          </form>
        </section>

        <div className="stack stack--lg">
          <section className="card" aria-labelledby="privacy-settings">
            <h2 id="privacy-settings" className="card__title" style={{ marginBottom: 'var(--space-4)' }}>
              Privacy & personalisation
            </h2>
            <div className="stack">
              <Switch
                label="Use my first name in conversations"
                description="The companion addresses you by name."
                checked={prefs.shareNameWithAI}
                disabled={savingPref === 'shareNameWithAI'}
                onChange={(v) => togglePref('shareNameWithAI', v)}
              />
              <Switch
                label="Share my recent mood with the companion"
                description="Your latest check-in (from the past week) is sent to the AI provider so replies can take it into account."
                checked={prefs.shareMoodWithAI}
                disabled={savingPref === 'shareMoodWithAI'}
                onChange={(v) => togglePref('shareMoodWithAI', v)}
              />
              <Switch
                label="Show a daily joke"
                description="Hidden automatically on days you check in feeling low."
                checked={prefs.showJokes}
                disabled={savingPref === 'showJokes'}
                onChange={(v) => togglePref('showJokes', v)}
              />
            </div>
          </section>

          <section className="card" aria-labelledby="appearance">
            <h2 id="appearance" className="card__title" style={{ marginBottom: 'var(--space-3)' }}>
              Appearance
            </h2>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {THEMES.map(([value, label, Icon]) => (
                <button key={value} type="button" role="radio" aria-checked={theme === value} className="chip" onClick={() => setTheme(value)}>
                  <Icon size={15} aria-hidden /> {label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="card section" aria-labelledby="your-data">
        <h2 id="your-data" className="card__title">
          Your data
        </h2>
        <p className="small muted">You’re in control. Download a copy of everything MindMate stores about you, or delete it.</p>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <button type="button" className="btn btn--soft" onClick={exportData} disabled={exporting}>
            {exporting ? <Spinner /> : <Download size={17} aria-hidden />} Download my data
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirm('chats')}>
            <MessageSquareX size={17} aria-hidden /> Delete conversations
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirm('data')}>
            <Trash2 size={17} aria-hidden /> Delete all data
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setConfirm('account')}>
            <UserX size={17} aria-hidden /> Delete account
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(action)}
        onClose={() => {
          if (busy) return;
          setConfirm(null);
          setConfirmText('');
        }}
        onConfirm={() => {
          if (action?.typed && confirmText.trim().toUpperCase() !== 'DELETE') return;
          runConfirmed();
        }}
        title={action?.title}
        confirmLabel={action?.label}
        busy={busy}
        confirmDisabled={action?.typed && confirmText.trim().toUpperCase() !== 'DELETE'}
      >
        <p style={{ marginTop: 0 }}>{action?.body}</p>
        {action?.typed && (
          <Field label="Type DELETE to confirm">
            {(p) => <input {...p} className="input" autoComplete="off" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />}
          </Field>
        )}
      </ConfirmDialog>
    </>
  );
}
