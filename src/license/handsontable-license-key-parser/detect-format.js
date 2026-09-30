/**
 * The literal keys that stand for a licence rather than encode one.
 *
 * @type {object}
 */
const LITERAL_KEYS = {
  'non-commercial-and-evaluation': 'non-commercial-and-evaluation',
  'gpl-v3': 'gpl-v3',
};
/**
 * The classic 25-character key, once its dashes are stripped.
 *
 * @type {RegExp}
 */
const LEGACY_KEY = /^[0-9a-fA-F]{25}$/;

/**
 * Tells which license key format a string is in, without validating it.
 *
 * The entitlement key format removed the leading type tag, so a key no longer
 * announces itself in its first characters - it now ends with the bracketed
 * machine-readable block instead. Products that accept several formats need
 * one place that makes the distinction, and this is it.
 *
 * The answer is about SHAPE only. A returned "entitlement" means "route this
 * to the entitlement validator", not "this key is valid".
 *
 * @param {string} licenseKey The license key to inspect.
 * @returns {string} One of: "entitlement", "legacy",
 *          "non-commercial-and-evaluation", "gpl-v3", "unknown".
 */
/* eslint-disable import/prefer-default-export */
export function detectLicenseKeyFormat(licenseKey) {
  if (typeof licenseKey !== 'string') {
    return 'unknown';
  }

  const key = licenseKey.trim();

  if (Object.prototype.hasOwnProperty.call(LITERAL_KEYS, key.toLowerCase())) {
    return LITERAL_KEYS[key.toLowerCase()];
  }

  // The bracketed block closes an entitlement key. Its presence is what
  // separates the new format from everything else, so it is checked before
  // the shape-based ones.
  const blockStart = key.lastIndexOf('[');

  if (blockStart !== -1 && key.indexOf(']', blockStart) !== -1) {
    return 'entitlement';
  }
  if (LEGACY_KEY.test(key.replace(/-/g, ''))) {
    return 'legacy';
  }

  return 'unknown';
}
