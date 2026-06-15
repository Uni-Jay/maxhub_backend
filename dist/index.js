"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("@/app");
async function main() {
    const bootstrapper = new app_1.AppBootstrapper();
    await bootstrapper.start();
}
main().catch((error) => {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map