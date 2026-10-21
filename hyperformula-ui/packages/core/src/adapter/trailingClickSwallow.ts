/**
 * Swallows the single click that trails a header-drag mouseup so the host grid does not
 * treat it as a header selection: captures the next `click` on `swallowTarget` and, when
 * `shouldSwallow` matches its target, prevents it; any `mousedown` first disarms instead.
 * Returns a disarm function.
 *
 * @category Grid Adapter
 */
export function armTrailingClickSwallow(
  swallowTarget: Document,
  shouldSwallow: (clickTarget: Element) => boolean,
): () => void {
  const handleNextMousedown = (): void => {
    disarm();
  };

  const handleTrailingClick = (event: MouseEvent): void => {
    disarm();

    const target = event.target;

    if (target instanceof Element && shouldSwallow(target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  const disarm = (): void => {
    swallowTarget.removeEventListener("click", handleTrailingClick, true);
    swallowTarget.removeEventListener("mousedown", handleNextMousedown, true);
  };

  swallowTarget.addEventListener("click", handleTrailingClick, true);
  swallowTarget.addEventListener("mousedown", handleNextMousedown, true);

  return disarm;
}
