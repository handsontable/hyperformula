---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing any test for HyperFormula, and whenever a test is red during feature work. Enforces that tests prove intended behaviour rather than merely execute code, and never go "green for the sake of green".
---

## The rule

A test exists to prove that the code does what it is supposed to do. A test that passes without proving anything is worse than no test: it occupies the space where the real test would have gone, and it makes the next person believe the behaviour is covered.

## Intent first

Write the test from the requirement, not from the implementation. For a bug fix that means:

1. Write the test that describes the correct behaviour.
2. **Run it. Watch it fail.** A bug-fix test that has never failed proves nothing about the bug.
3. Fix the code.
4. Run it again.

Reading the implementation first and then writing a test that mirrors it produces a test that passes for any implementation, including the wrong one.

## When a test is red, the code is wrong

That is the default assumption. Change the test only when you can state, in one sentence, why the test's expectation was wrong — and that sentence must be about the specification, not about the effort of fixing the code.

## Banned ways of going green

- Relaxing an assertion: exact value to `toBeCloseTo`, specific error to "some error", `toEqual` to `toContain`.
- Deleting the assertion that fails and keeping the ones that pass.
- Adding `.skip`, `.todo`, or a comment-out to a case that used to run.
- Widening a matcher until every implementation passes.
- Catching the error the code should not be throwing and asserting that it was caught.
- Mocking the unit under test, or mocking so deeply that only the mock is exercised.
- Asserting that a function "does not throw" when the requirement is a specific returned value.
- Changing the input until the current implementation happens to be right.

If you find yourself doing any of these, stop and say so instead. "This test fails and I do not yet know why" is a useful report; a green run that hides it is not.

## Hollow assertions

These execute code and prove nothing:

```ts
expect(engine.getCellValue(adr('A1'))).toBeDefined()      // any value passes
expect(() => engine.setCellContents(...)).not.toThrow()   // any non-throwing bug passes
expect(result).toBeTruthy()                                // 1, 'x', and [] all pass
```

Assert the value the specification names.

## Verify with a real run

Never claim a test passes without having run it. Never claim a fix works because the reasoning is sound. Run the command, read the output, and quote the decisive line.

```bash
npm run test:jest -- <pattern>
```

If the private suite is missing, `npm run test:jest` runs only the smoke tests and reports a clean pass over almost nothing. Confirm `test/hyperformula-tests/` exists before treating a green run as coverage — `npm run test:setup-private`.
