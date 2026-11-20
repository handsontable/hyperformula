/**
 * Fails when the built site holds the internal test license key anywhere. `npm run deploy:cf` runs it before it
 * deploys to production: `npm run preview:cf` writes the key into the built site in place, so a production deploy of
 * the same build, or of a build made with `DOCS_TEST_LICENSE_KEY=true`, would otherwise ship it.
 */
import { createRequire } from 'node:module';
import process from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkKeyInOutput } from '../src/preview-license-key.mjs';

const DOCS_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const buildConfig = createRequire(import.meta.url)('../build.config.js');
const distDir = resolve(DOCS_ROOT, process.env.DOCS_DEST || buildConfig.dest);

try {
  checkKeyInOutput(distDir, { injected: false });
} catch (error) {
  console.error(`${error.message} Rebuild with \`npm run docs:build:cf\` before deploying to production.`);
  process.exit(1);
}
