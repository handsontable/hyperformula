/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FeatureId} from './LicenseEntitlement'

/**
 * One entry per single-area feature token. `feat:all` is derived from this list rather than
 * spelled out beside it, so a new gated area reaches it by being added here and nowhere else.
 *
 * {@link FeatureId.CustomFunctions} deliberately has no token: HF-307 decision D1 drops
 * function-registration gating, so nothing may grant it.
 */
const singleFeatureEntries: [string, readonly FeatureId[]][] = [
  ['feat:crud', [FeatureId.Crud]],
  ['feat:undo_redo', [FeatureId.UndoRedo]],
  ['feat:clipboard', [FeatureId.Clipboard]],
  ['feat:named_expressions', [FeatureId.NamedExpressions]],
  ['feat:batching', [FeatureId.Batching]],
]

/** Every gated API area: what `feat:all` grants. */
const ALL_FEATURES = singleFeatureEntries.reduce<FeatureId[]>(
  (features, [, granted]) => features.concat(granted),
  [],
)

/**
 * The `feat:*` half of the vocabulary, keyed by NORMALIZED token spelling: one token per gated
 * area of the public API, plus `feat:all` for all of them at once.
 *
 * Kept apart from `FUNCTION_CAPABILITY_TABLE` because the two halves are maintained by different
 * forces. This one grows when a public API area becomes gated — an engine decision, one entry
 * hand-written per area — while the function half is a transcription of the packaging document's
 * group membership. `CAPABILITY_TABLE` in `./capabilities` merges them for the consumers.
 */
export const FEATURE_CAPABILITY_TABLE: ReadonlyMap<string, readonly FeatureId[]> = new Map([
  ...singleFeatureEntries,
  ['feat:all', ALL_FEATURES] as [string, readonly FeatureId[]],
])
