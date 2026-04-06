export async function register(): Promise<void> {
  // Only load the Node sync graph when this bundle is the Node instrumentation target.
  // If we used `!== 'edge'`, builds where `NEXT_RUNTIME` is compiled to `""` would still
  // follow the dynamic import and webpack would try to bundle `path`/`fs` for Edge → failure.
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }
  const { initNotionSyncCron } = await import('./instrumentation-node');
  initNotionSyncCron();
}
