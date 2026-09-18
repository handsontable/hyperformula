/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionRegistry} from '../interpreter/FunctionRegistry'
import {FeatureId} from './LicenseEntitlement'

/** The single capability token every built-in currently falls under, see {@link CAPABILITY_TABLE}. */
export const CORE_TOKEN = 'core'

/**
 * Describes what a capability token grants: a set of function ids, a set of {@link FeatureId}
 * values, and optionally other tokens it implies. `implies` is expanded recursively by
 * `CapabilityRegistry.resolve`, not by anything in this file.
 */
export interface CapabilityGrant {
  functions: string[],
  features: FeatureId[],
  implies?: string[],
}

const coreGrant: CapabilityGrant = {
  functions: [],
  features: [FeatureId.NamedExpressions, FeatureId.Clipboard, FeatureId.Crud, FeatureId.UndoRedo, FeatureId.Batching],
}

/**
 * The production capability table.
 *
 * Placeholder content pending HF-331/HF-329 (the real per-package token vocabulary): every
 * built-in function, plus the features already wired for gating in PR 2, fall under the single
 * {@link CORE_TOKEN}. `FeatureId.CustomFunctions` and `FeatureId.ImportExport` are deliberately
 * absent — reserved vocabulary with no grant yet (HF-307 decision D1; HF-107 for ImportExport).
 *
 * `coreGrant.functions` starts empty and is refreshed on every {@link refreshCoreGrant} call
 * rather than populated once here: `src/index.ts` registers HyperFormula's built-in plugins as a
 * side effect of being imported, and it does so AFTER `Config` and `Interpreter` — and so this
 * module — have already been fully evaluated. Reading the function registry at module-load time
 * would capture an empty registry.
 */
export const CAPABILITY_TABLE: ReadonlyMap<string, CapabilityGrant> = new Map([[CORE_TOKEN, coreGrant]])

/**
 * Refreshes the placeholder `core` grant with every function currently in the static function
 * registry. Called from `CapabilityRegistry`'s constructor every time it is constructed without
 * an explicit table — not just the first time: the static registry can change after the first
 * engine is built (`HyperFormula.registerFunctionPlugin`/`unregisterFunctionPlugin` are public,
 * documented APIs), and a one-time snapshot would silently go stale for every engine built
 * afterward. Cheap (a single array copy from an existing map's keys) and only ever runs once per
 * `Config`/engine construction, never on the per-formula hot path, so re-running it every time
 * costs nothing worth guarding against with memoization.
 */
export function refreshCoreGrant(): void {
  coreGrant.functions = FunctionRegistry.getRegisteredFunctionIds()
}
