/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId} from './LicenseEntitlement'
import {FEATURE_CAPABILITY_TABLE} from './featureCapabilities'
import {FUNCTION_CAPABILITY_TABLE} from './functionCapabilities'

// The engine reads CAPABILITIES, never packages. A license key carries a list of capability
// tokens and the engine grants the union of what those tokens name; which tokens make up which
// commercial package is decided where keys are minted, not here. In the words of the packaging
// design: "Nothing else about packaging exists at the technical layer."
//
// The vocabulary itself lives in two halves — `./featureCapabilities` and
// `./functionCapabilities` — and this module is where they meet: it owns the grant shape both
// halves are read through, and joins them into the single table the engine reads. That table is
// what consumers want; neither half is worth importing directly unless you need one vocabulary
// without the other.

/**
 * Describes what a capability token grants: a set of function ids and a set of {@link FeatureId}
 * values. A grant never refers to another token — every one stands alone, so
 * `CapabilityRegistry.resolve` reads the table in a single flat pass.
 */
export interface CapabilityGrant {
  functions: string[],
  features: FeatureId[],
}

/**
 * The production capability table the engine reads: {@link FEATURE_CAPABILITY_TABLE} and
 * {@link FUNCTION_CAPABILITY_TABLE} under one key space, keyed by NORMALIZED token spelling —
 * look up through {@link normalizeCapabilityToken}, never with a raw key string.
 *
 * The two halves share no token (one vocabulary is prefixed `feat:`, the other `fun:`), so the
 * merge cannot lose an entry to a collision. Features come first so that the function half keeps
 * its own iteration order, which is what decides the winner in
 * `CapabilityRegistry`'s reverse index: `fun:all` covers every gatable function and therefore
 * names every one of them there.
 *
 * Both halves are copied into fresh {@link CapabilityGrant} objects rather than referenced, so
 * that a consumer holding a grant cannot reach back into a sub-table's arrays.
 *
 * No token here names a package, and no grant refers to another token. Which tokens a commercial
 * package consists of is the generator's knowledge, expressed by the bigger licence simply
 * listing more tokens — so a key's function set is the union of everything it names that this
 * table recognizes, and an unrecognized token is inert (strict-shape/lenient-vocabulary, T7).
 * Legacy keys resolve to the unrestricted entitlement and never consult this table at all.
 *
 * There is no entry for any add-on. An add-on is a commercial wrapper, and which capabilities it
 * bundles is decided where keys are minted; the engine only ever reads the capabilities the key
 * actually names. That is what lets pricing rename or re-bundle an add-on without a release here.
 */
export const CAPABILITY_TABLE: ReadonlyMap<string, CapabilityGrant> = new Map<string, CapabilityGrant>([
  ...Array.from(FEATURE_CAPABILITY_TABLE, ([token, features]): [string, CapabilityGrant] => [
    token,
    {functions: [], features: [...features]},
  ]),
  ...Array.from(FUNCTION_CAPABILITY_TABLE, ([token, functions]): [string, CapabilityGrant] => [
    token,
    {functions: [...functions], features: []},
  ]),
])

/**
 * The canonical spelling of a capability token for table lookups.
 *
 * Token names are case-insensitive — the packaging doc states it outright for its `fun:*`
 * vocabulary, and tolerating case on the other tokens costs nothing since none of them collide
 * under lowercasing. Surrounding whitespace is trimmed because a key's token list is text a human
 * edited somewhere upstream: `'feat:crud '` is the token its author meant, and a padded spelling
 * that silently grants nothing is a support ticket, not a licence restriction.
 *
 * Normalization happens at LOOKUP, never at storage: an entitlement carries the key's own
 * spellings (they are diagnostics), and {@link CAPABILITY_TABLE} is keyed by the normalized form.
 *
 * @param {string} token - a capability token as the key spells it
 */
export function normalizeCapabilityToken(token: string): string {
  return token.trim().toLowerCase()
}
