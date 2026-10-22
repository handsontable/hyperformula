import { describe, expect, it, vi } from "vitest";
import { CN } from "../../src/theme/classNames";
import type { PopupContext } from "../../src/ui/popup/popupContext";
import {
  createEditorHarness,
  formatRefAsRC,
  keyUp,
  press,
  requireEditorRoot,
  requireTextarea,
  sel,
  TestGridAdapter,
  typeInto,
} from "../helpers";

const FAKE_LANGUAGE = "fnHelpFocusLang";

const VISIBLE_INPUT_RECT = {
  x: 10,
  y: 10,
  left: 10,
  top: 10,
  right: 130,
  bottom: 30,
  width: 120,
  height: 20,
};

const FUNCTION_DETAILS: Record<string, unknown> = {
  SUM: {
    shortDescription: "Adds numbers.",
    documentationUrl: "https://example.com/sum",
    examples: ["=SUM(1,2)"],
    parameters: [
      { name: "value1", description: "First value.", optional: false },
      { name: "value2", description: "More values.", optional: true },
    ],
    repeatLastArgs: 1,
  },
  COUNT: {
    shortDescription: "Counts numbers.",
    documentationUrl: "",
    examples: ["=COUNT(1,2)"],
    parameters: [{ name: "value1", description: "First value.", optional: false }],
    repeatLastArgs: 1,
  },
};

class FnHelpFocusHyperFormula {
  getAvailableFunctions(): unknown {
    return [
      { localizedName: "SUM", canonicalName: "SUM", shortDescription: "Adds numbers." },
      { localizedName: "COUNT", canonicalName: "COUNT", shortDescription: "Counts numbers." },
    ];
  }

  getFunctionDetails(canonicalName: string): unknown {
    return FUNCTION_DETAILS[canonicalName];
  }

  listNamedExpressions(): string[] {
    return [];
  }

  getNamedExpressionFormula(): string {
    return "";
  }

  simpleCellRangeFromString(): unknown {
    return undefined;
  }

  simpleCellAddressFromString(): unknown {
    return undefined;
  }

  getSheetName(): string {
    return "";
  }
}

function createFnHelpHarness(showClose = true) {
  const harness = createEditorHarness({
    hyperformula: new FnHelpFocusHyperFormula() as never,
    language: FAKE_LANGUAGE,
    sheetId: 0,
    fnHelpOptions: { showClose },
  });
  const textarea = requireTextarea(harness.host);
  const root = requireEditorRoot(harness.host);

  root.getBoundingClientRect = () => ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(harness.host);

  return { ...harness, textarea };
}

function fnHelpRoot(popupCtx: PopupContext): HTMLElement {
  const root = popupCtx.portal.querySelector<HTMLElement>(sel(CN.fnHelp));

  if (!root) {
    throw new Error("expected the fn-help popup root in the portal");
  }

  return root;
}

function popupKeydown(target: Element, key: string): void {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

describe("fn-help F6 focus scope", () => {
  it("moves focus into the popup on F6 and keeps the popup open", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);
    const body = popup.querySelector<HTMLElement>(sel(CN.fnHelpBody));

    expect(popup.hidden).toBe(false);
    expect(document.activeElement).toBe(body);
    expect(textarea.getAttribute("aria-describedby")).toBe(popup.id);

    destroy();
    host.remove();
  });

  it("returns focus to the textarea on F6 inside the popup", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);

    popupKeydown(document.activeElement ?? popup, "F6");

    expect(document.activeElement).toBe(textarea);
    expect(popup.hidden).toBe(false);

    destroy();
    host.remove();
  });

  it("closes the popup and returns focus to the textarea on Escape inside the popup", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);

    popupKeydown(document.activeElement ?? popup, "Escape");

    expect(document.activeElement).toBe(textarea);
    expect(popup.hidden).toBe(true);

    destroy();
    host.remove();
  });

  it("keeps the editor focused state while the popup holds focus", () => {
    const { host, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    expect(requireEditorRoot(host).classList.contains(CN.editorFocused)).toBe(true);

    destroy();
    host.remove();
  });

  it("moves focus into the scrollable body on F6 when the popup has no interactive elements", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness(false);

    typeInto(host, "=COUNT(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);
    const body = popup.querySelector<HTMLElement>(sel(CN.fnHelpBody));

    expect(popup.hidden).toBe(false);
    expect(document.activeElement).toBe(body);

    destroy();
    host.remove();
  });

  it("ignores F6 while the fn-help popup is hidden", () => {
    const { host, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=1+1");
    textarea.focus();
    const event = new KeyboardEvent("keydown", { key: "F6", bubbles: true, cancelable: true });

    textarea.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(textarea);

    destroy();
    host.remove();
  });

  it("closes the popup and blurs the editor when focus leaves the popup for outside", () => {
    const { host, popupCtx, textarea, editor, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);
    const outside = document.createElement("button");

    document.body.appendChild(outside);
    outside.focus();

    expect(popup.hidden).toBe(true);
    expect(editor.isFocused()).toBe(false);
    expect(requireEditorRoot(host).classList.contains(CN.editorFocused)).toBe(false);

    outside.remove();
    destroy();
    host.remove();
  });

  it("cancels a clean bar-hosted edit when focus leaves the popup for outside", () => {
    const onCancel = vi.fn();
    const harness = createEditorHarness({
      onCancel,
      hyperformula: new FnHelpFocusHyperFormula() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
    });
    const textarea = requireTextarea(harness.host);
    const root = requireEditorRoot(harness.host);

    root.getBoundingClientRect = () => ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(harness.host);
    harness.editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "bar",
      isDirty: () => false,
      focusHost: () => {},
    });
    typeInto(harness.host, "=SUM(1");
    textarea.focus();
    press(harness.host, "F6");

    const outside = document.createElement("button");

    document.body.appendChild(outside);
    outside.focus();

    expect(onCancel).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(outside);

    outside.remove();
    harness.destroy();
    harness.host.remove();
  });

  it("keeps a dirty bar-hosted edit open when focus leaves the popup for outside", () => {
    const onCancel = vi.fn();
    const harness = createEditorHarness({
      onCancel,
      hyperformula: new FnHelpFocusHyperFormula() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
    });
    const textarea = requireTextarea(harness.host);
    const root = requireEditorRoot(harness.host);

    root.getBoundingClientRect = () => ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(harness.host);
    harness.editor.setHostToggleDelegate({
      isAvailable: () => true,
      currentHost: () => "bar",
      isDirty: () => true,
      focusHost: () => {},
    });
    typeInto(harness.host, "=SUM(1");
    textarea.focus();
    press(harness.host, "F6");

    const outside = document.createElement("button");

    document.body.appendChild(outside);
    outside.focus();

    expect(onCancel).not.toHaveBeenCalled();

    outside.remove();
    harness.destroy();
    harness.host.remove();
  });

  it("keeps the editor focused when focus returns from the popup to the textarea", () => {
    const { host, popupCtx, textarea, editor, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);

    textarea.focus();

    expect(popup.hidden).toBe(false);
    expect(editor.isFocused()).toBe(true);

    destroy();
    host.remove();
  });

  it("keeps the popup open when a reparent fires a transient blur", () => {
    const { host, popupCtx, textarea, editor, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();

    const popup = fnHelpRoot(popupCtx);
    const nextMount = document.createElement("div");
    const originalAppendChild = nextMount.appendChild.bind(nextMount);

    document.body.appendChild(nextMount);
    let hiddenAfterBlur = false;

    nextMount.appendChild = <NodeType extends Node>(node: NodeType): NodeType => {
      const appended = originalAppendChild(node);

      textarea.dispatchEvent(new FocusEvent("blur", { relatedTarget: null }));
      hiddenAfterBlur = Boolean(popup.hidden);

      return appended as NodeType;
    };
    editor.attachTo(nextMount);

    expect(hiddenAfterBlur).toBe(false);
    expect(popup.hidden).toBe(false);
    expect(editor.isFocused()).toBe(true);

    nextMount.remove();
    destroy();
    host.remove();
  });

  it("moves focus into the popup on Shift+F6 while the popup is open", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "F6", shiftKey: true, bubbles: true, cancelable: true }),
    );

    const popup = fnHelpRoot(popupCtx);
    const body = popup.querySelector<HTMLElement>(sel(CN.fnHelpBody));

    expect(popup.hidden).toBe(false);
    expect(document.activeElement).toBe(body);

    destroy();
    host.remove();
  });

  it("returns focus to the textarea on Shift+F6 inside the popup", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();
    press(host, "F6");

    const popup = fnHelpRoot(popupCtx);

    (document.activeElement ?? popup).dispatchEvent(
      new KeyboardEvent("keydown", { key: "F6", shiftKey: true, bubbles: true, cancelable: true }),
    );

    expect(document.activeElement).toBe(textarea);
    expect(popup.hidden).toBe(false);

    destroy();
    host.remove();
  });

  it("closes the popup on Escape in the textarea without canceling the edit", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();

    expect(fnHelpRoot(popupCtx).hidden).toBe(false);

    press(host, "Escape");

    expect(fnHelpRoot(popupCtx).hidden).toBe(true);
    expect(document.activeElement).toBe(textarea);
    expect(textarea.value).toBe("=SUM(1");

    destroy();
    host.remove();
  });

  it("keeps the fn-help popup suppressed after Escape while the caret stays in the same call", () => {
    const { host, popupCtx, textarea, destroy } = createFnHelpHarness();

    typeInto(host, "=SUM(1");
    textarea.focus();

    expect(fnHelpRoot(popupCtx).hidden).toBe(false);

    press(host, "Escape");

    expect(fnHelpRoot(popupCtx).hidden).toBe(true);

    keyUp(host, "ArrowLeft");

    expect(fnHelpRoot(popupCtx).hidden).toBe(true);

    typeInto(host, "=SUM(1,2");

    expect(fnHelpRoot(popupCtx).hidden).toBe(false);

    destroy();
    host.remove();
  });

  it("Escape ladder: first closes fn-help, then drops the point ref, then cancels", () => {
    const onCancel = vi.fn();
    const adapter = new TestGridAdapter({
      formatRef: formatRefAsRC,
      active: { sheet: "", col: 0, row: 0 },
    });
    const harness = createEditorHarness({
      adapter,
      onCancel,
      hyperformula: new FnHelpFocusHyperFormula() as never,
      language: FAKE_LANGUAGE,
      sheetId: 0,
    });
    const textarea = requireTextarea(harness.host);
    const root = requireEditorRoot(harness.host);

    root.getBoundingClientRect = () => ({ ...VISIBLE_INPUT_RECT, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(harness.host);
    typeInto(harness.host, "=SUM(");
    textarea.focus();
    press(harness.host, "ArrowRight");

    expect(harness.editor.getValue()).toBe("=SUM(R0C1");
    expect(fnHelpRoot(harness.popupCtx).hidden).toBe(false);

    press(harness.host, "Escape");

    expect(fnHelpRoot(harness.popupCtx).hidden).toBe(true);
    expect(harness.editor.getValue()).toBe("=SUM(R0C1");
    expect(onCancel).not.toHaveBeenCalled();

    press(harness.host, "Escape");

    expect(harness.editor.getValue()).toBe("=SUM(");
    expect(onCancel).not.toHaveBeenCalled();

    press(harness.host, "Escape");

    expect(onCancel).toHaveBeenCalledOnce();

    harness.destroy();
    harness.host.remove();
  });
});
