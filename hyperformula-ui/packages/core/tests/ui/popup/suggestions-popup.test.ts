import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CN } from "../../../src/theme/classNames";
import { orderSuggestionItems, SuggestionsPopup } from "../../../src/ui/popup/suggestionsPopup";
import { sel } from "../../helpers";

describe("orderSuggestionItems", () => {
  it("ranks prefix matches before substring matches, stable within each tier", () => {
    const items = [
      { value: "TAN" },
      { value: "BITAND" },
      { value: "COUNTA" },
      { value: "TaxRate", kind: "named" as const },
    ];
    expect(orderSuggestionItems(items, "Ta").map((item) => item.value)).toEqual([
      "TAN",
      "TaxRate",
      "BITAND",
      "COUNTA",
    ]);
  });

  it("matches case-insensitively", () => {
    const items = [{ value: "average" }, { value: "AVG" }];
    expect(orderSuggestionItems(items, "AV").map((item) => item.value)).toEqual(["average", "AVG"]);
  });

  it("returns items unchanged when prefix is empty", () => {
    const items = [{ value: "B" }, { value: "A" }];
    expect(orderSuggestionItems(items, "")).toBe(items);
  });
});

describe("SuggestionsPopup", () => {
  let selected: string[] = [];
  let closed = 0;
  let popup: SuggestionsPopup;

  beforeEach(() => {
    selected = [];
    closed = 0;
    popup = new SuggestionsPopup({
      onSelect: (item) => selected.push(item.value),
      onExplicitClose: () => closed++,
    });
  });

  afterEach(() => {
    popup.destroy();
  });

  it("opens with items and closes on hide without firing onExplicitClose", () => {
    popup.show([{ value: "SUM" }, { value: "SUMIF" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    expect(popup.isVisible()).toBe(true);
    popup.close();
    expect(popup.isVisible()).toBe(false);
    expect(closed).toBe(0);
  });

  it("ignores empty item list", () => {
    popup.show([], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    expect(popup.isVisible()).toBe(false);
  });

  it("clamps the active index when a re-show shrinks the item list", () => {
    const anchor = { left: 0, top: 0, width: 0, height: 20, direction: "ltr" as const };

    popup.show([{ value: "A" }, { value: "B" }, { value: "C" }], anchor);
    popup.move(1);
    popup.move(1);
    popup.show([{ value: "AB" }], anchor);

    const activeRow = document.querySelector<HTMLElement>(sel(CN.suggestionsItemActive));

    if (!activeRow) {
      throw new Error("expected an active suggestion row after the list shrank");
    }

    expect(activeRow.getAttribute("aria-selected")).toBe("true");
    popup.selectActive();
    expect(selected).toEqual(["AB"]);
  });

  it("keeps aria-activedescendant pointing at a rendered option after the list shrinks", () => {
    const anchor = { left: 0, top: 0, width: 0, height: 20, direction: "ltr" as const };
    const ariaStates: Array<{ activeOptionId: string | null }> = [];
    const ariaPopup = new SuggestionsPopup({
      onSelect: () => {},
      onExplicitClose: () => {},
      onAriaStateChange: (state) => ariaStates.push(state),
    });

    ariaPopup.show([{ value: "A" }, { value: "B" }, { value: "C" }], anchor);
    ariaPopup.move(1);
    ariaPopup.move(1);
    ariaPopup.show([{ value: "AB" }], anchor);

    const lastState = ariaStates[ariaStates.length - 1];

    if (!lastState || lastState.activeOptionId === null) {
      throw new Error("expected an aria state with an active option id");
    }

    expect(document.getElementById(lastState.activeOptionId)).not.toBeNull();
    ariaPopup.destroy();
  });

  it("move cycles and wraps", () => {
    popup.show([{ value: "A" }, { value: "B" }, { value: "C" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    popup.move(-1);
    popup.move(1);
    popup.move(1);
    popup.selectActive();
    expect(selected).toEqual(["B"]);
  });

  it("renders description on active item", () => {
    popup.show([{ value: "SUM", description: "Sum of a series of number and/or cells" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    const item = document.body.querySelector(sel(CN.suggestionsItem)) as HTMLElement;
    const desc = item.querySelector(sel(CN.suggestionsItemDescription)) as HTMLElement;
    expect(desc).toBeTruthy();
    expect(desc.textContent).toBe("Sum of a series of number and/or cells");
  });

  it("item without description has no description element", () => {
    popup.show([{ value: "SUM" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    const item = document.body.querySelector(sel(CN.suggestionsItem)) as HTMLElement;
    expect(item.querySelector(sel(CN.suggestionsItemDescription))).toBeNull();
  });

  it("renders named-expression item with named class and range", () => {
    popup.show([{ value: "SummaryData", kind: "named", description: "Sheet1!A1:B5" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    const item = document.body.querySelector(sel(CN.suggestionsItem)) as HTMLElement;
    expect(item.classList.contains(CN.suggestionsItemNamed)).toBe(true);
    const desc = item.querySelector(sel(CN.suggestionsItemDescription)) as HTMLElement;
    expect(desc?.textContent).toBe("Sheet1!A1:B5");
  });

  it("renders kbd-row by default (showKeyboardHelp: true)", () => {
    popup.show([{ value: "SUM" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    expect(document.body.querySelector(sel(CN.suggestionsKbdRow))).toBeTruthy();
  });

  it("omits kbd-row when showKeyboardHelp is false", () => {
    const noKbd = new SuggestionsPopup(
      { onSelect: () => {}, onExplicitClose: () => {} },
      { showKeyboardHelp: false },
    );
    noKbd.show([{ value: "SUM" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    expect(document.body.querySelector(sel(CN.suggestionsKbdRow))).toBeNull();
    noKbd.destroy();
  });

  it("activates hovered row on mousemove with fresh coordinates", () => {
    popup.show([{ value: "A" }, { value: "B" }, { value: "C" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    const rows = document.body.querySelectorAll(sel(CN.suggestionsItem));
    const lastRow = rows[2];
    if (!lastRow) {
      throw new Error("expected third suggestion row");
    }

    lastRow.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }));
    popup.selectActive();

    expect(selected).toEqual(["C"]);
  });

  it("keeps keyboard selection when a coordinate-identical mousemove follows", () => {
    popup.show([{ value: "A" }, { value: "B" }, { value: "C" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });
    const rows = document.body.querySelectorAll(sel(CN.suggestionsItem));
    const firstRow = rows[0];
    if (!firstRow) {
      throw new Error("expected first suggestion row");
    }

    firstRow.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }),
    );
    popup.move(1);
    firstRow.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }),
    );
    popup.selectActive();

    expect(selected).toEqual(["B"]);
  });

  it("does not auto-scroll on hover-driven activation", () => {
    const scrollCalls: Element[] = [];
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function trackScroll() {
      scrollCalls.push(this);
    };

    try {
      popup.show([{ value: "A" }, { value: "B" }], {
        left: 0,
        top: 0,
        width: 0,
        height: 20,
        direction: "ltr",
      });
      scrollCalls.length = 0;
      const rows = document.body.querySelectorAll(sel(CN.suggestionsItem));
      const secondRow = rows[1];
      if (!secondRow) {
        throw new Error("expected second suggestion row");
      }

      secondRow.dispatchEvent(
        new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: 10 }),
      );

      expect(scrollCalls).toEqual([]);

      popup.move(-1);

      expect(scrollCalls.length).toBe(1);
    } finally {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("drops per-render row listeners on reopen, firing only the current row once", () => {
    popup.show([{ value: "SUM" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    const staleRow = document.body.querySelector(sel(CN.suggestionsItem)) as HTMLElement;
    popup.close();
    staleRow.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(selected).toEqual([]);

    popup.show([{ value: "AVG" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });
    const freshRow = document.body.querySelector(sel(CN.suggestionsItem)) as HTMLElement;
    freshRow.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(selected).toEqual(["AVG"]);
  });

  it("scopes the listbox role to the option list with an accessible name", () => {
    popup.show([{ value: "SUM" }, { value: "SUMIF" }], {
      left: 0,
      top: 0,
      width: 0,
      height: 20,
      direction: "ltr",
    });

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement;

    expect(listbox.classList.contains(CN.suggestionsList)).toBe(true);
    expect(listbox.getAttribute("aria-label")).toBe("Formula suggestions");

    for (const child of Array.from(listbox.children)) {
      expect(child.getAttribute("role")).toBe("option");
    }
  });

  it("keeps the keyboard help row outside the listbox", () => {
    popup.show([{ value: "SUM" }], { left: 0, top: 0, width: 0, height: 20, direction: "ltr" });

    const kbdRow = document.querySelector(sel(CN.suggestionsKbdRow)) as HTMLElement;

    expect(kbdRow.closest('[role="listbox"]')).toBeNull();
  });

  it("reuses pooled row elements across overlapping re-shows while open", () => {
    const anchor = { left: 0, top: 0, width: 0, height: 20, direction: "ltr" as const };

    popup.show([{ value: "SUM" }, { value: "SUMIF" }], anchor);
    const firstRows = Array.from(document.body.querySelectorAll(sel(CN.suggestionsItem)));

    popup.show([{ value: "SUM" }, { value: "SUMIFS" }], anchor);
    const secondRows = Array.from(document.body.querySelectorAll(sel(CN.suggestionsItem)));

    expect(secondRows).toHaveLength(2);
    expect(secondRows[0]).toBe(firstRows[0]);
    expect(secondRows[1]).toBe(firstRows[1]);
    expect(secondRows[1]?.textContent).toContain("SUMIFS");
  });

  it("selects via a single delegated listener after a pooled re-show", () => {
    const anchor = { left: 0, top: 0, width: 0, height: 20, direction: "ltr" as const };

    popup.show([{ value: "SUM" }, { value: "SUMIF" }], anchor);
    popup.show([{ value: "SUM" }, { value: "AVERAGE" }], anchor);

    const rows = document.body.querySelectorAll(sel(CN.suggestionsItem));
    const secondRow = rows[1];

    if (!secondRow) {
      throw new Error("expected second suggestion row");
    }

    secondRow.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));

    expect(selected).toEqual(["AVERAGE"]);
  });

  it("hovers to a pooled row via delegation after a re-show", () => {
    const anchor = { left: 0, top: 0, width: 0, height: 20, direction: "ltr" as const };

    popup.show([{ value: "SUM" }, { value: "SUMIF" }], anchor);
    popup.show([{ value: "SUM" }, { value: "AVERAGE" }], anchor);

    const rows = document.body.querySelectorAll(sel(CN.suggestionsItem));
    const secondRow = rows[1];

    if (!secondRow) {
      throw new Error("expected second suggestion row");
    }

    secondRow.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, clientX: 42, clientY: 42 }),
    );
    popup.selectActive();

    expect(selected).toEqual(["AVERAGE"]);
  });
});
