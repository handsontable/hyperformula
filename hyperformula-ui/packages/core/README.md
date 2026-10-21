# hyperformula-ui

A formula editor for [HyperFormula](https://hyperformula.handsontable.com/) that plugs into any grid. It adds syntax and reference highlighting, function autocomplete and help, range picking, and an optional formula bar on top of a plain `<textarea>`.

It has no UI framework dependency. A grid connects to it through the `IGridAdapter` interface; without a grid, the editor runs on its own.

## Install

```bash
npm install hyperformula-ui hyperformula
```

`hyperformula` is an optional peer dependency: any 3.x version. Without it, the editor still edits and highlights formulas, but function autocomplete, function help and named-expression highlighting are off. Versions before 3.4.0 lack `getAvailableFunctions` and `getFunctionDetails`, so autocomplete lists function names without descriptions.

## Use

```ts
import { HyperFormula } from "hyperformula";
import { FormulaBuilder } from "hyperformula-ui";

const hyperformula = HyperFormula.buildEmpty({ licenseKey: "gpl-v3" });
hyperformula.addSheet("Sheet1");

const host = document.getElementById("editor-host")!;
const builder = new FormulaBuilder({ rootEl: host, hyperformula });

builder.editor.on("change", ({ state }) => console.log(state.text));
builder.openEditor(host, "=SUM(A1:B5)");
```

Styles are injected automatically on first use; there is no CSS file to import.

The public API is listed in [`DOCS.md`](DOCS.md).

## License

GPL-3.0-only. See [`LICENSE.txt`](https://github.com/handsontable/hyperformula/blob/master/LICENSE.txt).
