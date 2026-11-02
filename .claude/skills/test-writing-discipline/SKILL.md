---
name: test-writing-discipline
description: Use when writing, fixing, or reviewing any test for HyperFormula, and whenever a test is red during feature work. Enforces that tests prove intended behaviour rather than merely execute code, and never go "green for the sake of green".
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`TESTING.md`](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour) | The rule, the banned ways of going green, and what a hollow assertion looks like. It is short — read it now, before touching the test. |
| [`TESTING.md`](../../../hyperformula/dev-docs/TESTING.md#fetching-the-private-suite) | Why a green run can cover almost nothing |

## 2. Work through them in order

1. Write the test as [A test must prove behaviour](../../../dev-docs/TESTING.md#a-test-must-prove-behaviour) requires, and for a bug fix watch it fail first — [What a change must cover](../../../dev-docs/TESTING.md#what-a-change-must-cover).
2. While it is red, follow the same section — and none of the [banned ways of going green](../../../dev-docs/TESTING.md#banned-ways-of-going-green).
3. Run it again, read the output, and confirm the private suite is attached before treating green as coverage — [Fetching the private suite](../../../hyperformula/dev-docs/TESTING.md#fetching-the-private-suite).
