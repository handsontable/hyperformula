import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullAdapter } from "../src/adapter/nullAdapter";
import type { HyperFormulaLike } from "../src/engine/types";
import { FormulaBuilder } from "../src/formulaBuilder";
import { FormulaEditor } from "../src/formulaEditor/formulaEditor";
import { CN } from "../src/theme/classNames";
import { REF_PALETTE } from "../src/theme/refPalette";
import { press, sel, TestGridAdapter } from "./helpers";

class FakeCommitEngine implements HyperFormulaLike {
  private readonly cells = new Map<string, unknown>();
  private listeners: Array<(changes: unknown[]) => void> = [];

  getCellValue(address: { row: number; col: number }): unknown {
    return this.cells.get(`${address.row},${address.col}`);
  }

  on(event: "valuesUpdated", listener: (changes: unknown[]) => void): void;
  on(
    event: "namedExpressionAdded" | "namedExpressionRemoved",
    listener: (name: string) => void,
  ): void;
  on(event: string, listener: (...args: never[]) => void): void {
    if (event === "valuesUpdated") {
      this.listeners.push(listener as (changes: unknown[]) => void);
    }
  }

  off(event: "valuesUpdated", listener: (changes: unknown[]) => void): void;
  off(
    event: "namedExpressionAdded" | "namedExpressionRemoved",
    listener: (name: string) => void,
  ): void;
  off(event: string, listener: (...args: never[]) => void): void {
    if (event === "valuesUpdated") {
      this.listeners = this.listeners.filter((registered) => registered !== listener);
    }
  }

  setCellValue(row: number, col: number, value: unknown): void {
    this.cells.set(`${row},${col}`, value);
  }

  emitValuesUpdated(changes: unknown[]): void {
    for (const listener of this.listeners) {
      listener(changes);
    }
  }
}

class InlineStartAdapter extends NullAdapter {
  private handler: ((mount: HTMLElement, seed: string) => void) | null = null;

  override onInlineEditStart(handler: (mount: HTMLElement, seed: string) => void): () => void {
    this.handler = handler;

    return () => {
      this.handler = null;
    };
  }

  emitInlineEditStart(mount: HTMLElement, seed: string): void {
    this.handler?.(mount, seed);
  }
}

function setTextareaValue(host: HTMLElement, text: string, caret: number): void {
  const textarea = host.querySelector("textarea") as HTMLTextAreaElement;

  textarea.value = text;
  textarea.selectionStart = caret;
  textarea.selectionEnd = caret;
  textarea.dispatchEvent(new Event("input"));
}

describe("FormulaBuilder", () => {
  let builder: FormulaBuilder;
  let rootEl: HTMLDivElement;

  beforeEach(() => {
    rootEl = document.createElement("div");
    document.body.appendChild(rootEl);
    builder = new FormulaBuilder({ rootEl });
  });

  afterEach(() => {
    builder.destroy();
    document.body.replaceChildren();
  });

  describe("construction", () => {
    it("exposes a FormulaEditor", () => {
      expect(builder.editor).toBeInstanceOf(FormulaEditor);
    });

    it("appends the popup portal to the document body", () => {
      expect(document.querySelector(sel(CN.popupPortal))).not.toBeNull();
    });
  });

  describe("openEditor", () => {
    it("moves the editor into the provided mount element and seeds the value", () => {
      const mount = document.createElement("div");

      builder.openEditor(mount, "=SUM(A1:B2)");

      expect(mount.querySelector("textarea")).not.toBeNull();
      expect(builder.editor.getValue()).toBe("=SUM(A1:B2)");
    });

    it("can be called again on a new mount after closeEditor", () => {
      const mount1 = document.createElement("div");
      const mount2 = document.createElement("div");

      builder.openEditor(mount1, "=A1");
      builder.closeEditor();
      builder.openEditor(mount2, "=B2");

      expect(mount1.querySelector("textarea")).toBeNull();
      expect(mount2.querySelector("textarea")).not.toBeNull();
    });
  });

  describe("openEditor ref color", () => {
    it("resolves the post-delete ref count when a drag starts", () => {
      const rootEl2 = document.createElement("div");

      document.body.appendChild(rootEl2);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: rootEl2, adapter });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=(D1-C1)*B1");

      expect(adapter.refSelectionCalls).toHaveLength(1);

      const resolveColor = adapter.refSelectionCalls[0]?.resolveColor;

      if (!resolveColor) {
        throw new Error("expected a color resolver");
      }

      const dragRange = {
        start: { sheet: "", col: 4, row: 4 },
        end: { sheet: "", col: 4, row: 4 },
      };

      expect(resolveColor(dragRange, false)).toBe(REF_PALETTE[3]);

      setTextareaValue(mount, "=(D1-C1)*", "=(D1-C1)*".length);

      expect(resolveColor(dragRange, false)).toBe(REF_PALETTE[2]);

      scoped.destroy();
      rootEl2.remove();
    });
  });

  describe("outside cell click", () => {
    it("commits the current editor value and selects the clicked cell", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=1+2");
      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });

      expect(adapter.commits).toEqual(["=1+2"]);
      expect(adapter.selectedCells).toEqual([{ sheet: "", row: 4, col: 2 }]);

      scoped.destroy();
      host.remove();
    });

    it("closes unbalanced parens before committing, matching keyboard commit", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=SUM(A1");
      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });

      expect(adapter.commits).toEqual(["=SUM(A1)"]);

      scoped.destroy();
      host.remove();
    });

    it("routes the commit through a consumer-supplied onCommit instead of the adapter", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const committed: string[] = [];
      const scoped = new FormulaBuilder({
        rootEl: host,
        adapter,
        onCommit: (value) => committed.push(value),
      });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=1+2");
      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });

      expect(committed).toEqual(["=1+2"]);
      expect(adapter.commits).toEqual([]);
      expect(adapter.selectedCells).toEqual([{ sheet: "", row: 4, col: 2 }]);

      scoped.destroy();
      host.remove();
    });

    it("suppresses grid highlights before committing, matching keyboard commit", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter, onCommit: () => {} });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=A1+B2");

      expect(adapter.highlights.length).toBeGreaterThan(0);

      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });

      expect(adapter.highlights).toEqual([]);

      scoped.destroy();
      host.remove();
    });

    it("does not subscribe when the adapter commits outside clicks natively", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter({ outsideClickCommitMode: "native" });
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=1+2");
      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });

      expect(adapter.commits).toEqual([]);
      expect(adapter.selectedCells).toEqual([]);

      scoped.destroy();
      host.remove();
    });

    it("passes an eligibility resolver that mirrors the caret state", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount = document.createElement("div");

      scoped.openEditor(mount, "=1+");

      const resolver = adapter.refSelectionCalls[0]?.isPickEligible;

      if (!resolver) {
        throw new Error("expected an eligibility resolver");
      }

      expect(resolver()).toBe(true);

      setTextareaValue(mount, "=1+2", 4);

      expect(resolver()).toBe(false);

      scoped.destroy();
      host.remove();
    });
  });

  describe("inline edit close (barless)", () => {
    it("detaches the editor from the inline mount when the host closes the edit", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount = document.createElement("div");

      document.body.appendChild(mount);
      adapter.fireInlineEditStart(mount, "=A1");

      expect(mount.querySelector("textarea")).not.toBeNull();

      adapter.fireInlineEditClose();

      expect(mount.querySelector("textarea")).toBeNull();
      expect(adapter.highlights).toEqual([]);

      scoped.destroy();
      host.remove();
      mount.remove();
    });

    it("reopens cleanly on a new mount after a host-driven close", () => {
      const host = document.createElement("div");

      document.body.appendChild(host);

      const adapter = new TestGridAdapter();
      const scoped = new FormulaBuilder({ rootEl: host, adapter });
      const mount1 = document.createElement("div");
      const mount2 = document.createElement("div");

      document.body.append(mount1, mount2);
      adapter.fireInlineEditStart(mount1, "=A1");
      adapter.fireInlineEditClose();
      adapter.fireInlineEditStart(mount2, "=B2");

      expect(mount1.querySelector("textarea")).toBeNull();
      expect(mount2.querySelector("textarea")).not.toBeNull();
      expect(scoped.editor.getValue()).toBe("=B2");

      scoped.destroy();
      host.remove();
      mount1.remove();
      mount2.remove();
    });
  });

  describe("markCell", () => {
    it("does not set an error attribute for non-error values", () => {
      const cell = document.createElement("td");

      builder.markCell(cell, 42);

      expect(cell.dataset.hfeError).toBeUndefined();
      expect(cell.classList.contains(CN.cellError)).toBe(false);
    });

    it("sets data-hfe-error and the error class for HyperFormula error objects", () => {
      const cell = document.createElement("td");

      builder.markCell(cell, { type: "REF", value: "#REF!" });

      expect(cell.dataset.hfeError).toBe("#REF!");
      expect(cell.classList.contains(CN.cellError)).toBe(true);
    });

    it("clears a previous error when given a non-error value", () => {
      const cell = document.createElement("td");
      builder.markCell(cell, { type: "DIV_BY_ZERO", value: "#DIV/0!" });

      builder.markCell(cell, 10);

      expect(cell.dataset.hfeError).toBeUndefined();
      expect(cell.classList.contains(CN.cellError)).toBe(false);
    });
  });

  describe("destroy", () => {
    it("removes the popup portal from the document", () => {
      const portal = document.querySelector(sel(CN.popupPortal)) as HTMLElement;

      builder.destroy();

      expect(document.body.contains(portal)).toBe(false);
    });
  });

  describe("className", () => {
    class OverlayClassSpyAdapter extends NullAdapter {
      overlayClassNameCalls: Array<string | null> = [];

      override setOverlayClassName(className: string | null): void {
        this.overlayClassNameCalls.push(className);
      }
    }

    let themedRoot: HTMLDivElement;

    beforeEach(() => {
      themedRoot = document.createElement("div");
      document.body.appendChild(themedRoot);
    });

    afterEach(() => {
      themedRoot.remove();
    });

    it("adds the class to the editor root element", () => {
      const themed = new FormulaBuilder({ rootEl: themedRoot, className: "my-theme" });
      const mount = document.createElement("div");

      themed.openEditor(mount, "=A1");

      const editorEl = mount.querySelector(sel(CN.editor));

      expect(editorEl?.classList.contains("my-theme")).toBe(true);

      themed.destroy();
    });

    it("forwards the class to the adapter overlay and clears it on destroy", () => {
      const adapter = new OverlayClassSpyAdapter();
      const themed = new FormulaBuilder({ rootEl: themedRoot, adapter, className: "my-theme" });

      expect(adapter.overlayClassNameCalls).toEqual(["my-theme"]);

      themed.destroy();

      expect(adapter.overlayClassNameCalls).toEqual(["my-theme", null]);
    });

    it("does not touch the adapter overlay class when no className is given", () => {
      const adapter = new OverlayClassSpyAdapter();
      const plain = new FormulaBuilder({ rootEl: themedRoot, adapter });

      plain.destroy();

      expect(adapter.overlayClassNameCalls).toEqual([]);
    });
  });

  describe("popups config", () => {
    it("hides close buttons on all three popups when popups.showClose is false", () => {
      const rootEl2 = document.createElement("div");
      document.body.appendChild(rootEl2);
      const scoped = new FormulaBuilder({ rootEl: rootEl2, popups: { showClose: false } });

      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (scoped.editor as any).suggestions.show([{ value: "SUM" }], {
        left: 0,
        top: 0,
        height: 20,
        width: 100,
      });
      expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (scoped.editor as any).suggestions.close();

      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (scoped.editor as any).fnHelp.show({ name: "SUM", params: [], repeatLast: 0 }, 0, {
        left: 0,
        top: 0,
        height: 20,
        width: 100,
      });
      expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();
      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (scoped.editor as any).fnHelp.close();

      const cell = document.createElement("td");
      rootEl2.appendChild(cell);
      scoped.markCell(cell, { type: "REF", value: "#REF!" });
      cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(document.body.querySelector(sel(CN.popupClose))).toBeNull();

      scoped.destroy();
      rootEl2.remove();
    });
  });

  describe("icons", () => {
    function customIcon(name: string): () => Element {
      return () => {
        const icon = document.createElement("i");

        icon.dataset.icon = name;

        return icon;
      };
    }

    it("renders host-supplied icons in the popups and the formula bar", () => {
      const iconRoot = document.createElement("div");
      const barHost = document.createElement("div");
      document.body.append(iconRoot, barHost);
      const iconBuilder = new FormulaBuilder({
        rootEl: iconRoot,
        formulaBarContainer: barHost,
        popups: { showClose: true },
        icons: {
          close: customIcon("close"),
          externalLink: customIcon("externalLink"),
          namedExpression: customIcon("namedExpression"),
          function: customIcon("function"),
        },
      });

      expect(barHost.querySelector(`.${CN.formulaBarFxIcon}`)?.getAttribute("data-icon")).toBe(
        "function",
      );

      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (iconBuilder.editor as any).suggestions.show([{ value: "Rate", kind: "named" }], {
        left: 0,
        top: 0,
        height: 20,
        width: 100,
      });
      expect(
        document.body.querySelector(sel(CN.suggestionsItem))?.querySelector("i")?.dataset.icon,
      ).toBe("namedExpression");
      expect(
        document.body.querySelector(sel(CN.popupClose))?.querySelector("i")?.dataset.icon,
      ).toBe("close");
      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (iconBuilder.editor as any).suggestions.close();

      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (iconBuilder.editor as any).fnHelp.show(
        { name: "SUM", params: [], repeatLast: 0, docUrl: "https://example.com/sum" },
        0,
        { left: 0, top: 0, height: 20, width: 100 },
      );
      expect(
        document.body.querySelector(sel(CN.fnHelpLearnMore))?.querySelector("i")?.dataset.icon,
      ).toBe("externalLink");
      // biome-ignore lint/suspicious/noExplicitAny: accessing private field for test assertion
      (iconBuilder.editor as any).fnHelp.close();

      const cell = document.createElement("td");
      iconRoot.appendChild(cell);
      iconBuilder.markCell(cell, { type: "REF", value: "#REF!" });
      cell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      expect(
        document.body.querySelector(sel(CN.popupClose))?.querySelector("i")?.dataset.icon,
      ).toBe("close");

      iconBuilder.destroy();
      iconRoot.remove();
      barHost.remove();
    });
  });

  describe("formula bar attach/detach", () => {
    let barHost: HTMLDivElement;

    beforeEach(() => {
      barHost = document.createElement("div");
      document.body.appendChild(barHost);
    });

    it("attachFormulaBar mounts the bar into the container", () => {
      builder.attachFormulaBar(barHost);

      expect(builder.hasFormulaBar).toBe(true);
      expect(barHost.classList.contains(CN.formulaBar)).toBe(true);
    });

    it("attachFormulaBar throws on an unresolvable selector", () => {
      expect(() => builder.attachFormulaBar("#missing")).toThrow(/not found/);
    });

    it("attach replaces an existing bar", () => {
      const secondHost = document.createElement("div");

      document.body.appendChild(secondHost);
      builder.attachFormulaBar(barHost);
      builder.attachFormulaBar(secondHost);

      expect(barHost.classList.contains(CN.formulaBar)).toBe(false);
      expect(secondHost.classList.contains(CN.formulaBar)).toBe(true);
    });

    it("detachFormulaBar removes the bar", () => {
      builder.attachFormulaBar(barHost);
      builder.detachFormulaBar();

      expect(builder.hasFormulaBar).toBe(false);
      expect(barHost.classList.contains(CN.formulaBar)).toBe(false);
    });

    it("detachFormulaBar is a no-op when no bar is attached", () => {
      expect(() => builder.detachFormulaBar()).not.toThrow();
      expect(builder.hasFormulaBar).toBe(false);
    });

    it("constructor formulaBarContainer delegates to attachFormulaBar", () => {
      const ctorBuilder = new FormulaBuilder({ rootEl, formulaBarContainer: barHost });

      expect(ctorBuilder.hasFormulaBar).toBe(true);

      ctorBuilder.destroy();
    });

    it("destroy detaches an attached bar", () => {
      const localRoot = document.createElement("div");

      document.body.appendChild(localRoot);

      const localBuilder = new FormulaBuilder({ rootEl: localRoot });

      localBuilder.attachFormulaBar(barHost);
      localBuilder.destroy();

      expect(barHost.classList.contains(CN.formulaBar)).toBe(false);
    });

    it("restores inline-edit-start handling after detach", () => {
      const adapter = new InlineStartAdapter();
      const localBuilder = new FormulaBuilder({ rootEl, adapter });
      const mount = document.createElement("div");

      document.body.appendChild(mount);
      localBuilder.attachFormulaBar(barHost);
      localBuilder.detachFormulaBar();
      adapter.emitInlineEditStart(mount, "=A1");

      expect(mount.querySelector("textarea")).not.toBeNull();

      localBuilder.destroy();
    });

    it("attach and detach are no-ops after destroy", () => {
      const localRoot = document.createElement("div");

      document.body.appendChild(localRoot);

      const localBuilder = new FormulaBuilder({ rootEl: localRoot });

      localBuilder.destroy();

      expect(() => localBuilder.attachFormulaBar(barHost)).not.toThrow();
      expect(localBuilder.hasFormulaBar).toBe(false);
      expect(() => localBuilder.detachFormulaBar()).not.toThrow();
    });
  });

  describe("popup hosts", () => {
    function makeSlot(id?: string): HTMLElement {
      const slot = document.createElement("aside");

      if (id !== undefined) {
        slot.id = id;
      }

      document.body.appendChild(slot);

      return slot;
    }

    it("attachSuggestionsHost moves the suggestions popup root into the host", () => {
      const slot = makeSlot();

      builder.attachSuggestionsHost(slot);

      expect(slot.querySelector(sel(CN.suggestions))).not.toBeNull();
    });

    it("attachFnHelpHost moves the fn-help popup root into the host", () => {
      const slot = makeSlot();

      builder.attachFnHelpHost(slot);

      expect(slot.querySelector(sel(CN.fnHelp))).not.toBeNull();
    });

    it("hosted popups carry the builder className and drop it on detach", () => {
      const slot = makeSlot();
      const themedBuilder = new FormulaBuilder({ rootEl, className: "acme-theme" });

      themedBuilder.attachSuggestionsHost(slot);
      themedBuilder.attachFnHelpHost(slot);

      const suggestionsRoot = slot.querySelector<HTMLElement>(sel(CN.suggestions));
      const fnHelpRoot = slot.querySelector<HTMLElement>(sel(CN.fnHelp));
      expect(suggestionsRoot?.classList.contains("acme-theme")).toBe(true);
      expect(fnHelpRoot?.classList.contains("acme-theme")).toBe(true);

      themedBuilder.detachSuggestionsHost();
      themedBuilder.detachFnHelpHost();

      expect(suggestionsRoot?.classList.contains("acme-theme")).toBe(false);
      expect(fnHelpRoot?.classList.contains("acme-theme")).toBe(false);
      themedBuilder.destroy();
    });

    it("resolves a selector string", () => {
      makeSlot("suggestions-slot");

      builder.attachSuggestionsHost("#suggestions-slot");

      expect(document.querySelector(`#suggestions-slot ${sel(CN.suggestions)}`)).not.toBeNull();
    });

    it("throws when the selector matches nothing", () => {
      expect(() => builder.attachSuggestionsHost("#missing")).toThrow(
        'FormulaBuilder: suggestions host "#missing" not found',
      );
      expect(() => builder.attachFnHelpHost("#missing")).toThrow(
        'FormulaBuilder: fnHelp host "#missing" not found',
      );
    });

    it("detach returns the popup root to the portal", () => {
      const slot = makeSlot();

      builder.attachSuggestionsHost(slot);
      builder.detachSuggestionsHost();

      expect(slot.querySelector(sel(CN.suggestions))).toBeNull();
      expect(
        document.querySelector(`${sel(CN.popupPortal)} ${sel(CN.suggestions)}`),
      ).not.toBeNull();
    });

    it("is a no-op after destroy", () => {
      const slot = makeSlot();

      builder.destroy();

      expect(() => builder.attachSuggestionsHost(slot)).not.toThrow();
      expect(() => builder.detachSuggestionsHost()).not.toThrow();
      expect(slot.querySelector(sel(CN.suggestions))).toBeNull();
      builder = new FormulaBuilder({ rootEl });
    });

    it("constructor falls back to the default placement when a selector matches nothing", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const scoped = new FormulaBuilder({
        rootEl,
        popups: { suggestions: { container: "#missing" }, fnHelp: { container: "#missing" } },
        formulaBarContainer: "#missing",
      });

      expect(scoped.hasFormulaBar).toBe(false);
      expect(warn.mock.calls.map(([message]) => message)).toEqual([
        'FormulaBuilder: suggestions host "#missing" not found; using the default placement',
        'FormulaBuilder: fnHelp host "#missing" not found; using the default placement',
        'FormulaBuilder: formulaBarContainer "#missing" not found; using the default placement',
      ]);

      scoped.destroy();
      warn.mockRestore();
    });

    it("constructor warns only once per missing selector", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const options = { rootEl, popups: { suggestions: { container: "#gone-once" } } };

      new FormulaBuilder(options).destroy();
      new FormulaBuilder(options).destroy();

      expect(warn).toHaveBeenCalledOnce();
      warn.mockRestore();
    });

    it("popups.*.container constructor options delegate to attach", () => {
      const suggestionsSlot = makeSlot();
      const fnHelpSlot = makeSlot();
      const sugarBuilder = new FormulaBuilder({
        rootEl,
        popups: {
          suggestions: { container: suggestionsSlot },
          fnHelp: { container: fnHelpSlot },
        },
      });

      expect(suggestionsSlot.querySelector(sel(CN.suggestions))).not.toBeNull();
      expect(fnHelpSlot.querySelector(sel(CN.fnHelp))).not.toBeNull();
      sugarBuilder.destroy();
    });
  });

  describe("commit error announcements", () => {
    let host: HTMLDivElement;
    let mount: HTMLDivElement;
    let engine: FakeCommitEngine;
    let adapter: TestGridAdapter;
    let scoped: FormulaBuilder;

    beforeEach(() => {
      vi.useFakeTimers();
      host = document.createElement("div");
      mount = document.createElement("div");
      document.body.append(host, mount);
      engine = new FakeCommitEngine();
      adapter = new TestGridAdapter({ active: { sheet: "", row: 0, col: 0 } });
    });

    afterEach(() => {
      scoped.destroy();
      host.remove();
      mount.remove();
      vi.useRealTimers();
    });

    function liveRegionText(): string {
      vi.runAllTimers();

      const regions = document.querySelectorAll(sel(CN.liveRegion));

      return regions[regions.length - 1]?.textContent ?? "";
    }

    function commitViaEditor(formula: string, onCommit: () => void): void {
      scoped = new FormulaBuilder({
        rootEl: host,
        adapter,
        hyperformula: engine as never,
        onCommit,
      });
      scoped.openEditor(mount, formula);
      press(mount, "Enter");
    }

    function commitViaOutsideClick(formula: string, onCommit: () => void): void {
      scoped = new FormulaBuilder({
        rootEl: host,
        adapter,
        hyperformula: engine as never,
        onCommit,
      });
      scoped.openEditor(mount, formula);
      adapter.fireOutsideCellClick({ sheet: "", row: 4, col: 2 });
    }

    it("announces the committed cell's error through the live region", () => {
      commitViaEditor("=SUM(", () => {
        engine.setCellValue(0, 0, { type: "NA", value: "#N/A", message: "value not found" });
      });

      expect(liveRegionText()).toBe("Error in A1: #N/A — value not found.");
    });

    it("appends a dependent-error count when the commit breaks other cells", () => {
      commitViaEditor("=1/0", () => {
        engine.setCellValue(0, 0, {
          type: "DIV_BY_ZERO",
          value: "#DIV/0!",
          message: "division by zero",
        });
        engine.emitValuesUpdated([
          {
            address: { sheet: 0, row: 0, col: 0 },
            newValue: { type: "DIV_BY_ZERO", value: "#DIV/0!" },
          },
          {
            address: { sheet: 0, row: 1, col: 0 },
            newValue: { type: "DIV_BY_ZERO", value: "#DIV/0!" },
          },
          {
            address: { sheet: 0, row: 2, col: 0 },
            newValue: { type: "DIV_BY_ZERO", value: "#DIV/0!" },
          },
          {
            address: { sheet: 0, row: 3, col: 0 },
            newValue: { type: "DIV_BY_ZERO", value: "#DIV/0!" },
          },
        ]);
      });

      expect(liveRegionText()).toBe(
        "Error in A1: #DIV/0! — division by zero. 3 more cells now contain errors.",
      );
    });

    it("announces only the dependent count when the committed cell itself is clean", () => {
      commitViaEditor("=0", () => {
        engine.setCellValue(0, 0, 0);
        engine.emitValuesUpdated([
          {
            address: { sheet: 0, row: 1, col: 0 },
            newValue: { type: "DIV_BY_ZERO", value: "#DIV/0!" },
          },
        ]);
      });

      expect(liveRegionText()).toBe("1 more cell now contains an error.");
    });

    it("announces nothing on a fully clean commit", () => {
      commitViaEditor("=1+1", () => {
        engine.setCellValue(0, 0, 2);
      });

      expect(liveRegionText()).toBe("");
    });

    it("announces the committed cell's error when committed via an outside click, not only via Enter", () => {
      commitViaOutsideClick("=SUM(", () => {
        engine.setCellValue(0, 0, { type: "NA", value: "#N/A", message: "value not found" });
      });

      expect(liveRegionText()).toBe("Error in A1: #N/A — value not found.");
    });
  });
});

class DestroyedEngine implements HyperFormulaLike {
  private destroyed = false;

  on(): void {}

  off(): void {
    if (this.destroyed) {
      throw new TypeError("Cannot read properties of undefined (reading 'off')");
    }
  }

  destroy(): void {
    this.destroyed = true;
  }
}

class FailingOverlayAdapter extends NullAdapter {
  override setOverlayClassName(className: string | null): void {
    if (className === null) {
      throw new Error("overlay already gone");
    }
  }
}

describe("FormulaBuilder teardown", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function leftovers() {
    return {
      portal: document.querySelector(sel(CN.popupPortal)),
      liveRegion: document.querySelector(sel(CN.liveRegion)),
      styles: document.head.querySelector("style[data-hfe-styles]"),
    };
  }

  it("does not throw when the host destroyed the engine first", () => {
    const engine = new DestroyedEngine();
    const builder = new FormulaBuilder({ rootEl: document.body, hyperformula: engine });

    engine.destroy();

    expect(() => builder.destroy()).not.toThrow();
    expect(leftovers()).toEqual({ portal: null, liveRegion: null, styles: null });
  });

  it("finishes every teardown step when one throws, then rethrows the error", () => {
    const builder = new FormulaBuilder({
      rootEl: document.body,
      adapter: new FailingOverlayAdapter(),
      className: "host-theme",
    });

    expect(() => builder.destroy()).toThrow("overlay already gone");
    expect(leftovers()).toEqual({ portal: null, liveRegion: null, styles: null });
  });
});

class FillAdapter extends NullAdapter {
  readonly fills: string[] = [];

  commitFill(value: string): void {
    this.fills.push(value);
  }
}

describe("FormulaBuilder fill commit", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function pressCtrlEnter(mount: HTMLElement): void {
    press(mount, "Enter", { ctrlKey: true });
  }

  it("commits Ctrl+Enter to every selected cell through the adapter", () => {
    const adapter = new FillAdapter();
    const builder = new FormulaBuilder({ rootEl: document.body, adapter });
    const mount = document.createElement("div");

    builder.openEditor(mount, "=A1");
    pressCtrlEnter(mount);

    expect(adapter.fills).toEqual(["=A1"]);
    builder.destroy();
  });

  it("prefers the onCommitFill option over the adapter", () => {
    const adapter = new FillAdapter();
    const onCommitFill = vi.fn();
    const builder = new FormulaBuilder({ rootEl: document.body, adapter, onCommitFill });
    const mount = document.createElement("div");

    builder.openEditor(mount, "=A1");
    pressCtrlEnter(mount);

    expect(onCommitFill).toHaveBeenCalledWith("=A1");
    expect(adapter.fills).toEqual([]);
    builder.destroy();
  });

  it("inserts a newline on Ctrl+Enter when the adapter cannot fill", () => {
    const builder = new FormulaBuilder({ rootEl: document.body, adapter: new NullAdapter() });
    const mount = document.createElement("div");

    builder.openEditor(mount, "=A1");
    pressCtrlEnter(mount);

    expect(builder.editor.getValue()).toBe("=A1\n");
    builder.destroy();
  });
});

describe("FormulaBuilder document and portal parent", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  function shadowHost(): ShadowRoot {
    const hostEl = document.createElement("div");

    document.body.appendChild(hostEl);

    return hostEl.attachShadow({ mode: "open" });
  }

  it("puts the popup portal, the live region and the styles into a shadow root", () => {
    const shadow = shadowHost();
    const rootEl = document.createElement("div");

    shadow.appendChild(rootEl);

    const builder = new FormulaBuilder({ rootEl, portalParent: shadow });

    expect(shadow.querySelector(sel(CN.popupPortal))).not.toBeNull();
    expect(shadow.querySelector(sel(CN.liveRegion))).not.toBeNull();
    expect(shadow.querySelector("style[data-hfe-styles]")).not.toBeNull();
    expect(document.body.querySelector(sel(CN.popupPortal))).toBeNull();
    expect(document.body.querySelector(sel(CN.liveRegion))).toBeNull();

    builder.destroy();

    expect(shadow.querySelector(sel(CN.popupPortal))).toBeNull();
    expect(shadow.querySelector(sel(CN.liveRegion))).toBeNull();
    expect(shadow.querySelector("style[data-hfe-styles]")).toBeNull();
  });

  it("keeps the popups in the editor's shadow root, so their ids resolve from it", () => {
    const shadow = shadowHost();
    const rootEl = document.createElement("div");
    const mount = document.createElement("div");

    shadow.append(rootEl, mount);

    const builder = new FormulaBuilder({ rootEl, portalParent: shadow });

    builder.openEditor(mount, "=SUM(A1)");

    const textareaRoot = mount.querySelector("textarea")?.getRootNode();
    const suggestions = shadow.querySelector(sel(CN.suggestions));
    const errorPopup = shadow.querySelector(sel(CN.errorPopup));

    expect(textareaRoot).toBe(shadow);
    expect(suggestions?.getRootNode()).toBe(shadow);
    expect(errorPopup?.id).toBeTruthy();
    expect(shadow.getElementById(errorPopup?.id ?? "")).toBe(errorPopup);

    builder.destroy();
  });

  it("takes the document from the portal parent when only the portal parent is given", () => {
    const frameDocument = document.implementation.createHTMLDocument("grid");
    const rootEl = frameDocument.createElement("div");

    frameDocument.body.appendChild(rootEl);

    const builder = new FormulaBuilder({ rootEl, portalParent: frameDocument.body });

    expect(frameDocument.head.querySelector("style[data-hfe-styles]")).not.toBeNull();
    expect(frameDocument.body.querySelector(sel(CN.popupPortal))).not.toBeNull();

    builder.destroy();

    expect(frameDocument.head.querySelector("style[data-hfe-styles]")).toBeNull();
  });

  it("creates its elements in, and resolves selectors against, the given document", () => {
    const frameDocument = document.implementation.createHTMLDocument("grid");
    const barEl = frameDocument.createElement("div");

    barEl.id = "bar";
    frameDocument.body.appendChild(barEl);

    const rootEl = frameDocument.createElement("div");

    frameDocument.body.appendChild(rootEl);

    const builder = new FormulaBuilder({
      rootEl,
      rootDocument: frameDocument,
      formulaBarContainer: "#bar",
    });

    expect(builder.hasFormulaBar).toBe(true);
    expect(frameDocument.body.querySelector(sel(CN.popupPortal))).not.toBeNull();
    expect(frameDocument.body.querySelector(sel(CN.liveRegion))).not.toBeNull();
    expect(frameDocument.head.querySelector("style[data-hfe-styles]")).not.toBeNull();
    expect(document.body.querySelector(sel(CN.popupPortal))).toBeNull();

    builder.destroy();

    expect(frameDocument.head.querySelector("style[data-hfe-styles]")).toBeNull();
  });
});
