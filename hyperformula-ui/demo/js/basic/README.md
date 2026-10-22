# basic — `hyperformula-ui` only, no grid

Demonstrates `FormulaBuilder` running without any grid adapter — the lowest
layer of the integration surface. Constructs the builder against a host
element and opens the editor imperatively via `openEditor`.

**Imports:** `hyperformula-ui` (`FormulaBuilder`) only — no adapter package.

**Construction** (`basic/main.ts`):

```ts
const builder = new FormulaBuilder({ rootEl: host, hyperformula: engine });
const editor = builder.editor;
...
builder.openEditor(host, "=SUM(A1:B5) + 2");
```

`FormulaEditor`/`FormulaBuilder` internals: [`dev-docs/ARCHITECTURE.md`](../../../dev-docs/ARCHITECTURE.md).
