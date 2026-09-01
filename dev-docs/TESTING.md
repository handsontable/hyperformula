# Testing standards

What a change must prove, and how a test case is written. These apply to every package in the repository.

Each package documents its own suites and commands: the engine's are in [`hyperformula/dev-docs/TESTING.md`](TESTING.md).

## What a change must cover

- Every change to `hyperformula/src/` needs tests in `hyperformula/test/`. This is part of the [definition of done](DEFINITION-OF-DONE.md), not a suggestion.
- **Bug fix**: at least one test that reproduces the bug — it must fail against the unfixed code. Write it first and watch it fail.
- **New feature**: a set of tests that describe the feature precisely enough to serve as its specification.
- Cover more than the happy path: boundary values, empty and invalid input, error results, and interaction with related features.
- `docs/` and the `script/` directories are not tested.

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
