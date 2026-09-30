/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Hand-written declarations for `detect-format.js`, which is a verbatim copy of upstream.
 * See PROVENANCE.md: the JavaScript is not edited here, so the types live beside it.
 */

/** Which of the licence-key shapes a string is, before anything is decoded. */
export type LicenseKeyFormat =
  | 'entitlement'
  | 'legacy'
  | 'non-commercial-and-evaluation'
  | 'gpl-v3'
  | 'unknown'

/**
 * Classifies a licence key by shape alone. A garbage bracketed block still answers
 * `'entitlement'`, so the caller routes it to the entitlement validator and gets INVALID there.
 *
 * @param {unknown} licenseKey - the value to classify; anything at all, including a non-string
 */
export function detectLicenseKeyFormat(licenseKey: unknown): LicenseKeyFormat
