---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing any test for HyperFormula, and whenever a test is red during feature work. Enforces that tests prove intended behaviour rather than merely execute code, and never go "green for the sake of green".
---

The rule, the banned ways of going green, and what a hollow assertion looks like are in [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour). Read that section now — it is short.

## Apply it in this order

1. **Write the test from the requirement**, before reading the implementation. A test written from the code passes for any implementation, including the wrong one.
2. **Run it and watch it fail.** For a bug fix this is not optional: a test that has never failed proves nothing about the bug.
3. **Fix the code**, not the test. When a test is red the default assumption is that the code is wrong. Changing the expectation requires a one-sentence reason about the *specification*.
4. **Run it again and read the output.** Never claim a test passes because the reasoning is sound.

## Before treating green as coverage

If `test/hyperformula-tests/` is missing, `npm run test:jest` runs only the smoke tests and reports a clean pass over almost nothing. Confirm it is there — `npm run test:setup-private`.

## If you cannot make it pass honestly

Say so. "This test fails and I do not yet know why" is a useful report; a green run that hides it is not.
