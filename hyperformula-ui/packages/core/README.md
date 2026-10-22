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

## Reference colors

Each reference in a formula takes one of eight colors, in the editor text and in the grid highlight. The colors are the custom properties `--hfe-ref-1` to `--hfe-ref-8`, and each default clears a 4.5:1 contrast ratio on the editor's light and dark backgrounds. While the caret is inside a nested function call, the enclosing calls are dimmed by `--hfe-dim-opacity` (default `0.6`), which lowers the contrast of their references to about 2.3:1; set it to `1` to turn the dimming off. To replace them, set the properties on the class you pass as `className`, which the builder adds to the editor, the formula bar, the popups and the adapter's highlight overlays:

```css
.my-theme {
  --hfe-ref-1: #0057b8;
}
```

The defaults are declared on `:root` in a stylesheet injected after yours, so an override declared on `:root` itself needs a more specific selector, such as `html:root`.

The public API is listed in [`DOCS.md`](DOCS.md).

## License

MIT. See [`LICENSE.txt`](LICENSE.txt).
