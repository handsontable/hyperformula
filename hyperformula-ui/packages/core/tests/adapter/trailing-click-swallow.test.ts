import { describe, expect, it } from "vitest";
import { armTrailingClickSwallow } from "../../src/adapter/trailingClickSwallow";

function clickOn(target: Element): MouseEvent {
  const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

  target.dispatchEvent(clickEvent);

  return clickEvent;
}

function makeFixture() {
  const headerCell = document.createElement("th");
  const outside = document.createElement("div");

  document.body.append(headerCell, outside);

  const cleanup = () => {
    headerCell.remove();
    outside.remove();
  };

  return { headerCell, outside, cleanup };
}

describe("armTrailingClickSwallow", () => {
  it("swallows the next matching click and disarms", () => {
    const { headerCell, cleanup } = makeFixture();

    armTrailingClickSwallow(document, (target) => Boolean(target.closest("th")));

    expect(clickOn(headerCell).defaultPrevented).toBe(true);
    expect(clickOn(headerCell).defaultPrevented).toBe(false);
    cleanup();
  });

  it("passes a non-matching click through and disarms", () => {
    const { headerCell, outside, cleanup } = makeFixture();

    armTrailingClickSwallow(document, (target) => Boolean(target.closest("th")));

    expect(clickOn(outside).defaultPrevented).toBe(false);
    expect(clickOn(headerCell).defaultPrevented).toBe(false);
    cleanup();
  });

  it("disarms on a new mousedown without swallowing the following click", () => {
    const { headerCell, cleanup } = makeFixture();

    armTrailingClickSwallow(document, (target) => Boolean(target.closest("th")));
    headerCell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(clickOn(headerCell).defaultPrevented).toBe(false);
    cleanup();
  });

  it("returned disarm removes the listener", () => {
    const { headerCell, cleanup } = makeFixture();

    const disarm = armTrailingClickSwallow(document, (target) => Boolean(target.closest("th")));

    disarm();

    expect(clickOn(headerCell).defaultPrevented).toBe(false);
    cleanup();
  });
});
