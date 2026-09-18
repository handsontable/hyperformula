/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Identifies a feature area of the public API that a license entitlement can gate.
 *
 * `CustomFunctions` and `ImportExport` are reserved vocabulary: they exist so a license payload
 * is free to carry them, but no capability grant in this release maps to either of them yet.
 * HF-307 decision D1 drops function-registration gating (and the `CustomFunctions` grant) from
 * this release; `ImportExport` has no gated methods until HF-107 lands.
 */
export const enum FeatureId {
  NamedExpressions = 'named_expressions',
  Clipboard = 'clipboard',
  Crud = 'crud',
  UndoRedo = 'undo_redo',
  Batching = 'batching',
  CustomFunctions = 'custom_functions',
  ImportExport = 'import_export',
}

/**
 * Describes when a license entitlement stops being valid.
 *
 * Per key-spec rev 3 §1.3, `date` is kept as a calendar string rather than an epoch, and is
 * INCLUSIVE of its last valid day:
 * - `kind === 'usage'`: `date` is compared against the client's LOCAL calendar date — deliberately
 *   not UTC, the date means the date, wherever the customer is.
 * - `kind === 'release'`: `date` is compared LEXICOGRAPHICALLY, as text, against the library's
 *   build date; no clock is involved.
 * - `kind === 'none'`: the entitlement does not expire.
 */
export interface LicenseExpiry {
  kind: 'usage' | 'release' | 'none',
  /** ISO 'YYYY-MM-DD', or `null` when `kind` is `'none'`. */
  date: string | null,
  noticeDays: number,
  graceDays: number,
}

/**
 * The resolved set of things a license grants, independent of how the underlying license key
 * was parsed.
 *
 * This is the contract every later HF-307 task consumes: {@link CapabilityRegistry} turns it
 * into a `ResolvedCapabilities` set, gate B in the interpreter reads that set, and PR 2's
 * `ensureCapability` reads it for the public API. Until PR 3 lands the real license-key payload
 * adapter, instances of this are built by hand in tests rather than read from a real key.
 */
export interface LicenseEntitlement {
  /** `true` for every key this library fully understands today (`gpl-v3`, legacy keys). */
  unrestricted: boolean,
  /** Capability tokens this entitlement grants, recognized by this library version. */
  capabilities: ReadonlySet<string>,
  /**
   * Tokens present on the license payload that this library version does not recognize.
   * Kept for diagnostics and tests; per HF-307 decision D3 nothing public reads this field — an
   * unrecognized token never grants a capability, and it does so silently.
   */
  unrecognizedCapabilities: readonly string[],
  expiry: LicenseExpiry,
  /**
   * When `true`, resolving this entitlement must not print a console message of any kind.
   * HF-307 decision D3 (fail-closed, silent): a typed key with no recognized token resolves
   * like an explicit `capabilities: []` — core and protected functions only, without a message,
   * a warning, or a diagnostics getter.
   */
  silent: boolean,
  isTrial: boolean,
}

/**
 * The unrestricted entitlement: legacy keys and `gpl-v3` resolve to this today.
 *
 * HF-307 decision D3 (fail-closed, silent) means a typed key whose tokens this library version
 * does not recognize at all no longer maps here — it resolves to an entitlement with an empty,
 * silent capability set instead of falling back to unrestricted access. Do not reuse this
 * function for that case.
 */
export function unrestrictedEntitlement(): LicenseEntitlement {
  return {
    unrestricted: true,
    capabilities: new Set<string>(),
    unrecognizedCapabilities: [],
    expiry: {kind: 'none', date: null, noticeDays: 0, graceDays: 0},
    silent: false,
    isTrial: false,
  }
}
