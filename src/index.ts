import { AppBootstrapper } from '@/app';

/**
 * Entry point for the MaxHub ERP Backend
 * Initializes and starts the Express server with all middleware, models, and routes
 */
async function main() {
  const bootstrapper = new AppBootstrapper();
  await bootstrapper.start();
}

main().catch((error) => {
  console.error('Fatal error during application startup:', error);
  process.exit(1);
});
