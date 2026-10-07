import type { LicenseKeyFormat } from './types';

/**
 * The classic 25-character key, once its dashes are stripped.
 *
 * @type {RegExp}
 */
const LEGACY_KEY = /^[0-9a-fA-F]{25}$/;

/**
 * Tells which license key format a string is in, without validating it.
 *
 * The entitlement key format has no leading type tag, so a key no longer
 * announces itself in its first characters - it ends with the bracketed
 * machine-readable block instead. A product that accepts several formats needs
 * one place that makes the distinction, and this is it.
 *
 * The answer is about SHAPE only. A returned "entitlement" means "route this to
 * `readEntitlementLicense`", not "this key is valid". A returned "legacy" means
 * "route this to the product's own legacy validator" - this module does not
 * read the legacy format.
 *
 * Surrounding whitespace is ignored: a key pasted out of an email or a chat
 * window commonly carries a trailing space or newline. `extractEntitlementKeyData`
 * ignores whitespace inside the brackets too, so a block a mail client
 * wrapped still reads.
 *
 * @param {*} licenseKey The license key to inspect.
 * @param {string[]} [literalKeys] The plain words this product accepts as a key
 *   (for example "non-commercial-and-evaluation"). Compared trimmed and
 *   case-insensitively. Which words are accepted is the product's decision, so
 *   none is built in. A blank entry is ignored - it would otherwise turn a
 *   missing key into a literal one.
 * @returns {LicenseKeyFormat}
 */
export function detectLicenseKeyFormat(
  licenseKey: unknown,
  literalKeys?: readonly string[] | null,
): LicenseKeyFormat {
  if (typeof licenseKey !== 'string') {
    return 'unknown';
  }

  const key = licenseKey.trim();
  const lowerCaseKey = key.toLowerCase();
  const isLiteral = Array.isArray(literalKeys) && literalKeys.some((literalKey: unknown) => (
    typeof literalKey === 'string' && literalKey.trim() !== '' && literalKey.trim().toLowerCase() === lowerCaseKey
  ));

  if (isLiteral) {
    return 'literal';
  }

  // The bracketed block closes an entitlement key. Its presence is what
  // separates the new format from everything else, so it is checked before the
  // shape-based ones.
  const blockStart = key.lastIndexOf('[');

  if (blockStart !== -1 && key.indexOf(']', blockStart) !== -1) {
    return 'entitlement';
  }
  if (LEGACY_KEY.test(key.replace(/-/g, ''))) {
    return 'legacy';
  }

  return 'unknown';
}

/**
 * Tells whether a license key has the shape of an entitlement key - the one
 * check a product needs to route a key away from its legacy path.
 *
 * @param {*} licenseKey The license key to inspect.
 * @returns {boolean}
 */
export function isEntitlementKey(licenseKey: unknown): boolean {
  return detectLicenseKeyFormat(licenseKey) === 'entitlement';
}
