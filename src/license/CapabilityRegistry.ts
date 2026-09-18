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
  /** `true` short-circuits both {@link allowsFunction} and {@link allowsFeature} to `true`. */
  unrestricted: boolean,
  functions: ReadonlySet<string>,
  features: ReadonlySet<FeatureId>,
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
   * grant. An `unrestricted` entitlement short-circuits to an unrestricted result without
   * consulting the table at all. Tokens are matched case-insensitively (the table is keyed by
   * the normalized spelling — see {@link normalizeCapabilityToken}). Expansion through `implies`
   * is transitive and cycle-safe (a visited set guards against a token implying itself, directly
   * or through others); an unrecognized token is skipped without an error.
   *
   * @param {LicenseEntitlement} entitlement - the entitlement to resolve, e.g. one built by
   * hand in a test or produced by the license-key payload adapter
   */
  public resolve(entitlement: LicenseEntitlement): ResolvedCapabilities {
    if (entitlement.unrestricted) {
      return {unrestricted: true, functions: new Set<string>(), features: new Set<FeatureId>()}
    }

    const functions = new Set<string>()
    const features = new Set<FeatureId>()
    const visited = new Set<string>()
    // Walked with a read cursor rather than `queue.shift()`: `shift` is O(n) in most engines, which
    // made expansion O(n^2) in the number of tokens a key carries - measured at 1.4 s inside the
    // constructor for a key with 100 000 tokens, which the format's missing size limit allows.
    // `implies` still appends, so the queue has to stay a growable array.
    const queue = [...entitlement.capabilities]
    let cursor = 0

    while (cursor < queue.length) {
      const token = normalizeCapabilityToken(queue[cursor])

      cursor += 1
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
      grant.implies?.forEach((impliedToken) => queue.push(impliedToken))
    }

    return {unrestricted: false, functions, features}
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
  return resolved.unrestricted || resolved.functions.has(functionId)
}

/**
 * Whether a resolved entitlement allows using the given feature area of the public API.
 */
export function allowsFeature(resolved: ResolvedCapabilities, feature: FeatureId): boolean {
  return resolved.unrestricted || resolved.features.has(feature)
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
