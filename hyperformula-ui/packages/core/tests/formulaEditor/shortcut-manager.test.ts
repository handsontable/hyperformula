import { describe, expect, it, vi } from "vitest";
import { ShortcutManager } from "../../src/formulaEditor/shortcutManager";

function fakeEvent(init: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: "Enter",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: vi.fn(),
    ...init,
  } as unknown as KeyboardEvent;
}

const fullContext = {
  popupOpen: false,
  fnHelpOpen: false,
  isFormula: true,
};

describe("ShortcutManager", () => {
  it("runs the command of the first matching binding and prevents default when handled", () => {
    const manager = new ShortcutManager();
    const commit = vi.fn(() => true);

    manager.setBindings([{ combo: { key: "Enter" }, when: ["always"], command: "commit" }]);
    manager.register("commit", commit);

    const event = fakeEvent({ key: "Enter" });
    const handled = manager.dispatch(event, fullContext);

    expect(handled).toBe(true);
    expect(commit).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it("skips a binding whose context flag is not satisfied", () => {
    const manager = new ShortcutManager();
    const point = vi.fn(() => true);

    manager.setBindings([{ combo: { key: "ArrowRight" }, when: ["popupOpen"], command: "point" }]);
    manager.register("point", point);

    const handled = manager.dispatch(fakeEvent({ key: "ArrowRight" }), fullContext);

    expect(handled).toBe(false);
    expect(point).not.toHaveBeenCalled();
  });

  it("respects binding order — first match wins", () => {
    const manager = new ShortcutManager();
    const popupAccept = vi.fn(() => true);
    const commit = vi.fn(() => true);

    manager.setBindings([
      { combo: { key: "Enter" }, when: ["popupOpen"], command: "accept" },
      { combo: { key: "Enter" }, when: ["always"], command: "commit" },
    ]);
    manager.register("accept", popupAccept);
    manager.register("commit", commit);

    manager.dispatch(fakeEvent({ key: "Enter" }), { ...fullContext, popupOpen: true });

    expect(popupAccept).toHaveBeenCalledOnce();
    expect(commit).not.toHaveBeenCalled();
  });

  it("treats ctrl and meta as the same primary modifier", () => {
    const manager = new ShortcutManager();
    const newline = vi.fn(() => true);

    manager.setBindings([
      { combo: { key: "Enter", mod: true }, when: ["always"], command: "newline" },
    ]);
    manager.register("newline", newline);

    manager.dispatch(fakeEvent({ key: "Enter", metaKey: true }), fullContext);
    manager.dispatch(fakeEvent({ key: "Enter", ctrlKey: true }), fullContext);

    expect(newline).toHaveBeenCalledTimes(2);
  });

  it("does not match a mod-less binding when a modifier is held", () => {
    const manager = new ShortcutManager();
    const commit = vi.fn(() => true);

    manager.setBindings([{ combo: { key: "Enter" }, when: ["always"], command: "commit" }]);
    manager.register("commit", commit);

    const handled = manager.dispatch(fakeEvent({ key: "Enter", ctrlKey: true }), fullContext);

    expect(handled).toBe(false);
  });

  it("does not preventDefault when the command returns false", () => {
    const manager = new ShortcutManager();

    manager.setBindings([{ combo: { key: "ArrowRight" }, when: ["always"], command: "noop" }]);
    manager.register("noop", () => false);

    const event = fakeEvent({ key: "ArrowRight" });

    expect(manager.dispatch(event, fullContext)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("matches a printable-key binding when shift produced the character", () => {
    const manager = new ShortcutManager();
    const autoClose = vi.fn(() => true);

    manager.setBindings([{ combo: { key: "(" }, when: ["always"], command: "autoClose" }]);
    manager.register("autoClose", autoClose);

    const handled = manager.dispatch(fakeEvent({ key: "(", shiftKey: true }), fullContext);

    expect(handled).toBe(true);
    expect(autoClose).toHaveBeenCalledOnce();
  });

  it("still requires exact shift state for named keys", () => {
    const manager = new ShortcutManager();
    const commit = vi.fn(() => true);

    manager.setBindings([{ combo: { key: "Enter" }, when: ["always"], command: "commit" }]);
    manager.register("commit", commit);

    const handled = manager.dispatch(fakeEvent({ key: "Enter", shiftKey: true }), fullContext);

    expect(handled).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("honors an explicit shift requirement on a printable key", () => {
    const manager = new ShortcutManager();
    const command = vi.fn(() => true);

    manager.setBindings([
      { combo: { key: "(", shift: true }, when: ["always"], command: "explicit" },
    ]);
    manager.register("explicit", command);

    expect(manager.dispatch(fakeEvent({ key: "(", shiftKey: false }), fullContext)).toBe(false);
    expect(manager.dispatch(fakeEvent({ key: "(", shiftKey: true }), fullContext)).toBe(true);
  });
});
