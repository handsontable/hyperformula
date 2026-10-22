import { describe, expect, it, vi } from "vitest";
import { NamedExpressions } from "../../src/engine/namedExpressions";

describe("NamedExpressions caching", () => {
  it("resolving 3 idents in one tokenize calls listNamedExpressions at most once per scope", () => {
    const listNamedExpressions = vi.fn((scope?: number) =>
      scope === 0 ? ["TaxRate"] : ["SalesRange"],
    );
    const mockEngine = {
      listNamedExpressions,
      getNamedExpressionFormula: () => "=42",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => undefined,
    };
    const namedExprs = new NamedExpressions(mockEngine as never, 0);

    namedExprs.resolve("TaxRate");
    namedExprs.resolve("SUMPRODUCT");
    namedExprs.resolve("SalesRange");

    expect(listNamedExpressions).toHaveBeenCalledTimes(2);
  });

  it("memoizes resolve() results by name", () => {
    const getNamedExpressionFormula = vi.fn(() => "=42");
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? ["TaxRate"] : []),
      getNamedExpressionFormula,
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => undefined,
    };
    const namedExprs = new NamedExpressions(mockEngine as never, 0);

    namedExprs.resolve("TaxRate");
    namedExprs.resolve("TaxRate");

    expect(getNamedExpressionFormula).toHaveBeenCalledTimes(1);
  });

  it("resolves a name added after invalidate() that was previously missing", () => {
    let localNames = ["TaxRate"];
    const mockEngine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? localNames : []),
      getNamedExpressionFormula: () => "=42",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => undefined,
    };
    const namedExprs = new NamedExpressions(mockEngine as never, 0);

    expect(namedExprs.resolve("NewRange")).toBeNull();

    localNames = ["TaxRate", "NewRange"];
    namedExprs.invalidate();

    expect(namedExprs.resolve("NewRange")).not.toBeNull();
  });
});

describe("NamedExpressions engine-event invalidation", () => {
  function createEmittingEngine() {
    const listeners = new Map<string, Set<(name: string) => void>>();
    let localNames: string[] = [];

    const engine = {
      listNamedExpressions: (scope?: number) => (scope === 0 ? localNames : []),
      getNamedExpressionFormula: () => "=42",
      simpleCellRangeFromString: () => undefined,
      simpleCellAddressFromString: () => undefined,
      on: (event: string, listener: (name: string) => void) => {
        const set = listeners.get(event) ?? new Set();
        set.add(listener);
        listeners.set(event, set);
      },
      off: (event: string, listener: (name: string) => void) => {
        listeners.get(event)?.delete(listener);
      },
    };

    const emit = (event: string, name: string): void => {
      for (const listener of listeners.get(event) ?? []) {
        listener(name);
      }
    };

    return {
      engine,
      setLocalNames: (names: string[]): void => {
        localNames = names;
      },
      emit,
      listenerCount: (event: string): number => listeners.get(event)?.size ?? 0,
    };
  }

  it("resolves a name added via namedExpressionAdded without any attachTo", () => {
    const { engine, setLocalNames, emit } = createEmittingEngine();
    const namedExprs = new NamedExpressions(engine as never, 0);

    expect(namedExprs.resolve("NewRange")).toBeNull();

    setLocalNames(["NewRange"]);
    emit("namedExpressionAdded", "NewRange");

    expect(namedExprs.resolve("NewRange")).not.toBeNull();
  });

  it("resolves a removed name to null via namedExpressionRemoved", () => {
    const { engine, setLocalNames, emit } = createEmittingEngine();
    setLocalNames(["TaxRate"]);
    const namedExprs = new NamedExpressions(engine as never, 0);

    expect(namedExprs.resolve("TaxRate")).not.toBeNull();

    setLocalNames([]);
    emit("namedExpressionRemoved", "TaxRate");

    expect(namedExprs.resolve("TaxRate")).toBeNull();
  });

  it("unsubscribes on destroy so later events no longer invalidate the cache", () => {
    const { engine, setLocalNames, emit, listenerCount } = createEmittingEngine();
    setLocalNames(["TaxRate"]);
    const namedExprs = new NamedExpressions(engine as never, 0);

    expect(namedExprs.resolve("TaxRate")).not.toBeNull();

    namedExprs.destroy();

    expect(listenerCount("namedExpressionAdded")).toBe(0);
    expect(listenerCount("namedExpressionRemoved")).toBe(0);

    setLocalNames(["TaxRate", "NewRange"]);
    emit("namedExpressionAdded", "NewRange");

    expect(namedExprs.resolve("NewRange")).toBeNull();
  });
});
