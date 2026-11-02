import { afterEach, describe, expect, it } from "vitest";
import { CN } from "../../src/theme/classNames";
import { createEditorHarness } from "../helpers";

describe("FormulaEditor direction", () => {
  let cleanup: (() => void) | null = null;

  afterEach(() => {
    cleanup?.();
    cleanup = null;
  });

  function editorRoot(host: HTMLElement): HTMLElement {
    const root = host.querySelector<HTMLElement>(`.${CN.editor}`);
    if (!root) {
      throw new Error("editor root not found");
    }
    return root;
  }

  it("defaults to no dir on the root (LTR)", () => {
    const harness = createEditorHarness();
    cleanup = harness.destroy;

    expect(editorRoot(harness.host).getAttribute("dir")).toBeNull();
  });

  it("sets dir=rtl on the root when direction is rtl", () => {
    const harness = createEditorHarness({ direction: "rtl" });
    cleanup = harness.destroy;

    expect(editorRoot(harness.host).getAttribute("dir")).toBe("rtl");
  });

  it("keeps content layers dir=ltr regardless of direction", () => {
    const harness = createEditorHarness({ direction: "rtl" });
    cleanup = harness.destroy;

    const root = editorRoot(harness.host);
    expect(root.querySelector<HTMLElement>(`.${CN.editorInput}`)?.getAttribute("dir")).toBe("ltr");
    expect(root.querySelector<HTMLElement>(`.${CN.overlay}`)?.getAttribute("dir")).toBe("ltr");
  });
});
