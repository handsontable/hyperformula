import { FormulaBuilder } from "@hfe/core";
import { buildHyperFormula, evaluateFormula } from "@hfe-demo/shared";
import { requireEl } from "../shared/dom";
import { bindEditorSizingControls } from "../shared/editorSizing";

const host = requireEl("editor-host");
const tokensEl = requireEl("tokens");
const stateEl = requireEl("state");
const resultEl = requireEl("result");
const exampleBtn = requireEl("set-example");
const clearBtn = requireEl("clear");

const applyEditorWidthCap = () => {
  const hostStyle = getComputedStyle(host);
  const paddingHorizontal =
    (Number.parseFloat(hostStyle.paddingLeft) || 0) +
    (Number.parseFloat(hostStyle.paddingRight) || 0);

  host.style.setProperty("--hfe-editor-max-width", `${host.clientWidth - paddingHorizontal}px`);
};

applyEditorWidthCap();
window.addEventListener("resize", applyEditorWidthCap);

const engine = buildHyperFormula();
const builder = new FormulaBuilder({ rootEl: host, hyperformula: engine });
const editor = builder.editor;

const onChange = (text: string) => {
  resultEl.textContent = evaluateFormula(engine, text) || "—";
};

editor.on("change", ({ state }) => {
  tokensEl.textContent = JSON.stringify(state.tokens, null, 2);
  stateEl.textContent = JSON.stringify({ text: state.text, cursor: state.cursor }, null, 2);
  onChange(state.text);
});

builder.openEditor(host, "=SUM(A1:B5) + 2");
onChange(editor.getValue());
(window as unknown as { editor: typeof editor }).editor = editor;

exampleBtn.addEventListener("click", () => {
  editor.setValue('=IF(SUM(A1:B10) > 100, "big", AVERAGE(A1:H5))');
  editor.focus();
});
clearBtn.addEventListener("click", () => {
  editor.setValue("");
  editor.focus();
});

bindEditorSizingControls(host);
