# Building, bundling, and linting

The user-facing version of this page is [`docs/guide/building.md`](../docs/guide/building.md). This file is the maintainer's view: what each script does and what it leaves on disk.

## Prerequisites

Node version is pinned in [`.nvmrc`](../.nvmrc). The repository uses npm and a committed `package-lock.json`.

```bash
npm ci
```

## Everyday commands

| Command | What it does |
|---|---|
| `npm run compile` | `tsc` into `lib/`. The input to every bundle. |
| `npm run bundle-all` | Clean, compile, produce every bundle, then verify them. |
| `npm run lint` | ESLint over `.js` and `.ts`. **The source of truth for formatting and code rules.** |
| `npm run lint:fix` | The same, with `--fix`. |
| `npm run test` | Lint, Jest, and the Karma browser run. |
| `npm run test:jest` | Jest only — the fast loop. |
| `npm run test:watch` | Jest in watch mode. |
| `npm run clean` | Remove every build output. |

## Bundles

`npm run bundle-all` runs `clean`, `compile`, every `bundle:*`, then `verify-bundles`.

| Script | Output |
|---|---|
| `bundle:es` | `es/` — ES modules, `.mjs` extension |
| `bundle:cjs` | `commonjs/` — CommonJS modules |
| `bundle:development` | `dist/hyperformula.js`, `dist/hyperformula.full.js` |
| `bundle:production` | `dist/hyperformula.min.js`, `dist/hyperformula.full.min.js` |
| `bundle:languages` | `languages/` — standalone UMD language packs |
| `bundle:typings` | `typings/` — public `.d.ts` declarations |

`verify-bundles` runs every `verify:*` check in parallel: each `dist/` artifact and the `commonjs/` output must exist and be non-trivial (`script/check-file.js`), and `verify:typings` type-checks with `tsc --noEmit`.

Two bundle variants exist: the base build and the `.full` build. When a change can affect bundling, packaging, or module resolution, confirm both still work.

`verify:publish-package` runs `npm pack` through `script/check-publish-package.js` — use it when a change touches `package.json`, `.npmignore`, or the `exports`/`typings` surface.

## Documentation

| Command | What it does |
|---|---|
| `npm run docs:dev` | Generate the function docs and API reference, then serve the portal locally |
| `npm run docs:build` | The full production build of the portal |
| `npm run docs:generate-function-docs` | Regenerate `docs/guide/built-in-functions.md` from the function metadata catalogue |
| `npm run typedoc:build-api` | Regenerate `docs/api/` from JSDoc |

`docs/guide/built-in-functions.md` is generated and git-ignored — never commit it, and never edit it by hand. Its source is the metadata catalogue; see [`FUNCTION-CATALOGUE.md`](FUNCTION-CATALOGUE.md).

The portal is deployed as a Cloudflare Worker: `docs:build:cf` composes the assets through `script/prepare-cf-assets.js`, `docs:deploy:cf` and `docs:preview:cf` call `wrangler` against [`wrangler.jsonc`](../wrangler.jsonc). The Worker entry point is [`worker/index.js`](../worker/index.js).

## Release

`npm run release` runs `script/release/release.sh`. Releasing is maintainer-owned; do not invent steps around it.

`npm run check:licenses` asserts that every production dependency carries a permissive licence.
