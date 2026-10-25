import { describe, expect, it } from "vitest";
import { ListenerSet } from "../../src/events/listenerSet";

describe("ListenerSet", () => {
  it("emits to every registered listener with the given arguments", () => {
    const set = new ListenerSet<[number, string]>();
    const seen: [number, string][] = [];

    set.add((count, label) => seen.push([count, label]));
    set.add((count, label) => seen.push([count * 2, label]));
    set.emit(1, "x");

    expect(seen).toEqual([
      [1, "x"],
      [2, "x"],
    ]);
  });

  it("stops calling a listener after its unsubscribe runs", () => {
    const set = new ListenerSet();
    let calls = 0;
    const unsubscribe = set.add(() => {
      calls += 1;
    });

    set.emit();
    unsubscribe();
    set.emit();

    expect(calls).toBe(1);
  });

  it("registers the same listener only once", () => {
    const set = new ListenerSet();
    let calls = 0;
    const listener = (): void => {
      calls += 1;
    };

    set.add(listener);
    set.add(listener);
    set.emit();

    expect(calls).toBe(1);
    expect(set.size).toBe(1);
  });

  it("clear drops all listeners", () => {
    const set = new ListenerSet();
    let calls = 0;

    set.add(() => {
      calls += 1;
    });
    set.clear();
    set.emit();

    expect(calls).toBe(0);
    expect(set.size).toBe(0);
  });
});
