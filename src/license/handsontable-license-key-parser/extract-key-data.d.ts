/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Hand-written declarations for `extract-key-data.js`, which is a verbatim copy of upstream.
 * See PROVENANCE.md: the JavaScript is not edited here, so the types live beside it.
 */

/**
 * One product's terms, as the reader normalizes them.
 *
 * The declared members are the ones the reader VERIFIES: `capabilities` and `flags` element by
 * element, `notice` and `grace` as non-negative integers, and exactly one of the two date fields.
 * Everything it does not verify - unknown fields are preserved on purpose - sits behind the index
 * signature, so a consumer has to narrow before using it.
 */
export interface EntitlementProductGrant {
  readonly capabilities: readonly string[],
  readonly usage_until?: string,
  readonly release_until?: string,
  readonly notice: number,
  readonly grace: number,
  readonly flags: readonly string[],
  readonly [field: string]: unknown,
}

/** The machine-readable content of an intact entitlement key: the granted products and their terms. */
export interface EntitlementKeyData {
  readonly products: Readonly<Record<string, EntitlementProductGrant>>,
}

/**
 * Reads an entitlement key: finds the bracketed block, verifies the checksum before decoding
 * anything, then normalizes the payload. `null` when the envelope or the payload is not intact.
 *
 * @param {string} licenseKey - the whole licence artifact or the bare block
 */
export function extractEntitlementKeyData(licenseKey: string): EntitlementKeyData | null
