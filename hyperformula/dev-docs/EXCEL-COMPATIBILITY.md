# Excel compatibility

What engine results must be, and how to check them against Excel and Google Sheets. The test cases each kind of change needs are listed in [`TESTING.md`](TESTING.md#what-each-kind-of-change-needs); this page says what their results must be. A deliberate deviation from Excel is recorded as [Describing behaviour](../../dev-docs/DOC-STANDARDS.md#describing-behaviour) says.

## Verifying expected values

- Verify every expected value in real Excel, and in Google Sheets where relevant: in Excel Online, or with a script that evaluates the formulas through the Microsoft Graph API. Never take an expected value from an AI.
- List the formulas you checked in the pull request's [compatibility section](../../.github/pull_request_template.md#compatibility-with-excel-and-google-sheets).

## Arguments

Handle every kind of argument the way Excel does:

- numbers, strings and booleans — depending on the function, `TRUE()` and `FALSE()` count as 1 and 0 or are ignored;
- an empty cell, an empty argument and a missing argument (`=F(A1,,2)` vs `=F(A1)`);
- error values passed as arguments, and the order in which they propagate;
- ranges, scalars and inline arrays (`{1,2;3,4}`);
- references to other sheets, and named expressions;
- whole-column and whole-row ranges (`A:A`, `1:1`).

## Errors

- Return the error type Excel returns: `#VALUE!`, `#NUM!`, `#N/A`, `#DIV/0!`, `#SPILL!` and the rest.
- The error message is accurate for this case, not copied from a similar branch. How a function returns an error is in [`INTERPRETER.md`](INTERPRETER.md#rules).
- The error helps the user find what to fix in their data: which cell, or which function. An origin the engine cannot know is reported as unknown, not guessed.

## Arrays

- Check the result with [array arithmetic mode](../../docs/guide/arrays.md#array-arithmetic-mode) on and off, the spilled result, and `#SPILL!` when the cells the result needs are taken.
- Check the predicted result size against the actual one, nested array functions, and a formula placed somewhere other than A1.
- An array function in a scalar context — `=F()+0`, `ABS(F())`, a formula filled down — behaves like its sibling functions do (implicit intersection).

## Consistency

- A formula returns the same result in a cell and through `calculateFormula()`.
- The result does not depend on caching, on the order of interchangeable arguments, or on splitting a range into several arguments: `=SUM(A1:A4)`, `=SUM(A3:A4,A1:A2)`.
- Related functions return the same result for the same data, for example `VAR.S` and `DVAR`, or `STDEV.S` and `DSTDEV`.

## Numeric precision

- Check numeric and statistical results against exact or reference maths as well. Excel is not always the best oracle: where HyperFormula can be more accurate, it is, and the difference is recorded like any other deliberate deviation.
- Watch for floating-point accumulation, overflow and underflow, and cancellation in variance-like computations.

## Configuration

Check the change with the non-default options that affect it:

- non-English function names, since parsing is [language-dependent](ARCHITECTURE.md#invariants); non-default separators; and locale-dependent formats;
- `precisionRounding`, `useArrayArithmetic`, `nullDate`, `leapYear1900`, and the `stringifyDateTime`, `stringifyDuration` and `stringifyCurrency` callbacks.
