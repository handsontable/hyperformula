import { afterEach, describe, expect, it } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { PopupContext } from "../../../src/ui/popup/popupContext";

describe("PopupContext", () => {
  const created: PopupContext[] = [];

  afterEach(() => {
    for (const ctx of created) {
      ctx.destroy();
    }
    created.length = 0;
  });

  it("appends portal to document.body when no parent is given", () => {
    const ctx = new PopupContext();
    created.push(ctx);
    expect(document.body.contains(ctx.portal)).toBe(true);
  });

  it("appends portal to the given parent", () => {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const ctx = new PopupContext({ parent });
    created.push(ctx);
    expect(parent.contains(ctx.portal)).toBe(true);
    parent.remove();
  });

  it("portal has only the hfe-popup-portal base class", () => {
    const ctx = new PopupContext();
    created.push(ctx);
    expect(ctx.portal.classList.contains(CN.popupPortal)).toBe(true);
    expect(ctx.portal.classList.length).toBe(1);
  });

  it("applies className to portal element", () => {
    const ctx = new PopupContext({ className: "my-theme" });
    created.push(ctx);
    expect(ctx.portal.classList.contains("my-theme")).toBe(true);
  });

  it("destroy() removes the portal from the DOM", () => {
    const ctx = new PopupContext();
    expect(document.body.contains(ctx.portal)).toBe(true);
    ctx.destroy();
    expect(document.body.contains(ctx.portal)).toBe(false);
  });
});
