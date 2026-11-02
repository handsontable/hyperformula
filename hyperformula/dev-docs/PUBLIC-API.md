# Public API

Rules for anything added to or changed in `hyperformula/src/HyperFormula.ts` and the types exported from `hyperformula/src/index.ts`. Every addition, removal, rename or change to the public API is intended, and it is listed in the pull request's [Public API changes](../../.github/pull_request_template.md#public-api-changes) section. What counts as a breaking change is in [Breaking changes](../../dev-docs/DEFINITION-OF-DONE.md#breaking-changes).

## Naming

New option, method and parameter names follow [Style](../../dev-docs/CODE-STYLE.md#style). A public name is also free of jargon and spelled out in full: `maxPendingLazyTransformations`, not an acronym. Names are consistent with the analogous feature in Excel or Google Sheets, and with the existing HyperFormula API.

## Types

- Optional fields are optional and required fields are required, so the type enforces what the docs promise. Public signatures spell out `T | undefined` instead of the internal `Maybe<>` alias.
- Vendored and internal types don't leak into the published typings or the generated API reference.
- Anything that should be `@internal` is marked so: debug-only options, emitters, mutation hooks, and static helpers that can overwrite internal state.

## Input and output

- Getters return copies, not references to module-level singletons or internal state.
- Input is validated first, so every path fails the same way and matches the `@throws` in the JSDoc.
- Hardening — validation, prototype safety, copying — is applied on every path that produces the same public type.
- Hostile input is handled: prototype pollution (`__proto__` as a sheet name or a named expression), huge ranges, very long strings.

## Behaviour

- The API describes what the engine actually does. For example, `getAvailableFunctions` omits a function that evaluates to `#NAME?` (see [`I18N.md`](I18N.md)), and it uses the instance's own translation package.
- Correctness does not depend on module-initialisation side effects or on import order.

## Configuration options

Ask first: should this magic number be an option, or at least lowerable in tests? Is a new public option overkill? A new public option is also a [product decision](../../dev-docs/DEFINITION-OF-DONE.md#one-pull-request-one-change).

A new option has a sensible default, documented with an `@default` tag. Everything else it needs, validation and a guide entry included, is listed in [`ARCHITECTURE.md`](ARCHITECTURE.md#everything-else-in-hyperformulasrc).

## Batching and undo

- A new method behaves correctly inside a batch and while evaluation is suspended; a method that reads computed values calls `ensureEvaluationIsNotSuspended()`.
- Undo and redo stay consistent: `isThereSomethingToUndo`, `isThereSomethingToRedo` and the `isItPossibleTo*` methods return `false` whenever the real call would throw.

## Compatibility

- A changed method signature stays backward compatible: it accepts both the old and the new argument shape.
- Forward compatibility: unknown tokens, fields and options are ignored, and one unrecognised input cannot silently disable unrelated behaviour.
