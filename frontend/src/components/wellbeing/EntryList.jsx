import { Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, Spinner } from '../ui';

/** Recent entries with delete, shared by all activity pages. */
export default function EntryList({ title = 'Recent', state, render, empty, icon, describe }) {
  const { data, error, loading, reload, remove } = state;
  return (
    <section className="card" aria-label={title}>
      <h2 className="card__title" style={{ marginBottom: 'var(--space-3)' }}>
        {title}
      </h2>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data && <Spinner />}
      {data && !data.length && <EmptyState icon={icon} title={empty} />}
      {data && data.length > 0 && (
        <ul className="list-plain">
          {data.slice(0, 12).map((e) => (
            <li key={e.id} className="list-row">
              <div className="list-row__main">{render(e)}</div>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => remove(e.id)} aria-label={`Delete ${describe ? describe(e) : 'entry'}`}>
                <Trash2 size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
