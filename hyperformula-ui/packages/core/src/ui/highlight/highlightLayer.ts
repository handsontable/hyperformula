import type {
  CellRange,
  GridGeometry,
  RangeHighlight,
  RangeRect,
  Unsubscribe,
} from "../../adapter/types";
import { CN } from "../../theme/classNames";

/**
 * Default color of the ephemeral (in-drag preview) highlight.
 *
 * @category Highlighting
 */
export const EPHEMERAL_COLOR = "hsl(210 80% 55% / 0.9)";

const DEFAULT_LAYER = "default";

/**
 * Derives the translucent fill variant of a highlight border color (hsl and CSS-var inputs).
 *
 * @category Highlighting
 */
export function fillColor(color: string): string {
  const hslMatch = color.match(/^hsl\(([^/)]+)(?:\/\s*[\d.]+)?\)$/);

  if (hslMatch?.[1]) {
    return `hsl(${hslMatch[1].trim()} / 0.12)`;
  }

  if (color.startsWith("var(")) {
    return `color-mix(in srgb, ${color} calc(var(--hfe-selection-opacity) * 100%), transparent)`;
  }

  return color;
}

/**
 * Options for {@link HighlightLayer}.
 *
 * @category Highlighting
 */
export interface HighlightLayerOptions {
  /**
   * Color of the in-drag preview highlight.
   *
   * @defaultValue {@link EPHEMERAL_COLOR}
   */
  ephemeralColor?: string;

  /** Fires after every render with the current highlight sets (e.g. for header styling). */
  onRender?: (persistent: RangeHighlight[], ephemeral: RangeHighlight | null) => void;
}

interface Placement {
  rect: RangeRect;
  color: string;
  fill: boolean;
}

interface LayerGroup {
  element: HTMLDivElement;
  pool: HTMLDivElement[];
}

/**
 * Range-highlight DOM layer consumed by adapters and `DomRangePicker`: draws persistent and
 * ephemeral highlights into the host's overlay via a `GridGeometry`, repositioning on
 * viewport changes.
 *
 * @category Highlighting
 */
export class HighlightLayer {
  private readonly geometry: GridGeometry;
  private readonly ephemeralColor: string;
  private persistent: RangeHighlight[] = [];
  private ephemeral: RangeHighlight | null = null;
  private sharedClassName: string | null = null;
  private readonly groups = new Map<number | typeof DEFAULT_LAYER, LayerGroup>();
  private readonly persistentByLayer = new Map<number | typeof DEFAULT_LAYER, Placement[]>();
  private ephemeralLayerKeys = new Set<number | typeof DEFAULT_LAYER>();
  private rafHandle: number | null = null;
  private readonly styledHeaderEls = new Set<HTMLElement>();
  private readonly unsubscribe: Unsubscribe;
  private readonly onRender:
    | ((persistent: RangeHighlight[], ephemeral: RangeHighlight | null) => void)
    | undefined;

  constructor(geometry: GridGeometry, opts: HighlightLayerOptions = {}) {
    this.geometry = geometry;
    this.ephemeralColor = opts.ephemeralColor ?? EPHEMERAL_COLOR;
    this.onRender = opts.onRender;
    this.unsubscribe = geometry.onViewportChange(() => this.scheduleReposition());
  }

  private ensureGroup(key: number | typeof DEFAULT_LAYER): LayerGroup {
    const existing = this.groups.get(key);

    if (existing) {
      return existing;
    }

    const element = document.createElement("div");

    element.setAttribute("aria-hidden", "true");
    element.className = CN.highlight;

    if (this.sharedClassName !== null) {
      element.classList.add(this.sharedClassName);
    }

    if (key !== DEFAULT_LAYER) {
      element.style.zIndex = String(key);
    }

    this.geometry.getOverlayHost().appendChild(element);
    const group: LayerGroup = { element, pool: [] };

    this.groups.set(key, group);

    return group;
  }

  private applyClips(groups: Iterable<LayerGroup>): void {
    const groupList = [...groups];

    if (groupList.length === 0 || !this.geometry.getViewportClip) {
      return;
    }

    const clip = this.geometry.getViewportClip();

    if (!clip) {
      for (const group of groupList) {
        group.element.style.clipPath = "";
      }

      return;
    }

    const sizes = groupList.map((group) => ({
      width: group.element.offsetWidth,
      height: group.element.offsetHeight,
    }));

    groupList.forEach((group, index) => {
      const size = sizes[index];

      if (!size) {
        return;
      }

      const right = size.width - (clip.left + clip.width);
      const bottom = size.height - (clip.top + clip.height);

      group.element.style.clipPath = `inset(${clip.top}px ${right}px ${bottom}px ${clip.left}px)`;
    });
  }

  private scheduleReposition(): void {
    if (this.rafHandle !== null) {
      return;
    }

    this.rafHandle = requestAnimationFrame(() => {
      this.rafHandle = null;
      this.render();
    });
  }

  private render(): void {
    this.recomputePersistentByLayer();

    const ephemeralByLayer = this.computeEphemeralByLayer();
    const byLayer = this.mergeByLayer(ephemeralByLayer);

    for (const [key, group] of this.groups) {
      if (!byLayer.has(key)) {
        group.element.remove();
        this.groups.delete(key);
      }
    }

    const resolvedGroups = new Map<number | typeof DEFAULT_LAYER, LayerGroup>();

    for (const key of byLayer.keys()) {
      resolvedGroups.set(key, this.ensureGroup(key));
    }

    this.applyClips(resolvedGroups.values());

    for (const [key, placements] of byLayer) {
      const group = resolvedGroups.get(key);

      if (group) {
        this.syncGroup(group, placements);
      }
    }

    this.ephemeralLayerKeys = new Set(ephemeralByLayer.keys());
    this.renderHeaders();
    this.onRender?.(this.persistent, this.ephemeral);
  }

  private renderEphemeralOnly(): void {
    const ephemeralByLayer = this.computeEphemeralByLayer();
    const keys = new Set([...this.ephemeralLayerKeys, ...ephemeralByLayer.keys()]);
    const placementsByGroup = new Map<LayerGroup, Placement[]>();

    for (const key of keys) {
      const persistentPlacements = this.persistentByLayer.get(key) ?? [];
      const ephemeralPlacements = ephemeralByLayer.get(key) ?? [];
      const combined = ephemeralPlacements.length
        ? persistentPlacements.concat(ephemeralPlacements)
        : persistentPlacements;

      if (combined.length === 0) {
        const group = this.groups.get(key);

        if (group) {
          group.element.remove();
          this.groups.delete(key);
        }

        continue;
      }

      placementsByGroup.set(this.ensureGroup(key), combined);
    }

    this.applyClips(placementsByGroup.keys());

    for (const [group, placements] of placementsByGroup) {
      this.syncGroup(group, placements);
    }

    this.ephemeralLayerKeys = new Set(ephemeralByLayer.keys());
    this.renderHeaders();
    this.onRender?.(this.persistent, this.ephemeral);
  }

  private recomputePersistentByLayer(): void {
    this.persistentByLayer.clear();

    for (const [key, placements] of this.groupByLayer(this.placementsFor(this.persistent))) {
      this.persistentByLayer.set(key, placements);
    }
  }

  private computeEphemeralByLayer(): Map<number | typeof DEFAULT_LAYER, Placement[]> {
    return this.groupByLayer(this.placementsFor(this.ephemeral ? [this.ephemeral] : [], true));
  }

  private groupByLayer(placements: Placement[]): Map<number | typeof DEFAULT_LAYER, Placement[]> {
    const byLayer = new Map<number | typeof DEFAULT_LAYER, Placement[]>();

    for (const placement of placements) {
      const key = placement.rect.zIndex ?? DEFAULT_LAYER;
      const bucket = byLayer.get(key);

      if (bucket) {
        bucket.push(placement);
      } else {
        byLayer.set(key, [placement]);
      }
    }

    return byLayer;
  }

  private mergeByLayer(
    ephemeralByLayer: Map<number | typeof DEFAULT_LAYER, Placement[]>,
  ): Map<number | typeof DEFAULT_LAYER, Placement[]> {
    const keys = new Set([...this.persistentByLayer.keys(), ...ephemeralByLayer.keys()]);
    const merged = new Map<number | typeof DEFAULT_LAYER, Placement[]>();

    for (const key of keys) {
      const persistentPlacements = this.persistentByLayer.get(key) ?? [];
      const ephemeralPlacements = ephemeralByLayer.get(key) ?? [];

      merged.set(
        key,
        ephemeralPlacements.length
          ? persistentPlacements.concat(ephemeralPlacements)
          : persistentPlacements,
      );
    }

    return merged;
  }

  private renderHeaders(): void {
    for (const el of this.styledHeaderEls) {
      el.style.backgroundColor = "";
    }

    this.styledHeaderEls.clear();

    if (!this.geometry.getColHeaderEl && !this.geometry.getRowHeaderEl) {
      return;
    }

    for (const item of this.persistent) {
      if (!item.whole) {
        continue;
      }

      const bg = fillColor(item.color);

      if (item.whole === "column" && this.geometry.getColHeaderEl) {
        for (let col = item.range.start.col; col <= item.range.end.col; col++) {
          const el = this.geometry.getColHeaderEl(col);

          if (el) {
            el.style.backgroundColor = bg;
            this.styledHeaderEls.add(el);
          }
        }
      } else if (item.whole === "row" && this.geometry.getRowHeaderEl) {
        for (let row = item.range.start.row; row <= item.range.end.row; row++) {
          const el = this.geometry.getRowHeaderEl(row);

          if (el) {
            el.style.backgroundColor = bg;
            this.styledHeaderEls.add(el);
          }
        }
      }
    }
  }

  private placementsFor(items: RangeHighlight[], fillDefault = false): Placement[] {
    const placements: Placement[] = [];

    for (const item of items) {
      for (const rect of this.geometry.getRangeRects(item.range)) {
        placements.push({ rect, color: item.color, fill: item.fill ?? fillDefault });
      }
    }

    return placements;
  }

  private syncGroup(group: LayerGroup, placements: Placement[]): void {
    while (group.pool.length < placements.length) {
      group.pool.push(this.createDiv(group.element));
    }

    while (group.pool.length > placements.length) {
      const element = group.pool.pop();

      element?.parentNode?.removeChild(element);
    }

    placements.forEach((placement, index) => {
      const element = group.pool[index];

      if (element) {
        this.positionDiv(element, placement);
      }
    });
  }

  private positionDiv(element: HTMLDivElement, placement: Placement): void {
    const { rect, color, fill } = placement;

    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.borderColor = color;
    element.style.backgroundColor = fill ? fillColor(color) : "transparent";
    element.style.display = "block";
  }

  private createDiv(groupEl: HTMLDivElement): HTMLDivElement {
    const div = document.createElement("div");

    div.className = CN.highlightItem;
    groupEl.appendChild(div);

    return div;
  }

  /** Applies the consumer's theming class to every layer element; `null` clears it. */
  setClassName(className: string | null): void {
    if (this.sharedClassName === className) {
      return;
    }

    for (const group of this.groups.values()) {
      if (this.sharedClassName !== null) {
        group.element.classList.remove(this.sharedClassName);
      }

      if (className !== null) {
        group.element.classList.add(className);
      }
    }

    this.sharedClassName = className;
  }

  /** Replaces the persistent highlight set and re-renders. */
  setHighlights(items: RangeHighlight[]): void {
    this.persistent = items;
    this.render();
  }

  /**
   * Draws (or clears, with `null`) the ephemeral preview highlight. Re-renders only the
   * ephemeral group — persistent-highlight rects are reused from the last full render — unless
   * a viewport reposition is still pending, in which case it absorbs that pending frame with a
   * full render so persistent rects don't paint at stale geometry.
   */
  setEphemeral(range: CellRange | null, color?: string): void {
    this.ephemeral = range ? { range, color: color ?? this.ephemeralColor } : null;

    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
      this.render();

      return;
    }

    this.renderEphemeralOnly();
  }

  /** Clears both persistent and ephemeral highlights. */
  clear(): void {
    this.persistent = [];
    this.ephemeral = null;
    this.render();
  }

  /** Removes every layer element, header style, and the viewport subscription. */
  destroy(): void {
    if (this.rafHandle !== null) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = null;
    }

    this.unsubscribe();

    for (const el of this.styledHeaderEls) {
      el.style.backgroundColor = "";
    }

    this.styledHeaderEls.clear();

    for (const group of this.groups.values()) {
      group.element.remove();
    }

    this.groups.clear();
    this.persistentByLayer.clear();
    this.ephemeralLayerKeys.clear();
    this.persistent = [];
    this.ephemeral = null;
  }

  /** Re-applies header highlight styles (e.g. after the host re-renders its headers). */
  rerenderHeaders(): void {
    this.renderHeaders();
  }
}
