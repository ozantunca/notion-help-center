import { runNotionSync } from './run-notion-sync';

export type SyncTrigger = 'startup' | 'schedule' | 'admin';

export interface SyncStatus {
  running: boolean;
  /** What started the current or last run. */
  trigger: SyncTrigger | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Result of the last finished run in this server process. */
  result: 'ok' | 'error' | null;
  error: string | null;
}

/**
 * One state per server process. Instrumentation (cron) and API routes are
 * separate bundles with separate module copies, so the state lives on
 * `globalThis`, which they share.
 */
const store = globalThis as typeof globalThis & { __helpCenterSyncStatus?: SyncStatus };

function state(): SyncStatus {
  store.__helpCenterSyncStatus ??= {
    running: false,
    trigger: null,
    startedAt: null,
    finishedAt: null,
    result: null,
    error: null,
  };
  return store.__helpCenterSyncStatus;
}

export function getSyncStatus(): SyncStatus {
  return { ...state() };
}

export function hasNotionCredentials(): boolean {
  return Boolean(process.env.NOTION_API_KEY?.trim()) && Boolean(process.env.NOTION_DATABASE_ID?.trim());
}

/**
 * Starts a Notion sync in the background. Returns `false`, and starts nothing,
 * when a sync is already running: the cron, startup and admin runs share this
 * guard so two syncs never write the database at the same time.
 */
export function startSync(trigger: SyncTrigger): boolean {
  const s = state();
  if (s.running) return false;
  s.running = true;
  s.trigger = trigger;
  s.startedAt = new Date().toISOString();
  s.error = null;

  console.info(`[help-center] Notion sync starting (${trigger}) at ${s.startedAt}`);
  void runNotionSync()
    .then(() => {
      s.result = 'ok';
      console.info(`[help-center] Notion sync completed (${trigger})`);
    })
    .catch((err: unknown) => {
      s.result = 'error';
      s.error = err instanceof Error ? err.message : String(err);
      console.error(`[help-center] Notion sync failed (${trigger}):`, err);
    })
    .finally(() => {
      s.running = false;
      s.finishedAt = new Date().toISOString();
    });
  return true;
}
