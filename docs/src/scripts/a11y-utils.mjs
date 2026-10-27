/**
 * Accessibility utilities, from the Handsontable docs' `src/scripts/a11y-utils.ts`.
 *
 * - createFocusTrap: traps Tab / Shift+Tab within a container.
 * - attachDropdownKeyboardNav: adds Arrow, Home/End, Enter, Escape to a trigger + menu dropdown pair.
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

// ── Dropdown keyboard navigation ────────────────────────────────────────

/**
 * Attach Arrow Up/Down, Home/End, Enter, and Escape keyboard navigation to a dropdown trigger + menu pair.
 *
 * @param {HTMLElement} trigger The button that opens the menu.
 * @param {HTMLElement} menu The menu.
 * @param {object} [options]
 * @param {string} [options.itemSelector] Focusable items within the menu.
 * @param {() => void} [options.onOpen] Opens the menu.
 * @param {() => void} [options.onClose] Closes the menu.
 * @param {() => boolean} [options.isOpen] Tells whether the menu is open.
 */
export function attachDropdownKeyboardNav(trigger, menu, options = {}) {
  const {
    itemSelector = 'a[role="menuitem"], li[role="menuitem"]',
    onOpen,
    onClose,
    isOpen = () => !menu.hidden,
  } = options;

  /** @returns {HTMLElement[]} */
  function getItems() {
    return Array.from(menu.querySelectorAll(itemSelector));
  }

  /** @param {number} index */
  function focusItem(index) {
    const items = getItems();
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    items[clamped].focus();
  }

  function currentIndex() {
    return getItems().indexOf(/** @type {HTMLElement} */ (document.activeElement));
  }

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Down') {
      e.preventDefault();
      if (!isOpen()) onOpen?.();
      focusItem(0);
    } else if (e.key === 'ArrowUp' || e.key === 'Up') {
      e.preventDefault();
      if (!isOpen()) onOpen?.();
      focusItem(getItems().length - 1);
    }
  });

  menu.addEventListener('keydown', (e) => {
    const items = getItems();
    if (items.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'Down': {
        e.preventDefault();
        const idx = currentIndex();
        focusItem(idx < items.length - 1 ? idx + 1 : 0);
        break;
      }
      case 'ArrowUp':
      case 'Up': {
        e.preventDefault();
        const idx = currentIndex();
        focusItem(idx > 0 ? idx - 1 : items.length - 1);
        break;
      }
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        trigger.focus();
        break;
      case 'Enter':
      case ' ': {
        if (e.key === ' ') e.preventDefault();
        const active = /** @type {HTMLElement} */ (document.activeElement);
        if (active?.tagName === 'A') {
          active.click();
        } else if (active?.tagName === 'LI') {
          active.querySelector('a')?.click();
        }
        onClose?.();
        trigger.focus();
        break;
      }
    }
  });
}
