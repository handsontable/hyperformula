# Code style

These conventions apply to `hyperformula-ui/` only. The engine and the rest of the repository follow [`dev-docs/CODE-STYLE.md`](../../dev-docs/CODE-STYLE.md); where the two differ, the directory a file lives in decides.

The main differences from the engine: Biome instead of ESLint, no inline comments, and the `hfe-` prefix on every CSS class and variable.

## What Biome enforces

Biome is the single formatter and linter: no ESLint, no Prettier. The rule set lives in [`biome.json`](../biome.json); treat that file as the source of truth. Biome is pinned to one exact version in every package, so a release with new rules cannot turn the build red on its own.

Do not hand-format. Run the fixer before committing:

```bash
npm run lint:fix
```

Three rules are warn-level and need case-by-case judgment, never silencing:

- `style/noNonNullAssertion`: `x!` is flagged. See [Non-null assertions](#non-null-assertions).
- `suspicious/noExplicitAny`: use a real type or an `unknown` cast.
- `suspicious/noConsole`: only `console.warn` and `console.error` are allowed.

Filenames start lowercase: source files are camelCase (`formulaEditor.ts`), test files kebab-case (`fn-help.test.ts`). Biome's `useFilenamingConvention` enforces it.

## What Biome cannot enforce

### Comments

Default: no comments. Inline `//` and explanatory `/* */` are not allowed.

The exceptions:

- JSDoc on the public API surface, the symbols re-exported from `packages/core/src/index.ts`, written on the defining declaration. Concise TSDoc: a one-line summary, `@param`/`@returns` only when the name and type do not already say it, contracts rather than implementation, no task or pull request numbers. Standard TSDoc tags only (`@param`, `@returns`, `@remarks`, `@example`, `@defaultValue`, `@category`, `{@link}`). `@category` goes on every top-level public symbol, `@example` on primary entry points. `DOCS.md` is generated from these comments and fails on an undocumented export.
- `biome-ignore` directives.
- The `@generated` banner of `cssText.ts`, written by its generator.

The canonical statement of this rule, with the other critical invariants, is in [`ARCHITECTURE.md`](ARCHITECTURE.md#key-invariants).

### CSS names

Every CSS class and custom property carries the `hfe-` prefix: `.hfe-editor`, `.hfe-formula-bar__address-input`, `--hfe-color-accent`. Classes follow BEM, and every class name string lives in `packages/core/src/theme/classNames.ts`. Integrations select on these names, so renaming one is a breaking change.

### Naming

Descriptive over short. Name after meaning, not type.

- `oldText`, not `oldStr`.
- `startRow`/`endRow`/`startCol`/`endCol`, not `r0`/`r1`/`c0`/`c1`, even in tight scopes.
- `token`, not `t`, in any scope longer than five lines and for class fields.
- Event handler parameters: `event`, or the specific subtype. `e` is acceptable in handlers of three lines or fewer.

Not allowed anywhere: `a`, `b`, `c`, `d`, `ed`, `tmp`, `tmp2`, `foo`, `bar`, `cb`, `fn`, and single-letter class fields.

Allowed: `i`, `j`, `k` for loop counters; `x`, `y` for coordinate pairs; `r`, `c` for row and column only when paired and inside a scope of five lines or fewer.

### Blank lines

Biome has no rule for these; reviewers enforce them.

- One blank line between class methods.
- One blank line after the closing brace of an inner `if`/`for`/`while`/`try` block, before the next non-trivial statement.
- One blank line before `return` or `continue`, unless it is the first statement of its block.
- One blank line between a block of variable declarations and the next `if`/`for`/`while`/`switch`.
- No blank lines inside blocks of three lines or fewer.
- At most one consecutive blank line.

```ts
function lookup(items: Item[], offset: number): Item | null {
  const candidate = items[offset - 1];

  if (!candidate) {
    return null;
  }

  return candidate;
}
```

### Class member order

1. Fields, including arrow-function fields.
2. `constructor`.
3. Private methods, getters and setters.
4. Public methods, getters and setters.

The helpers a class is built from read first; the surface it exposes reads last. Keep the relative order within each group.

### Methods and arrow-function fields

Class behaviour lives in regular methods. An arrow-function field is allowed for one purpose only: a callback passed by reference to a registry that needs a stable identity and a bound `this` (`EventScope.listen`, a paired `addEventListener`/`removeEventListener`, a host's `addHook`/`removeHook`). If a member is only ever called as `this.x()`, it is a regular method.

Such a field is a thin delegate: one expression, with the logic in a private `handle*` method.

```ts
private onMouseDown = (event: MouseEvent): void => this.handleDown(event);

private handleDown(event: MouseEvent): void {
  // the actual work
}
```

A body with no control flow, such as an empty handler or a `preventDefault`/`stopPropagation` pair, may stay inline.

### Imports

- `import type { Foo }` for type-only imports. Biome fixes this through `useImportType`.
- Biome's import organizer orders the groups: Node built-ins, external packages, workspace packages, relative imports.
- Relative imports are extensionless, and a directory resolves to its barrel: `./formulaBar`, not `./formulaBar/index.js`. This relies on `moduleResolution: "bundler"` and on rspack, Vite and vitest bundling.
- Inside a package, import the defining module, not a directory barrel: `./adapter/nullAdapter`, not `./adapter`. Barrels exist for the public surface and for other packages. The one exception is the core's tests importing the shared `tests/helpers` barrel.
- One import statement per module. Merge value and type imports with inline `type` specifiers: `import { type A, B } from "x";`.

### Non-null assertions

`x!` is not allowed. Instead:

- DOM lookups: a helper that throws when the element is missing (`requireEl(id)`).
- Test fixtures: an explicit guard, `if (!item) throw new Error("expected ...");`.
- Loops whose bounds guarantee a value: `for (const [index, item] of items.entries())`, or an `if (!item) continue;` guard.

### TypeScript

The shared `tsconfig.base.json` turns on `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride`:

- Indexed access returns `T | undefined`; destructure or guard before use.
- Optional properties are written `?: T`, not `: T | undefined`.
- Overrides need the `override` keyword.

### Strings and numbers

- Template literals, never string concatenation.
- No HTML strings in the DOM: never `innerHTML`, `outerHTML` or `insertAdjacentHTML`. Hosts may run under a Trusted Types policy, which rejects them. Build elements with `createEl`, and icons with `createIcon`, which takes a host's `icons` factory or the built-in data in `ui/icons.ts`.
- No magic numbers: geometry, retry counts, timeouts and intervals become named module-level constants.

## Type naming and placement

| Rule | Meaning |
|---|---|
| `XxxOptions` | Any consumer- or constructor-supplied argument bag. Never `*Config`. |
| `XxxLike` | Minimal structural stand-in for an external library's type. |
| `XxxListener` / `XxxResolver` | A single callback type. |
| `XxxHandlers` | A bag of several callbacks. |
| `XxxEventMap` | Event name to payload record (`FormulaEditorEvents` is an older public alias). |
| `XxxDeps` | A controller's dependency record. |
| No `I` prefix | Except `IGridAdapter`, an established contract name. |
| No abbreviations | `CursorPosition`, not `CursorPos`. |

Types shared by two or more modules, on a package's public API, or referenced by such a type, live in their directory's `types.ts`. Single-consumer types stay in their module. A barrel re-exports only the public subset of `types.ts`.

## When in doubt

Read three nearby files for the local pattern. If it conflicts with this page, this page wins; say so in the pull request so a reviewer can decide.
