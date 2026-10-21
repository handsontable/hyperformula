import { requireEl } from "./dom";

export function bindEditorSizingControls(target: HTMLElement): void {
  const minLinesEl = requireEl<HTMLInputElement>("opt-min-lines");
  const maxLinesEl = requireEl<HTMLInputElement>("opt-max-lines");
  const resizeEl = requireEl<HTMLSelectElement>("opt-resize");

  const setVar = (name: string, value: string): void => {
    if (value === "") {
      target.style.removeProperty(name);
    } else {
      target.style.setProperty(name, value);
    }
  };

  const applyVar = (name: string, value: string): void => {
    setVar(name, value);
    window.dispatchEvent(new Event("resize"));
  };

  setVar("--hfe-editor-min-lines", minLinesEl.value);
  setVar("--hfe-editor-max-lines", maxLinesEl.value);
  setVar("--hfe-editor-resize", resizeEl.value);
  window.dispatchEvent(new Event("resize"));

  minLinesEl.addEventListener("input", () => applyVar("--hfe-editor-min-lines", minLinesEl.value));
  maxLinesEl.addEventListener("input", () => applyVar("--hfe-editor-max-lines", maxLinesEl.value));
  resizeEl.addEventListener("change", () => applyVar("--hfe-editor-resize", resizeEl.value));
}
