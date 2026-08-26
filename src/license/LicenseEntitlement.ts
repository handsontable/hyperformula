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
 * `date` is kept as a calendar string rather than an epoch, and is INCLUSIVE of its last valid
 * day:
 * - `kind === 'usage'`: compared against the current instant in **UTC**. An earlier revision of
 *   the key spec called for the client's LOCAL calendar date; that was reversed, because the
 *   offline check and a future online check have to return the same verdict for the same key at
 *   the same instant, and any rule that reads a local clock breaks that parity. The practical
 *   cost is that a customer far west of UTC loses the tail of their last local day.
 * - `kind === 'release'`: compared against the library's build date; no clock is involved, which
 *   is what keeps an air-gapped install with a wrong system clock working.
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
   *
   * Set from the key's own flags ONLY — the key spec spells that flag three different ways across
   * revisions and even within one revision, and all are honoured. An unrecognized token does NOT
   * set it: HF-307 decision D3 makes the *grant* silent (an unknown token grants nothing, with no
   * message and no diagnostics getter), which is a different thing from muting the key's console
   * output. Coupling them suppressed expiry notices as a side effect of a vocabulary mismatch, and
   * was confirmed an implementation error.
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
