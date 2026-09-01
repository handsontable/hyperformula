# Testing the engine

The suites, how to attach the private one, and what each kind of engine change must cover.

The standards these run against — what a change must prove, how a case is written, and the ways a run must never be made green — are repository-wide: [`dev-docs/TESTING.md`](TESTING.md).

## The two suites

| Suite | Where | Who has it |
|---|---|---|
| Smoke tests | [`hyperformula/test/smoke.spec.ts`](../test/smoke.spec.ts) | Everyone, in this repository |
| Full suite | `hyperformula/test/hyperformula-tests/` | Internal team and anyone granted access |

The full suite is kept in a separate private repository and is **git-ignored** here. It carries the unit tests, the browser and compatibility runs, and the performance benchmarks. External contributors put their tests in `hyperformula/test/`; the internal team moves them into the private repository through a separate pull request.

## Fetching the private suite

```bash
npm run test:setup-private
```

**Run it after every branch switch.** The suite is branch-matched, so skipping it runs the previous branch's tests against the current source: the results are meaningless, and they look like ordinary passes and failures. How the fetch works, and the environment variables it honours, are in [`hyperformula/test/README.md`](../../dev-docs/README.md). In a fresh git worktree the directory is absent entirely — see [`WORKTREES.md`](../../dev-docs/WORKTREES.md).

## Running tests

| Command | Runs |
|---|---|
| `npm run test` | Lint, Jest, and the Karma browser run — the full local gate |
| `npm run test:jest` | Jest only; the fast loop |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:browser` | Karma, against the `dist` build, in headless Chrome and Firefox |
| `npm run test:compatibility` | The compatibility suite, which ships with the private repository |
| `npm run test:performance` | The basic and CRUD benchmarks |

`test:performance`, `test:compatibility`, and the benchmark scripts all resolve into `hyperformula/test/hyperformula-tests/`, so they need the private suite attached. Without it they fail on a missing path rather than on an assertion — read the error before concluding the code is broken.

## What each kind of change needs

| Change | Cover |
|---|---|
| A built-in function | Ordinary arguments; each declared boundary (`minValue`, `maxValue`, `lessThan`, `greaterThan`); too few and too many arguments; wrong argument type, asserting the specific `CellError`; an argument that is itself an error; an empty cell and an empty range; the spilled shape if it returns an array; the call with an omitted optional argument |
| CRUD or a structural change | Add and remove rows and columns around a formula, move a range across a formula that references it, then assert **both** the recalculated value and the formula text afterwards — structural bugs show up in the formula text first |
| A parser change | The parse, the round trip through `Unparser`, at least one non-English language, and malformed input that must produce a parsing error rather than a throw |
| A config option | The default, a valid non-default value, and an invalid value that must be rejected |
| A translation | A formula parsed using the translated name, asserted in that language |

Skills: `hyperformula-unit-testing`, `test-writing-discipline`.

## Performance

HyperFormula is a calculation engine, so production-code performance is a feature. Run `npm run test:performance` for any change that can touch the evaluation or CRUD hot paths. See [`CODE-STYLE.md`](../../dev-docs/CODE-STYLE.md#performance).

## The browser run

`npm run test:browser` builds the `dist` bundle and runs the same specs in headless Chrome and Firefox, because the library ships to both.

Karma's `client.clearContext` must stay `true` in `.config/karma/base.js`. With it `false`, Chrome reports `Some of your tests did a full page reload!` *after* every spec has already passed, and the run exits non-zero — intermittently when the browsers run in parallel, and every single time when they run in sequence. The one place it belongs is `.config/karma/debug.js`, which sets it back to `false` so the kjhtml results page stays on screen between watch runs.

`npm run test:browser.debug` is that interactive config: Chrome only, no `singleRun`, watching for changes.
