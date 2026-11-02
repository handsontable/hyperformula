import { describe, expect, it } from "vitest";
import { RangeDragTracker } from "../../src/adapter/rangeDragTracker";
import type { CellAddress, CellPick, CellRange, RangePick } from "../../src/adapter/types";

interface TrackerHarness {
  tracker: RangeDragTracker;
  previews: Array<{ range: CellRange; append: boolean }>;
  cellDrops: CellPick[];
  rangeDrops: RangePick[];
  dragEnds: number[];
}

function cell(row: number, col: number): CellAddress {
  return { sheet: "", row, col };
}

function makeTracker(addressAt: CellAddress | null = null): TrackerHarness {
  const previews: Array<{ range: CellRange; append: boolean }> = [];
  const cellDrops: CellPick[] = [];
  const rangeDrops: RangePick[] = [];
  const dragEnds: number[] = [];
  const tracker = new RangeDragTracker({
    getScrollElement: () => null,
    getCellAddressAt: () => addressAt,
    onPreview: (range, append) => previews.push({ range, append }),
    onDragEnd: () => dragEnds.push(previews.length),
    onDropCell: (pick) => cellDrops.push(pick),
    onDropRange: (pick) => rangeDrops.push(pick),
  });

  return { tracker, previews, cellDrops, rangeDrops, dragEnds };
}

describe("RangeDragTracker", () => {
  it("previews the anchor cell on begin", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(2, 3), false);

    expect(harness.tracker.isActive()).toBe(true);
    expect(harness.previews).toEqual([
      { range: { start: cell(2, 3), end: cell(2, 3) }, append: false },
    ]);
  });

  it("previews the normalized range on extend and carries the append flag", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(5, 5), true);
    harness.tracker.extendTo(cell(2, 3));

    expect(harness.previews[1]).toEqual({
      range: { start: cell(2, 3), end: cell(5, 5) },
      append: true,
    });
  });

  it("dedupes extend calls that stay on the same cell", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(1, 1), false);
    harness.tracker.extendTo(cell(2, 2));
    harness.tracker.extendTo(cell(2, 2));
    harness.tracker.extendTo(cell(2, 2));

    expect(harness.previews).toHaveLength(2);
  });

  it("fires onDragEnd before the drop on finish and on cancel, never when idle", () => {
    const harness = makeTracker();

    harness.tracker.finish();

    expect(harness.dragEnds).toEqual([]);

    harness.tracker.begin(cell(1, 1), false);
    harness.tracker.finish();

    expect(harness.dragEnds).toEqual([1]);
    expect(harness.cellDrops).toHaveLength(1);

    harness.tracker.begin(cell(2, 2), false);
    harness.tracker.cancel();

    expect(harness.dragEnds).toEqual([1, 2]);
    expect(harness.cellDrops).toHaveLength(1);
  });

  it("ignores extend without an active drag", () => {
    const harness = makeTracker();

    harness.tracker.extendTo(cell(1, 1));

    expect(harness.previews).toEqual([]);
  });

  it("drops a single cell when the drag never left the anchor", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(4, 4), false);
    harness.tracker.finish();

    expect(harness.cellDrops).toEqual([{ ref: cell(4, 4), append: false }]);
    expect(harness.rangeDrops).toEqual([]);
    expect(harness.tracker.isActive()).toBe(false);
  });

  it("drops a normalized range after an extend", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(4, 4), true);
    harness.tracker.extendTo(cell(1, 6));
    harness.tracker.finish();

    expect(harness.rangeDrops).toEqual([
      { ref: { start: cell(1, 4), end: cell(4, 6) }, append: true },
    ]);
    expect(harness.cellDrops).toEqual([]);
  });

  it("cancel discards the drag without emitting", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(0, 0), false);
    harness.tracker.cancel();
    harness.tracker.finish();

    expect(harness.tracker.isActive()).toBe(false);
    expect(harness.cellDrops).toEqual([]);
    expect(harness.rangeDrops).toEqual([]);
  });

  it("a new drag after finish starts clean", () => {
    const harness = makeTracker();

    harness.tracker.begin(cell(0, 0), true);
    harness.tracker.finish();
    harness.tracker.begin(cell(2, 2), false);
    harness.tracker.finish();

    expect(harness.cellDrops).toEqual([
      { ref: cell(0, 0), append: true },
      { ref: cell(2, 2), append: false },
    ]);
  });
});
