import { describe, expect, it, vi } from "vitest";
import { HeaderDragTracker } from "../../src/adapter/headerDragTracker";

function makeTracker() {
  const onPreview = vi.fn();
  const onDrop = vi.fn();
  const onDragEnd = vi.fn();
  const tracker = new HeaderDragTracker({ sheet: "S", onPreview, onDrop, onDragEnd });

  return { tracker, onPreview, onDrop, onDragEnd };
}

describe("HeaderDragTracker", () => {
  it("begin previews a single-index pick", () => {
    const { tracker, onPreview } = makeTracker();

    tracker.begin("column", 2, false);

    expect(onPreview).toHaveBeenLastCalledWith({
      axis: "column",
      sheet: "S",
      start: 2,
      end: 2,
      append: false,
    });
  });

  it("extendTo updates the span and normalizes on drop", () => {
    const { tracker, onDrop, onDragEnd } = makeTracker();

    tracker.begin("row", 5, true);
    tracker.extendTo("row", 1);
    tracker.finish();

    expect(onDrop).toHaveBeenCalledWith({
      axis: "row",
      sheet: "S",
      start: 1,
      end: 5,
      append: true,
    });
    expect(onDragEnd).toHaveBeenCalledOnce();
    expect(tracker.isActive()).toBe(false);
  });

  it("ignores cross-axis extension", () => {
    const { tracker, onDrop } = makeTracker();

    tracker.begin("column", 1, false);
    tracker.extendTo("row", 7);
    tracker.finish();

    expect(onDrop).toHaveBeenCalledWith(expect.objectContaining({ start: 1, end: 1 }));
  });

  it("cancel drops nothing and fires onDragEnd", () => {
    const { tracker, onDrop, onDragEnd } = makeTracker();

    tracker.begin("column", 1, false);
    tracker.cancel();
    tracker.finish();

    expect(onDrop).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledOnce();
  });
});

describe("HeaderDragTracker.activeAxis", () => {
  it("reports the axis while active and null otherwise", () => {
    const { tracker } = makeTracker();

    expect(tracker.activeAxis()).toBe(null);
    tracker.begin("row", 2, false);
    expect(tracker.activeAxis()).toBe("row");
    tracker.finish();
    expect(tracker.activeAxis()).toBe(null);
  });
});

describe("HeaderDragTracker.finish cleanup ordering", () => {
  it("runs onDragEnd before onDrop so cleanup survives a throwing drop handler", () => {
    const calls: string[] = [];
    const tracker = new HeaderDragTracker({
      sheet: "S",
      onPreview: () => {},
      onDrop: () => {
        calls.push("drop");
        throw new Error("drop failed");
      },
      onDragEnd: () => calls.push("dragEnd"),
    });

    tracker.begin("column", 1, false);

    expect(() => tracker.finish()).toThrow("drop failed");
    expect(calls).toEqual(["dragEnd", "drop"]);
    expect(tracker.isActive()).toBe(false);
  });
});
