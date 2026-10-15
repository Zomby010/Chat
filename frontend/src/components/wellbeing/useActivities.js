import { useState } from 'react';
import { useApiData } from '../../hooks/useApiData';
import { useToast } from '../../context/ToastContext';
import { api, tzOffset } from '../../lib/api';

/** Shared data hook for one activity type: list, log and delete. */
export function useActivities(type, days = 30) {
  const toast = useToast();
  const list = useApiData(() => api.get('/activities', { query: { type, days } }), [type, days]);
  const [saving, setSaving] = useState(false);

  async function log(payload, successMessage) {
    setSaving(true);
    try {
      const entry = await api.post('/activities', { type, ...payload, tzOffset: tzOffset() });
      list.setData((d) => [entry, ...(d || [])]);
      if (successMessage) toast.success(successMessage);
      return entry;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.del(`/activities/${id}`);
      list.setData((d) => d.filter((x) => x.id !== id));
      toast.success('Entry deleted.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return { ...list, log, remove, saving };
}
