---
title: Migrating custom functions for INDIRECT
description: Add resumable methods to HyperFormula custom functions that receive built-in INDIRECT arguments.
tags:
  - migration
  - resumableMethod
---

# Migrating custom functions for INDIRECT

This guide covers custom functions in HyperFormula versions with built-in
`INDIRECT`. You need an existing function plugin to migrate. The built-in
`INDIRECT` can read a formula cell that has not finished calculating.
When a custom function receives an argument containing that built-in, its method
must be able to resume after the target finishes. Add a generator method and name
it with `resumableMethod`. Keep the existing method for ordinary calls.

For a function that uses `runFunction`, the existing method can remain:

```js
review(ast, state) {
  const entry = ++this.entries;
  return this.runFunction(ast.args, state, this.metadata('REVIEW'),
    value => value + entry);
}
```

Add the resumable method and metadata:

```js
*reviewResumable(ast, state) {
  const entry = ++this.entries;
  return yield* this.runFunctionResumable(ast.args, state,
    this.metadata('REVIEW'), value => value + entry);
}

ReviewPlugin.implementedFunctions.REVIEW.resumableMethod = 'reviewResumable';
```

`runFunctionResumable` evaluates each argument once, then applies the same
validation, coercion, and callback logic as `runFunction`. Work done before a
pending target read stays complete when the generator resumes.

If the method evaluates arguments itself, replace each call to `evaluateAst`
that may encounter `INDIRECT` with `yield* this.evaluateAstResumable(ast, state)`.
Before reading a lazy range's data, use
`yield* this.materializeRangeResumable(range)`. Keep intentional repeated
argument evaluations as separate generator calls.

For example:

```js
*manualResumable(ast, state) {
  const entry = ++this.entries;
  const range = yield* this.evaluateAstResumable(ast.args[0], state);
  yield* this.materializeRangeResumable(range);
  return range.data[0][0] + entry;
}
```

If a `runFunction` callback reads a lazy range, prepare the range in the
generator and use the prepared-argument helper:

```js
*callbackResumable(ast, state) {
  const range = yield* this.evaluateAstResumable(ast.args[0], state);
  yield* this.materializeRangeResumable(range);
  return this.runFunctionWithPreparedArguments(ast.args, [range], state,
    this.metadata('CALLBACK'), reference => reference.data[0][0]);
}
```

`runFunctionWithPreparedArguments` keeps `runFunction`'s argument-count checks,
range expansion, defaults, coercion, and callback behavior. Pass one prepared
value for each AST argument, in order. Calling `runFunction` after preparation
evaluates each argument again. For example, an address-generating function in
`CALLBACK(INDIRECT(ADDR()))` would run twice and could choose a different cell.

An unmigrated custom function called with a built-in `INDIRECT` argument
returns `#VALUE!` with a migration message before its legacy method runs.
This happens whether the target was already calculated or still pending.
Ordinary calls continue through the original method, and a custom override of
the name `INDIRECT` does not trigger this requirement. The public calculation
API remains synchronous.

## Error: "Function REVIEW requires a resumable method for INDIRECT arguments."

This `#VALUE!` message means `REVIEW` received a built-in `INDIRECT` argument
but has no `resumableMethod`. Add the generator method and metadata shown above.
The function name in the message matches the function being called.

## Error: "Resumable function REVIEW must yield pending value reads."

This `#VALUE!` message means the generator tried to read an unfinished target
without yielding. Use `evaluateAstResumable`, `materializeRangeResumable`, or
`runFunctionResumable` at the read point.

See [Custom functions](custom-functions.md#functions-with-indirect-arguments)
for the full helper and lazy-range guidance.
