import { describe, expect, it } from "vitest";
import { resolveEditStartKey } from "../../src/adapter/keyboard";

function keyEvent(
  key: string,
  modifiers: Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean }> = {},
) {
  return { key, ctrlKey: false, metaKey: false, altKey: false, ...modifiers };
}

describe("resolveEditStartKey", () => {
  it("returns an empty intent for Enter", () => {
    expect(resolveEditStartKey(keyEvent("Enter"))).toEqual({});
  });

  it("returns an empty intent for F2", () => {
    expect(resolveEditStartKey(keyEvent("F2"))).toEqual({});
  });

  it("seeds a plain letter", () => {
    expect(resolveEditStartKey(keyEvent("a"))).toEqual({ seed: "a" });
  });

  it("seeds a digit", () => {
    expect(resolveEditStartKey(keyEvent("7"))).toEqual({ seed: "7" });
  });

  it("seeds the formula starter", () => {
    expect(resolveEditStartKey(keyEvent("="))).toEqual({ seed: "=" });
  });

  it("seeds space", () => {
    expect(resolveEditStartKey(keyEvent(" "))).toEqual({ seed: " " });
  });

  it("rejects ctrl shortcuts", () => {
    expect(resolveEditStartKey(keyEvent("c", { ctrlKey: true }))).toBeNull();
  });

  it("rejects meta shortcuts", () => {
    expect(resolveEditStartKey(keyEvent("v", { metaKey: true }))).toBeNull();
  });

  it("seeds AltGraph combos (ctrl+alt)", () => {
    expect(resolveEditStartKey(keyEvent("@", { ctrlKey: true, altKey: true }))).toEqual({
      seed: "@",
    });
  });

  it("rejects navigation keys", () => {
    expect(resolveEditStartKey(keyEvent("ArrowDown"))).toBeNull();
    expect(resolveEditStartKey(keyEvent("Tab"))).toBeNull();
    expect(resolveEditStartKey(keyEvent("Escape"))).toBeNull();
  });

  it("rejects IME composition keys", () => {
    expect(resolveEditStartKey(keyEvent("Dead"))).toBeNull();
    expect(resolveEditStartKey(keyEvent("Process"))).toBeNull();
  });

  it("rejects meta+alt combos", () => {
    expect(resolveEditStartKey(keyEvent("a", { metaKey: true, altKey: true }))).toBeNull();
  });

  it("rejects modified Enter and F2", () => {
    expect(resolveEditStartKey(keyEvent("Enter", { ctrlKey: true }))).toBeNull();
    expect(resolveEditStartKey(keyEvent("Enter", { metaKey: true }))).toBeNull();
    expect(resolveEditStartKey(keyEvent("Enter", { altKey: true }))).toBeNull();
    expect(resolveEditStartKey(keyEvent("F2", { ctrlKey: true }))).toBeNull();
  });
});
