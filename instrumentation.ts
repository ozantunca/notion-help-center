export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initNotionSyncCron } = await import('./instrumentation-node');
    initNotionSyncCron();
  }
}
