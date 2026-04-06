import cron from "node-cron";
import { runNotionSync } from "./run-notion-sync";

const ENV_CRON = "HELP_CENTER_SYNC_CRON";

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

/** Start node-cron when `HELP_CENTER_SYNC_CRON` is a valid expression (see node-cron package docs). */
export function startNotionSyncCron(): void {
  if (cronGlobal.__helpCenterSyncCronStarted) {
    return;
  }

  const expression = (process.env[ENV_CRON] ?? "").trim();
  if (!expression) {
    return;
  }

  if (!cron.validate(expression)) {
    console.error(
      `[help-center] ${ENV_CRON} is not a valid cron expression (${JSON.stringify(expression)}); periodic sync disabled`,
    );
    return;
  }

  cron.schedule(expression, () => {
    void runScheduledSync();
  });

  cronGlobal.__helpCenterSyncCronStarted = true;
  console.info(
    `[help-center] Periodic Notion sync scheduled: ${ENV_CRON}=${JSON.stringify(expression)}`,
  );
  console.info("[help-center] Running initial Notion sync on server start...");
  void runScheduledSync();
}
