/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId, LicenseEntitlement} from './LicenseEntitlement'
import {CAPABILITY_TABLE, CapabilityGrant, normalizeCapabilityToken} from './capabilities'

/**
 * The capabilities a resolved {@link LicenseEntitlement} grants, ready for gate B (the
 * interpreter) and PR 2's `ensureCapability` to query through {@link allowsFunction} and
 * {@link allowsFeature}.
 */
export interface ResolvedCapabilities {
  /**
   * `'all'` short-circuits {@link allowsFunction} to `true` for every function id, independently
   * of {@link features}: a key can cover every function without covering every feature, or the
   * other way round. A single `unrestricted: boolean` could not express that combination — it
   * could only grant both axes together or neither (review of #1728, Kuba Sękowski).
   */
  functions: ReadonlySet<string> | 'all',
  /** `'all'` short-circuits {@link allowsFeature} to `true` for every {@link FeatureId}. */
  features: ReadonlySet<FeatureId> | 'all',
}

/**
 * Expands a {@link LicenseEntitlement}'s capability tokens against a table of
 * {@link CapabilityGrant}s into the concrete functions and features they grant, and answers
 * which token, if any, covers a given function id.
 */
export class CapabilityRegistry {
  private readonly table: ReadonlyMap<string, CapabilityGrant>
  private readonly reverseIndex: ReadonlyMap<string, string>

  /**
   * @param {ReadonlyMap<string, CapabilityGrant>} [table] - capability table to resolve
   * against. Omit to use the production {@link CAPABILITY_TABLE}; tests inject their own so the
   * suite does not depend on its placeholder content.
   */
  constructor(table?: ReadonlyMap<string, CapabilityGrant>) {
    this.table = table ?? CAPABILITY_TABLE
    this.reverseIndex = CapabilityRegistry.buildReverseIndex(this.table)
  }

  /**
   * Inverts a capability table from token → grant into function id → token, so
   * {@link capabilityOf} is a single lookup instead of a scan. The first token that lists a
   * given function id wins, in table iteration order.
   *
   * @param {ReadonlyMap<string, CapabilityGrant>} table - the table to invert
   */
  private static buildReverseIndex(table: ReadonlyMap<string, CapabilityGrant>): ReadonlyMap<string, string> {
    const index = new Map<string, string>()
    for (const [token, grant] of table) {
      for (const functionId of grant.functions) {
        if (!index.has(functionId)) {
          index.set(functionId, token)
        }
      }
    }
    return index
  }

  /**
   * Expands an entitlement's capability tokens into the concrete functions and features they
   * grant. An `unrestricted` entitlement short-circuits to `'all'` on BOTH axes without
   * consulting the table at all. Tokens are matched case-insensitively (the table is keyed by
   * the normalized spelling — see {@link normalizeCapabilityToken}). Every grant stands on its
   * own — a token never refers to another — so this is a flat pass over the entitlement's own
   * tokens; an unrecognized token is skipped without an error, and a repeated one adds nothing.
   *
   * Setting `'all'` on both axes here, in the same object literal, is deliberate: this is the
   * only place `entitlement.unrestricted` is read, so a future edit that touches one axis and
   * not the other has nowhere else to be caught except the per-axis fail-open tests in
   * `unit/license/capability-registry.spec.ts`. The axis a change forgets fails CLOSED, not
   * open — silently turning a working gpl-v3/legacy install into a partial denial — which is why
   * both are pinned separately rather than with one combined assertion.
   *
   * @param {LicenseEntitlement} entitlement - the entitlement to resolve, e.g. one built by
   * hand in a test or produced by the license-key payload adapter
   */
  public resolve(entitlement: LicenseEntitlement): ResolvedCapabilities {
    if (entitlement.unrestricted) {
      return {functions: 'all', features: 'all'}
    }

    const functions = new Set<string>()
    const features = new Set<FeatureId>()
    // A key may carry a great many tokens - the format sets no size limit - and a repeated one
    // grants nothing new, so each distinct spelling is expanded once. Expansion itself is a single
    // pass: no grant refers to another, so there is nothing to walk.
    const visited = new Set<string>()

    for (const rawToken of entitlement.capabilities) {
      const token = normalizeCapabilityToken(rawToken)
      if (visited.has(token)) {
        continue
      }
      visited.add(token)

      const grant = this.table.get(token)
      if (grant === undefined) {
        continue
      }
      grant.functions.forEach((functionId) => functions.add(functionId))
      grant.features.forEach((feature) => features.add(feature))
    }

    return {functions, features}
  }

  /**
   * Returns the capability token a function id is covered by, or `undefined` if this registry's
   * table does not cover it. The completeness invariant in
   * `unit/license/capability-registry.spec.ts` guarantees every built-in registered in the
   * static function registry is covered by the table, the core token, or the protected list —
   * so `undefined` for a function known to the current instance's function registry means it is
   * a custom, instance-registered function rather than an unlisted built-in.
   */
  public capabilityOf(functionId: string): string | undefined {
    return this.reverseIndex.get(functionId)
  }
}

/**
 * Whether a resolved entitlement allows calling the given function.
 */
export function allowsFunction(resolved: ResolvedCapabilities, functionId: string): boolean {
  return resolved.functions === 'all' || resolved.functions.has(functionId)
}

/**
 * Whether a resolved entitlement allows using the given feature area of the public API.
 */
export function allowsFeature(resolved: ResolvedCapabilities, feature: FeatureId): boolean {
  return resolved.features === 'all' || resolved.features.has(feature)
}

/**
 * Whether the license lets an instance evaluate — and therefore describe — the given function.
 *
 * The rule both gate-B function call sites share: a function the capability table does not cover
 * at all is allowed. {@link CapabilityRegistry.capabilityOf} returns `undefined` only for an id no
 * token lists, which the completeness invariant in `unit/license/capability-registry.spec.ts`
 * guarantees is not an unlisted built-in but a custom, instance-registered function — exempt from
 * gate B by decision D1. Everything the table does cover has to be granted by the entitlement.
 *
 * Extracted so the interpreter and the function metadata API cannot drift apart. The metadata API
 * exists to describe the functions an instance can actually evaluate, so a second spelling of this
 * rule would eventually let it advertise a function that then returns `#LIC!` — the exact failure
 * removing the static metadata methods (HF-349) was meant to prevent.
 *
 * Note this is gate B only: it says nothing about {@link LicenseKeyValidityState}. Callers that
 * also need gate A check it separately, because the two gates have different answers for the same
 * key — see the comment on `resolveLicense`.
 *
 * @param {CapabilityRegistry} registry - the registry the capabilities were resolved against
 * @param {ResolvedCapabilities} resolved - the instance's resolved capabilities
 * @param {string} canonicalFunctionId - the function id, already resolved through the alias map
 */
export function licenseAllowsFunction(
  registry: CapabilityRegistry,
  resolved: ResolvedCapabilities,
  canonicalFunctionId: string,
): boolean {
  return registry.capabilityOf(canonicalFunctionId) === undefined
    || allowsFunction(resolved, canonicalFunctionId)
}
