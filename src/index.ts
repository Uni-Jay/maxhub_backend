// Must run before anything else loads - static imports get hoisted above
// this by the compiler, so the app/DB modules are loaded via dynamic
// import() below to guarantee TZ is set first. Nigeria has a single
// timezone (WAT, UTC+1, no DST), so this fixes Date-based "today"
// calculations (attendance, etc.) everywhere without needing it set
// per-call - only an explicit TZ from the host environment overrides it.
process.env.TZ = process.env.TZ || 'Africa/Lagos';

/**
 * Entry point for the MaxHub ERP Backend
 * Initializes and starts the Express server with all middleware, models, and routes
 */
async function main() {
  const { AppBootstrapper } = await import('@/app');
  const bootstrapper = new AppBootstrapper();
  await bootstrapper.start();
}

main().catch((error) => {
  console.error('Fatal error during application startup:', error);
  process.exit(1);
});
