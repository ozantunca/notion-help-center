import cron from "node-cron";
import { runNotionSync } from "./run-notion-sync";

const ENV_CRON = "HELP_CENTER_SYNC_CRON";

/** Used in production when `HELP_CENTER_SYNC_CRON` is unset (every 6 hours, server timezone). */
const DEFAULT_SYNC_CRON = "0 */6 * * *";

const cronGlobal = globalThis as typeof globalThis & {
  __helpCenterSyncCronStarted?: boolean;
};

let syncInProgress = false;

async function runScheduledSync(): Promise<void> {
  if (syncInProgress) {
    console.warn(
      "[help-center] Periodic Notion sync skipped: previous run still in progress",
    );
    return;
  }
  syncInProgress = true;
  try {
    await runNotionSync();
  } catch (err) {
    console.error("[help-center] Periodic Notion sync failed:", err);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Registers periodic Notion sync via `node-cron`.
 * If `HELP_CENTER_SYNC_CRON` is unset or blank, uses {@link DEFAULT_SYNC_CRON}.
 * Runs one sync immediately on server start only in **production** when Notion env vars are set
 * (avoids a full sync on every `pnpm dev` restart).
 */
export function startNotionSyncCron(): void {
  if (cronGlobal.__helpCenterSyncCronStarted) {
    return;
  }

  const raw = (process.env[ENV_CRON] ?? "").trim();
  const isProd = process.env.NODE_ENV === "production";
  const expression = raw || DEFAULT_SYNC_CRON;

  if (!cron.validate(expression)) {
    console.error(
      `[help-center] ${ENV_CRON} is not a valid cron expression (${JSON.stringify(raw || expression)}); periodic sync disabled`,
    );
    return;
  }

  cron.schedule(expression, () => {
    void runScheduledSync();
  });
  cronGlobal.__helpCenterSyncCronStarted = true;

  if (raw) {
    console.info(
      `[help-center] Periodic Notion sync scheduled: ${ENV_CRON}=${JSON.stringify(expression)}`,
    );
  } else {
    console.info(
      `[help-center] Periodic Notion sync scheduled: ${ENV_CRON} unset, using default ${JSON.stringify(expression)}`,
    );
  }

  const hasNotionCreds =
    Boolean(process.env.NOTION_API_KEY?.trim()) &&
    Boolean(process.env.NOTION_DATABASE_ID?.trim());

  if (isProd && hasNotionCreds) {
    console.info(
      "[help-center] Running initial Notion sync on server start...",
    );
    void runScheduledSync();
  }
}
