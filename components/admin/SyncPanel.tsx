import { useCallback, useEffect, useState } from 'react';
import type { AdminSyncResponse } from '../../pages/api/admin/sync';

const POLL_MS = 2000;

function formatTime(iso: string | null): string {
  if (!iso) return 'never';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

/** "Sync now" button and the result of the last sync. */
export function SyncPanel() {
  const [status, setStatus] = useState<AdminSyncResponse | null>(null);
  const [requestError, setRequestError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sync', { credentials: 'same-origin' });
      if (res.ok) setStatus((await res.json()) as AdminSyncResponse);
    } catch {
      /* keep the last known status */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll only while a sync runs.
  useEffect(() => {
    if (!status?.running) return;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [status?.running, refresh]);

  const onSync = async () => {
    setRequestError('');
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: '{}',
      });
      const data = (await res.json().catch(() => null)) as (AdminSyncResponse & { error?: string }) | null;
      if (data && 'running' in data) setStatus(data);
      if (!res.ok && res.status !== 409) setRequestError(data?.error || res.statusText);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not start the sync');
    }
  };

  const running = Boolean(status?.running);

  return (
    <section className="mt-8 rounded-md border border-gray-200 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Notion sync</h2>
          <p className="mt-1 text-sm text-gray-600">
            Last successful sync: <span className="font-medium">{formatTime(status?.lastSynced ?? null)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={!status || running || !status.configured}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {status && !status.configured && (
        <p className="mt-3 text-sm text-gray-600">
          Set <code className="rounded bg-gray-100 px-1">NOTION_API_KEY</code> and{' '}
          <code className="rounded bg-gray-100 px-1">NOTION_DATABASE_ID</code> to sync from Notion.
        </p>
      )}
      {running && (
        <p className="mt-3 text-sm text-gray-600" role="status">
          Started {formatTime(status?.startedAt ?? null)}. This can take a minute for large help centers.
        </p>
      )}
      {!running && status?.result === 'ok' && status.finishedAt && (
        <p className="mt-3 text-sm text-green-700" role="status">
          Last run finished {formatTime(status.finishedAt)} ({status.trigger}).
        </p>
      )}
      {!running && status?.result === 'error' && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          Last run failed {formatTime(status.finishedAt)} ({status.trigger}): {status.error?.replace(/\.+$/, '')}. See the server
          log for details.
        </p>
      )}
      {requestError && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {requestError}
        </p>
      )}
    </section>
  );
}
