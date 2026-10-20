import { describe, expect, it } from "vitest";
import { NullAdapter } from "../../src/adapter/nullAdapter";
import { FormulaBuilder } from "../../src/formulaBuilder";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import { PopupContext } from "../../src/ui/popup/popupContext";

const STYLE_SELECTOR = "style[data-hfe-styles]";

function styleTagCount(): number {
  return document.head.querySelectorAll(STYLE_SELECTOR).length;
}

function buildRoot(): HTMLElement {
  const rootEl = document.createElement("div");

  document.body.appendChild(rootEl);

  return rootEl;
}

describe("style auto-injection", () => {
  it("FormulaBuilder construction injects one style tag with hfe rules", () => {
    const rootEl = buildRoot();
    const builder = new FormulaBuilder({ rootEl });
    const styleTags = document.head.querySelectorAll(STYLE_SELECTOR);

    expect(styleTags.length).toBe(1);
    expect(styleTags[0]?.textContent).toContain(".hfe-");
    builder.destroy();
    rootEl.remove();
  });

  it("constructing twice does not duplicate the tag", () => {
    const rootEl = buildRoot();
    const first = new FormulaBuilder({ rootEl });
    const second = new FormulaBuilder({ rootEl });

    expect(styleTagCount()).toBe(1);
    first.destroy();
    second.destroy();
    rootEl.remove();
  });

  it("standalone FormulaEditor construction also injects", () => {
    const host = buildRoot();
    const popupCtx = new PopupContext();
    const editor = new FormulaEditor(host, { popupCtx, adapter: new NullAdapter() });

    expect(styleTagCount()).toBe(1);
    editor.destroy();
    popupCtx.destroy();
    host.remove();
  });

  it("destroying the last instance removes the tag", () => {
    const rootEl = buildRoot();
    const builder = new FormulaBuilder({ rootEl });

    expect(styleTagCount()).toBe(1);
    builder.destroy();
    expect(styleTagCount()).toBe(0);
    rootEl.remove();
  });

  it("keeps the tag while another instance is alive", () => {
    const rootEl = buildRoot();
    const first = new FormulaBuilder({ rootEl });
    const second = new FormulaBuilder({ rootEl });

    first.destroy();
    expect(styleTagCount()).toBe(1);
    second.destroy();
    expect(styleTagCount()).toBe(0);
    rootEl.remove();
  });

  it("double destroy cannot strip styles from surviving instances", () => {
    const rootEl = buildRoot();
    const first = new FormulaBuilder({ rootEl });
    const second = new FormulaBuilder({ rootEl });

    first.destroy();
    first.destroy();
    expect(styleTagCount()).toBe(1);
    second.destroy();
    expect(styleTagCount()).toBe(0);
    rootEl.remove();
  });

  it("re-injects after full teardown", () => {
    const rootEl = buildRoot();
    const first = new FormulaBuilder({ rootEl });

    first.destroy();
    expect(styleTagCount()).toBe(0);

    const second = new FormulaBuilder({ rootEl });

    expect(styleTagCount()).toBe(1);
    second.destroy();
    rootEl.remove();
  });
});
