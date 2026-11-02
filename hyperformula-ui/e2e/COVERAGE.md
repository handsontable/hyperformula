# E2E coverage map

The e2e layer is a **basic integration smoke** tier: it proves the FormulaBuilder is wired up
and functional in a real page, not that every editor behavior is correct. Deep behavioral
coverage is owned by the unit suite (`packages/core/tests`); do not port behavior cases here.

## What runs

One shared factory — `runBasicSuite(descriptor)` in `tests/_shared/basicSuite.ts` — is invoked
from a one-line `tests/<framework>/<adapter>/formula-builder.spec.ts`. Tests are **DOM-only**:
they touch only `.hfe-editor__input` and `#result`, with no `window.*` demo hooks.

**Editor-only demo** (`js/basic`) — 1 check:

1. **computes** — type `=1+2` in the editor; `#result` shows `3`.

## Matrix

The suite boots one demo dev server (`e2e/playwright.config.ts` `webServer`): demo-js (5173).

| framework | port | demos (each = one basic spec) |
| --- | --- | --- |
| js | 5173 | basic (editor-only) |

When adding a demo route, add its descriptor to `DEMOS` in `tests/_shared/demos.ts` and drop a
one-line spec at `tests/<framework>/<adapter>/formula-builder.spec.ts`.
