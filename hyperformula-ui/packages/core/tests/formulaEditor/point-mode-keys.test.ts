import { describe, expect, it, vi } from "vitest";
import {
  createEditorHarness,
  formatRefAsRC,
  press,
  requireTextarea,
  TestGridAdapter,
  typeInto,
} from "../helpers";

function createPointModeHarness(options: { onCancel?: () => void } = {}) {
  const adapter = new TestGridAdapter({
    formatRef: formatRefAsRC,
    active: { sheet: "", col: 0, row: 0 },
  });

  return createEditorHarness({ adapter, ...options });
}

describe("point mode keyboard parity", () => {
  it("force-inserts a ref mid-formula when point mode is armed via F2", () => {
    const { host, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1+2");
    press(host, "F2");
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=1+2R0C1");
    destroy();
  });

  it("typing ) skips over an auto-inserted ) instead of duplicating it", () => {
    const { host, editor, destroy } = createPointModeHarness();

    typeInto(host, "=");
    press(host, "(");
    expect(editor.getValue()).toBe("=()");
    press(host, ")");
    expect(editor.getValue()).toBe("=()");

    destroy();
  });

  it("F4 with the caret not on a reference leaves the formula unchanged", () => {
    const { host, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1+2");
    press(host, "F4");
    expect(editor.getValue()).toBe("=1+2");

    destroy();
  });

  it("resets range-selection mode when the editor is reseeded (close then reopen)", () => {
    const { host, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1");
    press(host, "F2");
    editor.setValue("=5");
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=5");
    destroy();
  });

  it("falls back to caret movement after a mouse pick instead of stepping the ref", () => {
    const { host, adapter, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1+");
    adapter.pickCell({ sheet: "", col: 5, row: 5 });
    expect(editor.getValue()).toBe("=1+R5C5");

    const event = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });

    requireTextarea(host).dispatchEvent(event);

    expect(editor.getValue()).toBe("=1+R5C5");
    expect(event.defaultPrevented).toBe(false);
    destroy();
  });

  it("mouse pick ends keyboard stepping so the next arrow moves the caret", () => {
    const { host, adapter, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1+");
    press(host, "ArrowRight");
    expect(editor.getValue()).toBe("=1+R0C1");

    adapter.pickCell({ sheet: "", col: 5, row: 5 });
    expect(editor.getValue()).toBe("=1+R5C5");

    press(host, "ArrowRight");
    expect(editor.getValue()).toBe("=1+R5C5");
    destroy();
  });

  it("keyboard-armed point mode keeps stepping across repeated arrows", () => {
    const { host, editor, destroy } = createPointModeHarness();

    typeInto(host, "=1+");
    press(host, "ArrowRight");
    press(host, "ArrowRight");

    expect(editor.getValue()).toBe("=1+R0C2");
    destroy();
  });

  it("first Escape cancels the pending point ref and keeps editing; second cancels the edit", () => {
    const onCancel = vi.fn();
    const { host, editor, destroy } = createPointModeHarness({ onCancel });

    typeInto(host, "=");
    press(host, "ArrowRight");
    expect(editor.getValue()).toBe("=R0C1");

    press(host, "Escape");
    expect(editor.getValue()).toBe("=");
    expect(onCancel).not.toHaveBeenCalled();

    press(host, "Escape");
    expect(onCancel).toHaveBeenCalledOnce();
    destroy();
  });
});
