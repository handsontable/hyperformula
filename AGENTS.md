# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

HyperFormula is a headless spreadsheet engine (TypeScript library). No backend services, databases, or Docker containers are needed. All development tasks run in Node.js.

### Node version

The project requires **Node.js v16** (specified in `.nvmrc`). The VM ships with Node 22 by default; the update script switches to v16 via nvm. Some transitive dev dependencies warn about requiring Node >= 18, but everything works correctly on v16.

### Key commands

See `CLAUDE.md` and `package.json` `scripts` for the full list. Highlights:

- `npm run lint` — ESLint
- `npm run test:jest` — Jest smoke tests (the full unit test suite is private; only `test/smoke.spec.ts` is in the public repo)
- `npm run compile` — TypeScript compilation to `lib/`
- `npm run bundle:cjs` — build CommonJS output to `commonjs/` (needed to `require()` the library at runtime)
- `npm run bundle-all` — full build (compile + all bundle formats)

### Running the library (hello world)

After `npm run compile && npm run bundle:cjs`, you can `require('./commonjs')` in Node to use the engine:

```js
const { HyperFormula } = require('./commonjs');
const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });
```

### Testing caveats

- The public repo contains only smoke tests in `test/smoke.spec.ts`. The comprehensive test suite is maintained privately by Handsontable.
- Unit tests require full ICU data: the `test:jest` script sets `NODE_ICU_DATA=node_modules/full-icu` automatically via `cross-env`.
- Browser tests (`npm run test:browser`) require headless Chrome and Firefox and are optional for most development work.
