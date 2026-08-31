---
name: hyperformula-code-review
description: Use when reviewing a diff, a branch, or a pull request in the HyperFormula repository. Covers correctness for a calculation engine, performance on the hot paths, the five places a function change must touch, API stability, and what the definition of done requires.
---

Review in this order. Stop at the first category that finds something serious and report it — do not bury a correctness bug under style notes.

## 1. Correctness

- **Does the test actually fail without the fix?** Ask it of every bug-fix PR. A test added alongside a fix, written from the implementation, proves nothing.
- **Errors returned, never thrown.** Any `throw` reachable from formula evaluation takes down the whole recalculation. It must be a `CellError` with a message from `src/error-message.ts`.
- **Coercion through `ArithmeticHelper`.** Hand-rolled string-to-number or value-to-boolean conversion inside a function is a bug waiting for a locale or an empty cell.
- **Empty cells and empty ranges.** The most common gap in a function change. So are error arguments — an error must propagate, not be coerced.
- **Round-tripping.** A parser change without a matching `Unparser` change means `getCellFormula` returns something the user never typed.
- **Structural changes.** Adding or removing rows or columns must leave the address mapping, range mapping, and array mapping consistent. Assert the formula **text** afterwards, not just the value.
- **Undo.** A new mutation needs `CrudOperations` (validate), `Operations` (mutate), and `UndoRedo` (record). Missing the third diverges silently.

## 2. The five places a function change must touch

Check all five; the failures are silent:

1. the plugin implementation;
2. `implementedFunctions` metadata;
3. the catalogue entry in `src/interpreter/functionMetadata/categories/` — **parameter count must match**, or authored names and descriptions are discarded at run time with only a console warning;
4. **every** file in `src/i18n/languages/`;
5. tests.

Also: a function that can return an array needs `sizeOfResultArrayMethod`. A function with a zero-argument or omitted-argument form needs an explicit `optionalArg: true` — nothing cross-checks optionality.

## 3. Performance

The engine's performance is a feature. Flag:

- allocation inside a per-cell or per-vertex loop;
- work that could be hoisted out of the broadcast path;
- a range expanded into per-cell edges or per-cell iteration where the range vertex would do;
- anything that widens what a change invalidates, forcing a larger recalculation;
- a change to `ParserWithCaching` that makes the parse result depend on something outside the cache key.

Ask for `npm run test:performance` on changes to evaluation or CRUD hot paths.

## 4. Public API

`src/HyperFormula.ts` and the types it exports are the contract.

- A signature, return-type, or behaviour change is breaking. It needs a migration-guide section and an explicit note in the PR.
- JSDoc here is published output. Review it as documentation, not as a comment.
- A new config option needs a default, validation, and a guide entry.

## 5. Definition of done

Production change, tests, documentation, JSDoc, changelog entry, current PR description. See [`dev-docs/DEFINITION-OF-DONE.md`](../../../dev-docs/DEFINITION-OF-DONE.md).

One pull request, one atomic change. Unrelated refactors and reformatting belong in a separate PR — say so rather than approving them through.

## 6. Style

Last, and briefly. ESLint owns formatting. Comment only on what it cannot check: a name that misleads, a function doing two things, duplicated logic that an existing helper already covers, a clever one-liner where an obvious three lines would read better.

## Reporting

One line per finding: what is wrong, where, and what to do instead. No praise, no summary of what the PR does — the author knows. Separate "this is a bug" from "I would have done this differently", and do not present the second as the first.
