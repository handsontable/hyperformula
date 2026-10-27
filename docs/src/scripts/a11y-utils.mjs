/**
 * Accessibility utilities, from the Handsontable docs' `src/scripts/a11y-utils.ts`.
 *
 * - createFocusTrap: traps Tab / Shift+Tab within a container.
 */

// ── Focus trap ──────────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap Tab / Shift+Tab within `container`.
 *
 * @param {HTMLElement} container The element to keep focus in.
 * @returns {() => void} A cleanup function that removes the listener.
 */
export function createFocusTrap(container) {
  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key !== 'Tab') return;

    const focusable = Array.from(container.querySelectorAll(FOCUSABLE))
      .filter((el) => el.offsetParent !== null); // visible only

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeydown);
  return () => container.removeEventListener('keydown', handleKeydown);
}
