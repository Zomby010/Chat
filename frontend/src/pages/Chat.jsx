import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CircleAlert, HeartHandshake, History, MessageCirclePlus, RefreshCw, Send, Trash2, X } from 'lucide-react';
import RichText from '../components/chat/RichText';
import CrisisResourceList from '../components/crisis/CrisisResourceList';
import { ConfirmDialog, ErrorState, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatDateTime, formatTime } from '../lib/format';

const STARTERS = [
  'I’m feeling anxious and can’t switch off',
  'I had a really hard day',
  'I can’t sleep',
  'I feel lonely lately',
  'Help me calm down before an exam',
];

function SupportCard({ region }) {
  return (
    <div className="support-banner chat-support" role="note">
      <h3>
        <HeartHandshake size={18} aria-hidden /> You don’t have to face this alone
      </h3>
      <p className="small">These services are free, confidential and staffed by trained people.</p>
      <CrisisResourceList region={region} compact />
    </div>
  );
}

function SessionList({ sessions, activeId, onSelect, onNew }) {
  return (
    <div className="chat-sessions">
      <button type="button" className="btn btn--primary btn--block" onClick={onNew}>
        <MessageCirclePlus size={18} aria-hidden /> New conversation
      </button>
      {sessions?.length ? (
        <ul className="list-plain chat-sessions__list" aria-label="Previous conversations">
          {sessions.map((s) => (
            <li key={s.id}>
              <button type="button" className={`chat-session${s.id === activeId ? ' is-active' : ''}`} aria-current={s.id === activeId ? 'true' : undefined} onClick={() => onSelect(s.id)}>
                <span className="chat-session__title">{s.title}</span>
                <span className="tiny muted">{formatDateTime(s.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="small muted" style={{ padding: 'var(--space-3)' }}>
          Your conversations will be saved here so you can come back to them.
        </p>
      )}
    </div>
  );
}

export default function Chat() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const sessions = useApiData(() => api.get('/chat/sessions'), []);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convError, setConvError] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [failedText, setFailedText] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const skipLoad = useRef(null);

  const activeSession = sessions.data?.find((s) => s.id === routeId);

  // Load the selected conversation.
  useEffect(() => {
    setSendError(null);
    setFailedText(null);
    if (!routeId) {
      setMessages([]);
      return;
    }
    if (skipLoad.current === routeId) {
      skipLoad.current = null;
      return;
    }
    let cancelled = false;
    setLoadingConv(true);
    setConvError(null);
    api
      .get(`/chat/sessions/${routeId}`)
      .then((d) => !cancelled && setMessages(d.messages))
      .catch((err) => !cancelled && setConvError(err))
      .finally(() => !cancelled && setLoadingConv(false));
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  async function send(text) {
    const clean = text.trim();
    if (!clean || sending) return;
    setSending(true);
    setSendError(null);
    setFailedText(null);
    setInput('');
    const tempId = `pending-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: 'user', content: clean, createdAt: new Date().toISOString(), pending: true }]);
    try {
      let sid = routeId;
      if (!sid) {
        const s = await api.post('/chat/sessions', {});
        sid = s.id;
        skipLoad.current = sid;
        navigate(`/chat/${sid}`, { replace: true });
      }
      const res = await api.post(`/chat/sessions/${sid}/messages`, { text: clean });
      setMessages((m) => [...m.filter((x) => x.id !== tempId), res.userMessage, res.assistantMessage]);
      if (res.aiError) setSendError({ message: 'The AI companion couldn’t reply just now, so MindMate answered with its safety message. You can keep writing.' });
      sessions.reload();
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setFailedText(clean);
      setInput(clean);
      setSendError(err);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function deleteConversation() {
    setDeleting(true);
    try {
      await api.del(`/chat/sessions/${routeId}`);
      toast.success('Conversation deleted.');
      setConfirmDelete(false);
      await sessions.reload();
      navigate('/chat', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const errorHelp = (err) => {
    if (!err) return null;
    if (err.code === 'AI_NOT_CONFIGURED') return 'The AI companion hasn’t been set up on this server yet. Breathing, mindfulness and crisis resources still work.';
    if (err.code === 'RATE_LIMITED' || err.code === 'AI_RATE_LIMITED') return 'Things are a little busy. Please wait a moment, then try again.';
    return err.message;
  };

  const userTurns = messages.filter((m) => m.role === 'user');

  return (
    <div className="chat">
      <aside className={`chat__aside${showSessions ? ' is-open' : ''}`} aria-label="Conversations">
        <div className="chat__aside-head">
          <h2 className="card__title">Conversations</h2>
          <button type="button" className="btn btn--ghost btn--icon btn--sm chat__aside-close" onClick={() => setShowSessions(false)} aria-label="Close conversations">
            <X size={18} aria-hidden />
          </button>
        </div>
        {sessions.error ? (
          <ErrorState error={sessions.error} onRetry={sessions.reload} />
        ) : (
          <SessionList
            sessions={sessions.data}
            activeId={routeId}
            onNew={() => {
              setShowSessions(false);
              navigate('/chat');
            }}
            onSelect={(sid) => {
              setShowSessions(false);
              navigate(`/chat/${sid}`);
            }}
          />
        )}
      </aside>

      <section className="chat__main" aria-label="Conversation">
        <header className="chat__header">
          <button type="button" className="btn btn--ghost btn--sm chat__history-btn" onClick={() => setShowSessions(true)}>
            <History size={16} aria-hidden /> History
          </button>
          <div className="chat__title">
            <h1>{activeSession?.title || 'Talk to MindMate'}</h1>
            <p className="tiny muted">An AI companion for support, not a therapist or emergency service.</p>
          </div>
          {routeId && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} aria-hidden /> <span className="chat__delete-label">Delete</span>
            </button>
          )}
        </header>

        <div className="chat__log" role="log" aria-live="polite" aria-relevant="additions" aria-busy={sending}>
          {loadingConv && (
            <div className="page-loader">
              <Spinner large />
            </div>
          )}
          {convError && <ErrorState error={convError} title="This conversation didn’t load" onRetry={() => navigate(0)} />}

          {!routeId && !messages.length && (
            <div className="chat__intro">
              <span className="icon-badge icon-badge--accent" style={{ width: 56, height: 56 }}>
                <HeartHandshake size={26} aria-hidden />
              </span>
              <h2>What’s on your mind?</h2>
              <p className="muted">Share as much or as little as you like. I’ll listen, and we can find a small next step together.</p>
              <div className="chip-group" style={{ justifyContent: 'center' }}>
                {STARTERS.map((s) => (
                  <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={sending}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => {
            const prevUser = m.role === 'assistant' ? messages[i - 1] : null;
            const showSupport = prevUser?.safety && prevUser.safety.level !== 'none';
            return (
              <div key={m.id}>
                <div className={`bubble-row bubble-row--${m.role}`}>
                  <div className={`bubble bubble--${m.role}${m.pending ? ' is-pending' : ''}`}>
                    <span className="sr-only">{m.role === 'user' ? 'You said:' : 'MindMate said:'}</span>
                    {m.role === 'assistant' ? <RichText text={m.content} /> : <p>{m.content}</p>}
                    <span className="bubble__time">{m.pending ? 'Sending…' : formatTime(m.createdAt)}</span>
                  </div>
                </div>
                {showSupport && <SupportCard region={profile?.region} />}
              </div>
            );
          })}

          {sending && (
            <div className="bubble-row bubble-row--assistant">
              <div className="bubble bubble--assistant typing" aria-label="MindMate is typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {sendError && (
          <div className="chat__error" role="alert">
            <CircleAlert size={18} aria-hidden />
            <span>{errorHelp(sendError)}</span>
            {failedText && (
              <button type="button" className="btn btn--sm btn--danger" onClick={() => send(failedText)} disabled={sending}>
                <RefreshCw size={14} aria-hidden /> Retry
              </button>
            )}
            <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setSendError(null)} aria-label="Dismiss">
              <X size={16} aria-hidden />
            </button>
          </div>
        )}

        <form
          className="chat__composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message MindMate
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            className="textarea chat__input"
            rows={1}
            maxLength={2000}
            placeholder="Type how you’re feeling…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="btn btn--primary btn--icon" disabled={!input.trim() || sending} aria-label="Send message">
            {sending ? <Spinner /> : <Send size={18} aria-hidden />}
          </button>
        </form>
        <p className="tiny muted chat__footnote">
          {userTurns.length > 0 && input.length > 1500 ? `${2000 - input.length} characters left · ` : ''}
          Conversations are saved privately to your account. <Link to="/profile">Manage your data</Link>
        </p>
      </section>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={deleteConversation} busy={deleting} title="Delete this conversation?">
        All messages in this conversation will be permanently deleted.
      </ConfirmDialog>
    </div>
  );
}
