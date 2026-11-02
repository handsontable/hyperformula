/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Identifies a feature area of the public API that a license entitlement can gate.
 *
 * Public, as the type of [[LicenseCapabilityMissingError]]'s `feature`, so that a caller can tell
 * which feature a call needed without parsing the error message.
 */
export enum FeatureId {
  NamedExpressions = 'named_expressions',
  Clipboard = 'clipboard',
  Crud = 'crud',
  UndoRedo = 'undo_redo',
  Batching = 'batching',
}

/**
 * Describes when a license entitlement stops being valid.
 *
 * `date` is kept as a calendar string rather than an epoch, and is INCLUSIVE of its last valid
 * day:
 * - `kind === 'usage'`: compared against the current instant in **UTC**, not the client's LOCAL
 *   calendar date, because the offline check and a future online check have to return the same verdict for the same key at
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
 * {@link CapabilityRegistry} turns it into a `ResolvedCapabilities` set, gate B in the
 * interpreter reads that set, and `ensureCapability` reads it for the public API. `resolveLicense` builds it from the
 * configured key.
 */
export interface LicenseEntitlement {
  /**
   * `true` for every key that restricts nothing: classic keys, `gpl-v3`, and any key that blocks
   * evaluation (a missing or invalid key, an expired classic key, or a trial past its grace
   * period). An entitlement key that has expired but keeps evaluating is not one of them: it keeps
   * its own grants.
   */
  unrestricted: boolean,
  /**
   * The capability tokens the key carries, spelled as the key spells them, recognized or not. Only
   * the ones this library version recognizes grant anything.
   */
  capabilities: ReadonlySet<string>,
  expiry: LicenseExpiry,
  /**
   * When `true`, resolving this entitlement must not print a console message of any kind.
   *
   * Set from the key's own `no-console-warns` flag ONLY, as the vendored reader reads it (its
   * `channels.console`). An unrecognized token does NOT
   * set it: an unknown token makes the *grant* silent (it grants nothing, and nothing reports it),
   * which is a different thing from muting the key's console output.
   * Coupling them would suppress expiry notices as a side effect of a vocabulary mismatch.
   */
  silent: boolean,
  isTrial: boolean,
}

/**
 * The unrestricted entitlement: classic keys, `gpl-v3`, and every key that blocks evaluation (a
 * missing or invalid key, an expired classic key, or a trial past its grace period) resolve to
 * this. An entitlement key that has expired but keeps evaluating does not: it keeps its own grants.
 *
 * Unrecognized tokens fail closed and silently, so an entitlement key whose tokens this library
 * version does not recognize at all does not map here — it resolves to an entitlement with an empty,
 * silent capability set instead of falling back to unrestricted access. Do not reuse this
 * function for that case.
 */
export function unrestrictedEntitlement(): LicenseEntitlement {
  return {
    unrestricted: true,
    capabilities: new Set<string>(),
    expiry: {kind: 'none', date: null, noticeDays: 0, graceDays: 0},
    silent: false,
    isTrial: false,
  }
}
