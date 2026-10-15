import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

/** Small, accessible notifications announced through an aria-live region. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (message, { type = 'success', duration = 4000 } = {}) => {
      const id = nextId++;
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({ success: (m, o) => show(m, { ...o, type: 'success' }), error: (m, o) => show(m, { duration: 7000, ...o, type: 'error' }) }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'error' ? <CircleAlert size={18} aria-hidden /> : <CircleCheck size={18} aria-hidden />}
            <span>{t.message}</span>
            <button type="button" className="toast__close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
