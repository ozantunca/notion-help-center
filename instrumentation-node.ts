/**
 * Node-only instrumentation (cron, SQLite sync chain). Loaded only when
 * `NEXT_RUNTIME === 'nodejs'` via dynamic import from `instrumentation.ts`
 * so the Edge instrumentation bundle does not pull in Node built-ins.
 */
import { startNotionSyncCron } from './lib/sync-notion-cron';

export function initNotionSyncCron(): void {
  startNotionSyncCron();
}
