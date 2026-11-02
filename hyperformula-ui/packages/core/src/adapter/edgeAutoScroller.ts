const AUTO_SCROLL_MAX_STEP = 24;
const AUTO_SCROLL_FACTOR = 0.25;
const POINTER_CLAMP_INSET = 2;

/**
 * Options for {@link EdgeAutoScroller}.
 *
 * @category Grid Adapter
 */
export interface EdgeAutoScrollerOptions {
  /** Scroll container to autoscroll; `null` disables scrolling. */
  getScrollElement(): HTMLElement | null;

  /** Fires after each scroll step with the pointer clamped inside the container. */
  onStep(clampedX: number, clampedY: number): void;
}

/**
 * Drag-past-edge autoscroll primitive: pointer overshoot beyond the scroll container becomes
 * clamped requestAnimationFrame scroll steps until the pointer returns or scrolling stops.
 *
 * @category Grid Adapter
 */
export class EdgeAutoScroller {
  private pointer: { x: number; y: number } | null = null;
  private frameHandle = 0;

  constructor(private readonly opts: EdgeAutoScrollerOptions) {}

  private clampStep(overshoot: number): number {
    const step = overshoot * AUTO_SCROLL_FACTOR;

    return Math.min(Math.max(step, -AUTO_SCROLL_MAX_STEP), AUTO_SCROLL_MAX_STEP);
  }

  private scheduleFrame(): void {
    if (this.frameHandle) {
      return;
    }

    this.frameHandle = requestAnimationFrame(() => {
      this.frameHandle = 0;
      this.step();
    });
  }

  private step(): void {
    const scrollElement = this.opts.getScrollElement();
    const pointer = this.pointer;

    if (!scrollElement || !pointer) {
      this.stop();

      return;
    }

    const rect = scrollElement.getBoundingClientRect();
    const overshootX =
      pointer.x < rect.left
        ? pointer.x - rect.left
        : pointer.x > rect.right
          ? pointer.x - rect.right
          : 0;
    const overshootY =
      pointer.y < rect.top
        ? pointer.y - rect.top
        : pointer.y > rect.bottom
          ? pointer.y - rect.bottom
          : 0;

    if (overshootX === 0 && overshootY === 0) {
      this.stop();

      return;
    }

    const beforeLeft = scrollElement.scrollLeft;
    const beforeTop = scrollElement.scrollTop;

    scrollElement.scrollLeft += this.clampStep(overshootX);
    scrollElement.scrollTop += this.clampStep(overshootY);

    const moved = scrollElement.scrollLeft !== beforeLeft || scrollElement.scrollTop !== beforeTop;

    const clientLeft = rect.left + scrollElement.clientLeft;
    const clientTop = rect.top + scrollElement.clientTop;
    const clampedX = Math.min(
      Math.max(pointer.x, clientLeft + POINTER_CLAMP_INSET),
      clientLeft + scrollElement.clientWidth - POINTER_CLAMP_INSET,
    );
    const clampedY = Math.min(
      Math.max(pointer.y, clientTop + POINTER_CLAMP_INSET),
      clientTop + scrollElement.clientHeight - POINTER_CLAMP_INSET,
    );

    this.opts.onStep(clampedX, clampedY);

    if (moved) {
      this.scheduleFrame();
    }
  }

  /** Reports the current pointer position; starts or continues scrolling when it overshoots. */
  update(pointerX: number, pointerY: number): void {
    this.pointer = { x: pointerX, y: pointerY };
    this.step();
  }

  /** Stops scrolling and forgets the pointer. */
  stop(): void {
    this.pointer = null;

    if (this.frameHandle) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = 0;
    }
  }
}
