import { useEffect, useId, useRef, useState } from 'react';
import { CircleAlert, Eye, EyeOff, RefreshCw, X } from 'lucide-react';

export function Spinner({ large, label }) {
  return <span className={`spinner${large ? ' spinner--lg' : ''}`} role={label ? 'status' : undefined} aria-label={label} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader" role="status">
      <Spinner large />
      <span>{label}</span>
    </div>
  );
}

export function Alert({ type = 'info', title, children, icon: Icon = CircleAlert, action }) {
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : undefined}>
      <Icon size={18} aria-hidden />
      <div className="alert__body">
        {title && <strong className="alert__title">{title}</strong>}
        {children}
      </div>
      {action}
    </div>
  );
}

/** Standard error display with an optional retry button. */
export function ErrorState({ error, onRetry, title = 'We couldn’t load this' }) {
  if (!error) return null;
  return (
    <Alert
      type="error"
      title={title}
      action={
        onRetry && (
          <button type="button" className="btn btn--sm btn--danger" onClick={onRetry}>
            <RefreshCw size={14} aria-hidden /> Try again
          </button>
        )
      }
    >
      {error.message}
    </Alert>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && (
        <span className="icon-badge">
          <Icon size={22} aria-hidden />
        </span>
      )}
      <p className="empty__title">{title}</p>
      {children && <p className="small" style={{ maxWidth: 420 }}>{children}</p>}
      {action}
    </div>
  );
}

/** Label + control + hint + error, wired together for screen readers. */
export function Field({ label, hint, error, children, id: idProp }) {
  const auto = useId();
  const id = idProp || auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined })}
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errId}>
          <CircleAlert size={14} aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput({ autoComplete = 'current-password', ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input {...props} type={show ? 'text' : 'password'} autoComplete={autoComplete} className="input input--with-action" />
      <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
        {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="row row--between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
      <div>
        <div id={`${id}-l`} style={{ fontWeight: 600 }}>
          {label}
        </div>
        {description && (
          <div id={`${id}-d`} className="small muted">
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Modal dialog built on the native <dialog> element: focus is trapped,
 * Escape closes it, and focus returns to the trigger afterwards.
 */
export function Dialog({ open, onClose, title, children, labelledBy }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={labelledBy || titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="dialog__inner">
          <div className="dialog__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Close">
              <X size={18} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = 'Delete', busy, confirmDisabled }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="stack">
        <div className="muted">{children}</div>
        <div className="row row--end">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm} disabled={busy || confirmDisabled}>
            {busy && <Spinner />} {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
