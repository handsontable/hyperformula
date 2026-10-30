import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";

class GoneGridAdapter extends NullAdapter {
  gone = false;

  override setHighlights(): void {
    if (this.gone) {
      throw new Error("grid already destroyed");
    }
  }
}

describe("FormulaEditor.destroy", () => {
  it("finishes every teardown step when the adapter throws, then rethrows the error", () => {
    const host = document.createElement("div");
    const popupCtx = new PopupContext();
    const adapter = new GoneGridAdapter();
    const editor = new FormulaEditor(host, { popupCtx, adapter });

    document.body.appendChild(host);
    adapter.gone = true;

    expect(() => editor.destroy()).toThrow("grid already destroyed");
    expect(host.querySelector("textarea")).toBeNull();
    expect(document.head.querySelector("style[data-hfe-styles]")).toBeNull();

    popupCtx.destroy();
    host.remove();
  });
});
