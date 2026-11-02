/**
 * Copy text to the clipboard, falling back to a hidden `<textarea>` +
 * `execCommand('copy')` when the async Clipboard API is unavailable (insecure
 * context / older browsers). Always resolves, so callers can chain a single
 * `.then()` for their "Copied!" state regardless of which path ran.
 *
 * @param {string} text text to place on the clipboard
 * @returns {Promise<void>}
 */
export function copyToClipboard(text) {
  const fallback = () => {
    // Never throw: the "always resolves" contract must hold even if the DOM
    // or execCommand path fails (e.g. detached document, disabled command).
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(el); }
    } catch (_) { /* clipboard truly unavailable — nothing more we can do */ }
  };
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(fallback);
  }
  fallback();
  return Promise.resolve();
}
