---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing any test for HyperFormula, and whenever a test is red during feature work. Enforces that tests prove intended behaviour rather than merely execute code, and never go "green for the sake of green".
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour) | The rule, the banned ways of going green, and what a hollow assertion looks like. It is short — read it now, before touching the test. |

## 2. Write the test from the requirement

Before reading the implementation. A test written from the code passes for any implementation, including the wrong one.

## 3. Run it and watch it fail

For a bug fix this is not optional: a test that has never failed proves nothing about the bug.

## 4. Fix the code, not the test

When a test is red the default assumption is that the code is wrong. Changing the expectation requires a one-sentence reason about the *specification*, not about the effort of fixing the code.

## 5. Run it again and read the output

Never claim a test passes because the reasoning is sound. And before treating green as coverage, confirm `test/hyperformula-tests/` is present — `npm run test:setup-private`.

## If you cannot make it pass honestly

Say so. "This test fails and I do not yet know why" is a useful report; a green run that hides it is not.
