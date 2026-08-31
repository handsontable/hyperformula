# Testing

## The two suites

| Suite | Where | Who has it |
|---|---|---|
| Smoke tests | [`test/smoke.spec.ts`](../test/smoke.spec.ts) | Everyone, in this repository |
| Full suite | `test/hyperformula-tests/` | Internal team and anyone granted access |

The full suite is kept in a separate private repository and is **git-ignored** here. It carries the unit tests, the browser and compatibility runs, and the performance benchmarks. External contributors put their tests in `test/`; the internal team moves them into the private repository through a separate pull request.

## Fetching the private suite

```bash
npm run test:setup-private
```

**Run it after every branch switch.** The suite is branch-matched, so skipping it runs the previous branch's tests against the current source: the results are meaningless, and they look like ordinary passes and failures. How the fetch works, and the environment variables it honours, are in [`test/README.md`](../test/README.md). In a fresh git worktree the directory is absent entirely — see [`WORKTREES.md`](WORKTREES.md).

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

```ts
it('returns the divisor sign for arguments with opposite signs', () => {
  const engine = HyperFormula.buildFromArray([['=MOD(-3, 12)']])

  expect(engine.getCellValue(adr('A1'))).toBe(9)
})
```

- **One assertion per test case.** Each case is very simple and focused. Split rather than adding a second `expect`.
- **No control flow in a test case.** No loops, no conditionals. A parameterised loop hides which input failed; write the cases out.
- Name the case after the behaviour it pins, not after the function under test: "returns `#VALUE!` when the range is empty", not "test SUMIFS".
- Build the smallest engine that exhibits the behaviour. A two-cell array beats a realistic sheet.
- Assert through the public API — `getCellValue`, `getCellFormula`, `getSheetValues` — not through internals.
- A test must prove intended behaviour. Never relax an assertion, widen a matcher, or skip a case to turn a run green — if a test is red, the default assumption is that the **code** is wrong.

Before requesting a review, ask which further tests would be valuable and add the ones that protect against realistic regressions.

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

HyperFormula is a calculation engine, so production-code performance is a feature. Run `npm run test:performance` for any change that can touch the evaluation or CRUD hot paths. See [`CODE-STYLE.md`](CODE-STYLE.md#performance).

## A test must prove behaviour

A test that passes without proving anything is worse than no test: it occupies the space where the real test would have gone, and it makes the next reader believe the behaviour is covered.

Write the case from the requirement, not from the implementation. Reading the implementation first and then writing a test that mirrors it produces a test that passes for any implementation, including the wrong one.

**When a test is red, the default assumption is that the code is wrong.** Change the test only when you can state, in one sentence, why its expectation was wrong — and that sentence must be about the specification, not about the effort of fixing the code.

### Banned ways of going green

- Relaxing an assertion: an exact value to `toBeCloseTo`, a specific error to "some error", `toEqual` to `toContain`.
- Deleting the assertion that fails and keeping the ones that pass.
- Adding `.skip` or `.todo`, or commenting out a case that used to run.
- Widening a matcher until every implementation passes.
- Catching the error the code should not be throwing, and asserting that it was caught.
- Mocking the unit under test, or mocking so deeply that only the mock is exercised.
- Asserting that a call "does not throw" when the requirement is a specific returned value.
- Changing the input until the current implementation happens to be right.

"This test fails and I do not yet know why" is a useful report. A green run that hides it is not.

### Hollow assertions

These execute code and prove nothing. Assert the value the specification names.

```ts
expect(engine.getCellValue(adr('A1'))).toBeDefined()      // any value passes
expect(() => engine.setCellContents(...)).not.toThrow()   // any non-throwing bug passes
expect(result).toBeTruthy()                                // 1, 'x', and [] all pass
```

Never claim a test passes without having run it, and never claim a fix works because the reasoning is sound.
