# Testing

## The two suites

| Suite | Where | Who has it |
|---|---|---|
| Smoke tests | [`test/smoke.spec.ts`](../test/smoke.spec.ts) | Everyone, in this repository |
| Full suite | `test/hyperformula-tests/` | Internal team and anyone granted access |

The full suite is kept in a separate private repository and is **git-ignored** here. It carries the unit tests, the browser and compatibility runs, and the performance benchmarks. External contributors put their tests in `test/`; the internal team moves them into the private repository through a separate pull request.

## Fetching the private suite

`test/hyperformula-tests` is **branch-matched to this repository**. [`test/fetch-tests.sh`](../test/fetch-tests.sh) checks out the branch with the same name, creating it from `develop` when it does not exist yet.

```bash
npm run test:setup-private
```

Run it after every branch switch. Skipping it runs the previous branch's tests against the current source, which passes or fails for reasons that have nothing to do with the change under test. See [`test/README.md`](../test/README.md) for the environment variables it honours.

## Running tests

| Command | Runs |
|---|---|
| `npm run test` | Lint, Jest, and the Karma browser run — the full local gate |
| `npm run test:jest` | Jest only; the fast loop |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:browser` | Karma, against the `dist` build |
| `npm run test:compatibility` | `test/compatibility/test-compatibility.sh` |
| `npm run test:performance` | The basic and CRUD benchmarks |

`test:performance`, `test:compatibility`, and the benchmark scripts all live inside `test/hyperformula-tests/`. Without the private suite they fail with a missing path, not with a test failure — read the error before concluding that something is broken.

## What a change must cover

- Every change to `src/` needs tests in `test/`. This is part of the [definition of done](DEFINITION-OF-DONE.md), not a suggestion.
- **Bug fix**: at least one test that reproduces the bug — it must fail against the unfixed code. Write it first and watch it fail.
- **New feature**: a set of tests that describe the feature precisely enough to serve as its specification.
- Cover more than the happy path: boundary values, empty and invalid input, error results, and interaction with related features.
- `docs/`, `examples/`, and `script/` are not tested.

## How to write a test case

- **One assertion per test case.** Each case is very simple and focused.
- **No control flow in a test case.** No loops, no conditionals. A parameterised loop hides which input failed; write the cases out.
- Name the case after the behaviour it pins, not after the function under test.
- A test must prove intended behaviour. Never relax an assertion, widen a matcher, or skip a case to turn a run green — if a test is red, the default assumption is that the code is wrong.

Before requesting a review, ask which further tests would be valuable and add the ones that protect against realistic regressions.

## Performance

HyperFormula is a calculation engine, so production-code performance is a feature. Run `npm run test:performance` for any change that can touch the evaluation or CRUD hot paths. See [`CODE-STYLE.md`](CODE-STYLE.md#performance).
