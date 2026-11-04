import { CN } from "../../theme/classNames";
import { clear, createEl, createIcon } from "../dom";
import type { IconsOptions, Phrases } from "../types";
import { BasePopup } from "./basePopup";
import type { AnchorRect, SuggestionItem, SuggestionsHandlers, SuggestionsOptions } from "./types";

const DATA_IDX = "data-idx";

let listboxIdCounter = 0;

export function orderSuggestionItems(items: SuggestionItem[], prefix: string): SuggestionItem[] {
  if (!prefix) {
    return items;
  }

  const upperPrefix = prefix.toUpperCase();
  const prefixMatches: SuggestionItem[] = [];
  const substringMatches: SuggestionItem[] = [];

  for (const item of items) {
    if (item.value.toUpperCase().startsWith(upperPrefix)) {
      prefixMatches.push(item);
    } else {
      substringMatches.push(item);
    }
  }

  return [...prefixMatches, ...substringMatches];
}

function buildHighlightedText(value: string, prefix: string): (string | HTMLElement)[] {
  if (!prefix) {
    return [value];
  }

  const upperValue = value.toUpperCase();
  const upperPrefix = prefix.toUpperCase();
  const matchIndex = upperValue.indexOf(upperPrefix);

  if (matchIndex === -1) {
    return [value];
  }

  const before = value.slice(0, matchIndex);
  const matched = value.slice(matchIndex, matchIndex + prefix.length);
  const after = value.slice(matchIndex + prefix.length);
  const result: (string | HTMLElement)[] = [];

  if (before) {
    result.push(before);
  }

  result.push(createEl("span", { class: CN.suggestionsMatch }, [matched]));

  if (after) {
    result.push(after);
  }

  return result;
}

interface SuggestionRowMeta {
  kind: SuggestionItem["kind"];
  hasDescription: boolean;
}

export class SuggestionsPopup extends BasePopup {
  private items: SuggestionItem[] = [];
  private activeIndex = 0;
  private prefix = "";
  private lastMouseX = -1;
  private lastMouseY = -1;
  private listEl: HTMLElement | null = null;
  private rowPool: HTMLElement[] = [];
  private rowMeta: SuggestionRowMeta[] = [];
  private readonly handlers: SuggestionsHandlers;
  private readonly options: Required<SuggestionsOptions>;
  private readonly listboxId: string;
  private readonly onListMouseDown = (event: MouseEvent): void => this.handleListMouseDown(event);
  private readonly onListMouseMove = (event: MouseEvent): void => this.handleListMouseMove(event);

  constructor(
    handlers: SuggestionsHandlers,
    options: SuggestionsOptions = {},
    container?: HTMLElement,
    icons?: IconsOptions,
    phrases?: Phrases,
  ) {
    const resolvedOptions: Required<SuggestionsOptions> = {
      showKeyboardHelp: options.showKeyboardHelp ?? true,
      showClose: options.showClose ?? false,
      showNamedExpressions: options.showNamedExpressions ?? true,
    };
    super({
      ...(container !== undefined && { container }),
      showClose: resolvedOptions.showClose,
      onExplicitClose: handlers.onExplicitClose,
      ...(icons !== undefined && { icons }),
      ...(phrases !== undefined && { phrases }),
    });
    listboxIdCounter += 1;
    this.listboxId = `${CN.suggestions}-${listboxIdCounter}`;
    this.handlers = handlers;
    this.options = resolvedOptions;
  }

  private optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  private emitAriaState(): void {
    const expanded = this.isVisible();

    this.handlers.onAriaStateChange?.({
      expanded,
      listboxId: this.listboxId,
      activeOptionId: expanded ? this.optionId(this.activeIndex) : null,
    });
  }

  protected createRoot(): HTMLElement {
    return createEl("div", { class: CN.suggestions, hidden: true });
  }

  protected renderContent(): void {
    this.listEl = createEl("div", {
      class: CN.suggestionsList,
      id: this.listboxId,
      role: "listbox",
      "aria-label": this.phrases.formulaSuggestions,
    });
    this.rowPool = [];
    this.rowMeta = [];
    this.renderListen(this.listEl, "mousedown", this.onListMouseDown);
    this.renderListen(this.listEl, "mousemove", this.onListMouseMove);
    this.syncRows();
    this.root.appendChild(this.listEl);

    if (this.options.showKeyboardHelp) {
      this.root.appendChild(this.renderKbdRow());
    }
  }

  private handleListMouseDown(event: MouseEvent): void {
    const row = (event.target as HTMLElement).closest<HTMLElement>(`.${CN.suggestionsItem}`);
    const index = this.rowIndexOf(row);

    if (index === null) {
      return;
    }

    event.preventDefault();
    this.activeIndex = index;
    this.selectActive();
  }

  private handleListMouseMove(event: MouseEvent): void {
    const { clientX, clientY } = event;

    if (clientX === this.lastMouseX && clientY === this.lastMouseY) {
      return;
    }

    this.lastMouseX = clientX;
    this.lastMouseY = clientY;

    const row = (event.target as HTMLElement).closest<HTMLElement>(`.${CN.suggestionsItem}`);
    const index = this.rowIndexOf(row);

    if (index === null || this.activeIndex === index) {
      return;
    }

    this.activeIndex = index;
    this.updateActive(false);
  }

  private rowIndexOf(row: HTMLElement | null): number | null {
    if (!row) {
      return null;
    }

    const idxAttr = row.getAttribute(DATA_IDX);

    return idxAttr === null ? null : Number(idxAttr);
  }

  private fillLabel(labelEl: HTMLElement, item: SuggestionItem): void {
    clear(labelEl);

    const textContent = buildHighlightedText(item.value, this.prefix);

    if (item.kind === "named") {
      const textEl = createEl("span");
      textEl.append(...textContent);
      labelEl.append(createIcon("namedExpression", this.icons), textEl);
    } else {
      labelEl.append(...textContent);
    }
  }

  private renderLabel(item: SuggestionItem): HTMLSpanElement {
    const labelEl = createEl("span", { class: CN.suggestionsItemLabel });

    this.fillLabel(labelEl, item);

    return labelEl;
  }

  private buildRowChildren(row: HTMLElement, item: SuggestionItem): void {
    clear(row);
    row.appendChild(this.renderLabel(item));

    if (item.description) {
      row.appendChild(
        createEl("span", { class: CN.suggestionsItemDescription }, [item.description]),
      );
    }
  }

  private applyRowState(row: HTMLElement, index: number, item: SuggestionItem): void {
    const isActive = index === this.activeIndex;

    row.classList.toggle(CN.suggestionsItemNamed, item.kind === "named");
    row.classList.toggle(CN.suggestionsItemActive, isActive);
    row.setAttribute("aria-selected", isActive ? "true" : "false");
  }

  private createRow(index: number, item: SuggestionItem): HTMLElement {
    const row = createEl("div", {
      class: CN.suggestionsItem,
      id: this.optionId(index),
      role: "option",
      [DATA_IDX]: index,
    });

    this.buildRowChildren(row, item);
    this.rowMeta[index] = { kind: item.kind, hasDescription: Boolean(item.description) };
    this.applyRowState(row, index, item);

    return row;
  }

  private updateRow(row: HTMLElement, index: number, item: SuggestionItem): void {
    const meta = this.rowMeta[index];
    const nextMeta: SuggestionRowMeta = {
      kind: item.kind,
      hasDescription: Boolean(item.description),
    };

    if (!meta || meta.kind !== nextMeta.kind || meta.hasDescription !== nextMeta.hasDescription) {
      this.buildRowChildren(row, item);
    } else {
      const labelEl = row.querySelector<HTMLElement>(`.${CN.suggestionsItemLabel}`);

      if (labelEl) {
        this.fillLabel(labelEl, item);
      }

      if (item.description) {
        const descEl = row.querySelector<HTMLElement>(`.${CN.suggestionsItemDescription}`);

        if (descEl) {
          descEl.textContent = item.description;
        }
      }
    }

    this.rowMeta[index] = nextMeta;
    this.applyRowState(row, index, item);
  }

  private syncRows(): void {
    if (!this.listEl) {
      return;
    }

    const previousLength = this.rowPool.length;

    while (this.rowPool.length > this.items.length) {
      this.rowPool.pop()?.remove();
      this.rowMeta.pop();
    }

    for (let index = 0; index < Math.min(previousLength, this.items.length); index += 1) {
      const item = this.items[index];
      const row = this.rowPool[index];

      if (item && row) {
        this.updateRow(row, index, item);
      }
    }

    for (let index = this.rowPool.length; index < this.items.length; index += 1) {
      const item = this.items[index];

      if (!item) {
        break;
      }

      const row = this.createRow(index, item);

      this.rowPool.push(row);
      this.listEl.appendChild(row);
    }
  }

  private renderKbdRow(): HTMLDivElement {
    const tabChip = createEl("span", { class: CN.suggestionsKbdChip }, ["Tab"]);
    const upChip = createEl("span", { class: CN.suggestionsKbdChip }, ["↑"]);
    const downChip = createEl("span", { class: CN.suggestionsKbdChip }, ["↓"]);

    return createEl("div", { class: CN.suggestionsKbdRow }, [
      tabChip,
      ` ${this.phrases.acceptSuggestionHint} `,
      upChip,
      downChip,
      ` ${this.phrases.navigateSuggestionsHint}`,
    ]);
  }

  private updateActive(shouldScroll = true): void {
    const listEl = this.root.querySelector<HTMLElement>(`.${CN.suggestionsList}`);

    if (!listEl) {
      return;
    }

    const children = Array.from(listEl.children) as HTMLElement[];

    children.forEach((child, index) => {
      const isActive = index === this.activeIndex;

      child.classList.toggle(CN.suggestionsItemActive, isActive);
      child.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (shouldScroll) {
      this.scrollActiveIntoView();
    }

    this.emitAriaState();
  }

  private scrollActiveIntoView(): void {
    const activeRow = this.root.querySelector<HTMLElement>(`.${CN.suggestionsItemActive}`);

    if (activeRow) {
      activeRow.scrollIntoView({ block: "nearest" });
    }
  }

  get showNamedExpressions(): boolean {
    return this.options.showNamedExpressions;
  }

  show(items: SuggestionItem[], anchor: AnchorRect, prefix = ""): void {
    if (items.length === 0) {
      this.close();
      return;
    }

    this.items = items;
    this.prefix = prefix;

    if (this.isVisible()) {
      this.activeIndex = Math.min(this.activeIndex, items.length - 1);
      this.syncRows();
      this.reposition(anchor);
    } else {
      this.activeIndex = 0;
      this.lastMouseX = -1;
      this.lastMouseY = -1;
      this.open(anchor);
    }

    this.scrollActiveIntoView();
    this.emitAriaState();
  }

  protected override onVisibilityChanged(visible: boolean): void {
    if (!visible) {
      this.listEl = null;
      this.rowPool = [];
      this.rowMeta = [];
      this.emitAriaState();
    }
  }

  move(direction: 1 | -1): void {
    if (!this.isVisible() || this.items.length === 0) {
      return;
    }

    this.activeIndex = (this.activeIndex + direction + this.items.length) % this.items.length;
    this.updateActive();
  }

  selectActive(): void {
    if (!this.isVisible()) {
      return;
    }

    const activeItem = this.items[this.activeIndex];

    if (activeItem !== undefined) {
      this.handlers.onSelect(activeItem);
    }

    this.close();
  }
}
