/**
 * Writes the internal test license key into the live examples of an already built site, then checks where it
 * landed. `npm run preview:cf` runs it with `DOCS_TEST_LICENSE_KEY=true` before it uploads a preview version, so
 * the opt-in lives in the preview deploy command and never in the build that production shares.
 *
 * It refuses to run without the opt-in, and on the production branch (`src/preview-license-key.mjs`).
 */
import { createRequire } from 'node:module';
import process from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkKeyInOutput, injectIntoPages, resolvePreviewLicenseKey } from '../src/preview-license-key.mjs';

const DOCS_ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const buildConfig = createRequire(import.meta.url)('../build.config.js');
const distDir = resolve(DOCS_ROOT, process.env.DOCS_DEST || buildConfig.dest);
const key = resolvePreviewLicenseKey(process.env);

if (key === null) {
  console.error('Not writing the internal test license key: set DOCS_TEST_LICENSE_KEY=true, '
    + 'and never run this for the production branch.');
  process.exit(1);
}

console.log(`Wrote the internal test license key into ${injectIntoPages(distDir, key)} live examples.`);
checkKeyInOutput(distDir, { injected: true });
