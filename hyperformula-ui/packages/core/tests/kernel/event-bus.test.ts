import { afterEach, describe, expect, it, vi } from "vitest";
import { EventBus } from "../../src/kernel/eventBus";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("EventBus", () => {
  it("delivers an emitted payload to a subscriber", () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on("focus", listener);
    bus.emit("focus", { focused: true });

    expect(listener).toHaveBeenCalledWith({ focused: true });
  });

  it("delivers to every subscriber of the same event", () => {
    const bus = new EventBus();
    const first = vi.fn();
    const second = vi.fn();

    bus.on("focus", first);
    bus.on("focus", second);
    bus.emit("focus", { focused: false });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops delivery after the returned unsubscribe is called", () => {
    const bus = new EventBus();
    const listener = vi.fn();
    const unsubscribe = bus.on("focus", listener);

    unsubscribe();
    bus.emit("focus", { focused: true });

    expect(listener).not.toHaveBeenCalled();
  });

  it("is a no-op to emit an event with no listeners", () => {
    const bus = new EventBus();

    expect(() => bus.emit("focus", { focused: true })).not.toThrow();
  });

  it("isolates a throwing listener so others still run", () => {
    const bus = new EventBus();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const survivor = vi.fn();

    bus.on("focus", () => {
      throw new Error("boom");
    });
    bus.on("focus", survivor);
    bus.emit("focus", { focused: true });

    expect(survivor).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
  });

  it("drops all listeners on clear", () => {
    const bus = new EventBus();
    const listener = vi.fn();

    bus.on("focus", listener);
    bus.clear();
    bus.emit("focus", { focused: true });

    expect(listener).not.toHaveBeenCalled();
  });
});
