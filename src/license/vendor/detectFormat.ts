/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/entitlement-key/detect-format.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 */

/**
 * The name of each license key format {@link detectLicenseKeyFormat} can answer with.
 */
export type LicenseKeyFormat =
  | 'entitlement'
  | 'legacy'
  | 'non-commercial-and-evaluation'
  | 'gpl-v3'
  | 'unknown'

/**
 * The literal keys that stand for a licence rather than encode one.
 */
const LITERAL_KEYS: ReadonlyMap<string, LicenseKeyFormat> = new Map([
  ['non-commercial-and-evaluation', 'non-commercial-and-evaluation'],
  ['gpl-v3', 'gpl-v3'],
])

/**
 * The classic 25-character key, once its dashes are stripped.
 */
const LEGACY_KEY = /^[0-9a-fA-F]{25}$/

/**
 * Tells which license key format a string is in, without validating it.
 *
 * The entitlement key format removed the leading type tag, so a key no longer announces itself
 * in its first characters — it now ends with the bracketed machine-readable block instead.
 * Products that accept several formats need one place that makes the distinction, and this is it.
 *
 * The answer is about SHAPE only. A returned `'entitlement'` means "route this to the
 * entitlement validator", not "this key is valid".
 *
 * @param {unknown} licenseKey - the license key to inspect
 */
export function detectLicenseKeyFormat(licenseKey: unknown): LicenseKeyFormat {
  if (typeof licenseKey !== 'string') {
    return 'unknown'
  }

  const key = licenseKey.trim()
  const literal = LITERAL_KEYS.get(key.toLowerCase())

  if (literal !== undefined) {
    return literal
  }

  // The bracketed block closes an entitlement key. Its presence is what separates the new format
  // from everything else, so it is checked before the shape-based ones.
  const blockStart = key.lastIndexOf('[')

  if (blockStart !== -1 && key.indexOf(']', blockStart) !== -1) {
    return 'entitlement'
  }
  if (LEGACY_KEY.test(key.replace(/-/g, ''))) {
    return 'legacy'
  }

  return 'unknown'
}
