import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveRegion } from "../../src/ui/liveRegion";

describe("LiveRegion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("creates a polite live region attached to the container", () => {
    const region = new LiveRegion();

    expect(region.root.getAttribute("aria-live")).toBe("polite");
    expect(region.root.getAttribute("role")).toBe("status");
    expect(region.root.getAttribute("aria-atomic")).toBe("true");
    expect(document.body.contains(region.root)).toBe(true);
  });

  it("announces after clearing so repeated messages re-fire", () => {
    const region = new LiveRegion();

    region.announce("#N/A — value not found");
    expect(region.root.textContent).toBe("");

    vi.runAllTimers();
    expect(region.root.textContent).toBe("#N/A — value not found");

    region.announce("#N/A — value not found");
    expect(region.root.textContent).toBe("");

    vi.runAllTimers();
    expect(region.root.textContent).toBe("#N/A — value not found");
  });

  it("removes the element and pending announcements on destroy", () => {
    const region = new LiveRegion();

    region.announce("late");
    region.destroy();
    vi.runAllTimers();

    expect(document.body.contains(region.root)).toBe(false);
    expect(region.root.textContent).toBe("");
  });
});
