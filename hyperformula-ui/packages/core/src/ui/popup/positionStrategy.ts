import type { AnchorRect, BoundsRect, Position, PositionStrategy, Viewport } from "./types";

const VIEWPORT_PADDING = 12;

function resolveLimit(viewport: Viewport, bounds?: BoundsRect): BoundsRect {
  if (!bounds || bounds.right - bounds.left <= 0 || bounds.bottom - bounds.top <= 0) {
    return { left: 0, top: 0, right: viewport.width, bottom: viewport.height };
  }

  return {
    left: Math.max(0, bounds.left),
    top: Math.max(0, bounds.top),
    right: Math.min(viewport.width, bounds.right),
    bottom: Math.min(viewport.height, bounds.bottom),
  };
}

export class BottomViewportAnchoredStrategy implements PositionStrategy {
  compute(anchor: AnchorRect, popupRect: DOMRect, viewport: Viewport): Position {
    let left: number;

    if (anchor.direction === "rtl") {
      left = anchor.left + anchor.width - popupRect.width;

      if (left < 0) {
        left = VIEWPORT_PADDING;
      }
    } else {
      left = anchor.left;

      if (left + popupRect.width > viewport.width) {
        left = Math.max(0, viewport.width - popupRect.width - VIEWPORT_PADDING);
      }
    }

    const spaceBelow = Math.max(
      0,
      viewport.height - (anchor.top + anchor.height) - VIEWPORT_PADDING,
    );
    const spaceAbove = Math.max(0, anchor.top - VIEWPORT_PADDING);

    if (popupRect.height <= spaceBelow) {
      return { left, top: anchor.top + anchor.height };
    }

    if (popupRect.height <= spaceAbove) {
      return { left, top: anchor.top - popupRect.height };
    }

    if (spaceBelow >= spaceAbove) {
      return { left, top: anchor.top + anchor.height, maxHeight: spaceBelow };
    }

    return { left, top: VIEWPORT_PADDING, maxHeight: spaceAbove };
  }
}

export class EndViewportAnchoredStrategy implements PositionStrategy {
  compute(
    anchor: AnchorRect,
    popupRect: DOMRect,
    viewport: Viewport,
    bounds?: BoundsRect,
  ): Position {
    const limit = resolveLimit(viewport, bounds);
    const availableWidth = Math.max(0, limit.right - limit.left - VIEWPORT_PADDING * 2);
    const availableHeight = Math.max(0, limit.bottom - limit.top - VIEWPORT_PADDING * 2);
    const width = Math.min(popupRect.width, availableWidth);
    const height = Math.min(popupRect.height, availableHeight);
    let left: number;
    let top = anchor.top;

    if (anchor.direction === "rtl") {
      left = anchor.left - width;

      if (left < limit.left) {
        left = anchor.left + anchor.width;
      }
    } else {
      left = anchor.left + anchor.width;

      if (left + width > limit.right) {
        left = anchor.left - width;
      }
    }

    if (left + width > limit.right) {
      left = limit.right - width - VIEWPORT_PADDING;
    }

    if (left < limit.left) {
      left = limit.left + VIEWPORT_PADDING;
    }

    if (top + height > limit.bottom) {
      top = limit.bottom - height - VIEWPORT_PADDING;
    }

    if (top < limit.top + VIEWPORT_PADDING) {
      top = limit.top + VIEWPORT_PADDING;
    }

    return {
      left,
      top,
      ...(width < popupRect.width ? { maxWidth: width } : {}),
      ...(height < popupRect.height ? { maxHeight: height } : {}),
    };
  }
}
