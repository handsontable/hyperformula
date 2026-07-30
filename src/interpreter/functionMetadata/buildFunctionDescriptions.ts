/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionMetadata, FunctionArgument} from '../plugin/FunctionPlugin'
import {CUSTOM_FUNCTION_CATEGORY, FunctionDoc, FunctionListEntry, FunctionDetails, FunctionParameterDescription} from './FunctionDescription'

/** Resolves a function's display name: the translation for the active language, or the canonical id as fallback. */
type TranslateName = (canonicalName: string) => string | undefined

/** The structural subset of `FunctionMetadata` the builders read (so callers/tests need not supply `method`). */
export type StructuralMetadata = Pick<FunctionMetadata, 'parameters' | 'repeatLastArgs'>

/**
 * Returns whether a parameter may be omitted: it declares `optionalArg`, or it has a `defaultValue`.
 *
 * @param {FunctionArgument | undefined} arg - the structural argument metadata, or `undefined`
 */
export function isParameterOptional(arg: FunctionArgument | undefined): boolean {
  return arg?.optionalArg === true || arg?.defaultValue !== undefined
}

/**
 * Normalizes a declared `repeatLastArgs` into the value the public [[FunctionDetails.repeatLastArgs]] may carry: a
 * non-negative integer no larger than the number of parameters. Shared by both details builders, so the built-in and
 * the custom path can never report the field under different rules.
 *
 * Neither rule is invented here:
 * - Only a positive integer means anything. `FunctionPlugin.buildMetadataForEachArgumentValue` gates the repeat on
 *   `Number.isInteger(repeatLastArgs) && repeatLastArgs > 0`, so for `undefined`, `0`, a negative, a fraction, `NaN`
 *   or `Infinity` the evaluator repeats nothing and the function has a fixed arity. Reporting `0` for all of those
 *   describes what actually runs instead of echoing a value the interpreter ignores. (`Math.min` alone would not do:
 *   `Math.min(NaN, 2)` is `NaN` and `Math.min(-1, 2)` is `-1`.)
 * - A valid count is clamped to the parameter count. A plugin declaring more repeating parameters than it has
 *   parameters would otherwise render as "the last N of M parameters repeat" with N > M, and the evaluator's own
 *   `slice(length - repeatLastArgs)` cannot reach further back than the whole list either.
 *
 * @param {number | undefined} repeatLastArgs - the value declared in `implementedFunctions`, if any
 * @param {number} parameterCount - the number of parameters the function declares
 */
export function clampRepeatLastArgs(repeatLastArgs: number | undefined, parameterCount: number): number {
  if (repeatLastArgs === undefined || !Number.isInteger(repeatLastArgs) || repeatLastArgs <= 0) {
    return 0
  }
  return Math.min(repeatLastArgs, parameterCount)
}

/**
 * Resolves the display name for a function: the translated name, or the canonical id when there is no usable
 * translation. Some bundled language packs leave a function untranslated as an empty string (e.g. `SWITCH` in
 * several locales), so an empty translation falls back to the canonical id just like a missing one.
 *
 * Anything that is not a non-empty string falls back too. A translation package looks its ids up on a plain object, so
 * an id colliding with an `Object.prototype` member (`toString`, `valueOf`) yields that member instead of a
 * translation. Without this check `localizedName` could be a function, which contradicts its declared `string` type
 * and silently disappears through `JSON.stringify`.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup (returns `undefined` when untranslated)
 */
function resolveName(canonicalName: string, translate: TranslateName): string {
  const translated = translate(canonicalName)
  return typeof translated !== 'string' || translated === '' ? canonicalName : translated
}

/**
 * Builds a Tier-1 list entry by joining the catalogue doc with the translation on the canonical id.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildFunctionListEntry(canonicalName: string, doc: FunctionDoc, translate: TranslateName, aliasOf?: string): FunctionListEntry {
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    // See buildFunctionDetails: omitted for non-aliases instead of an `undefined` value.
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: doc.category,
    shortDescription: doc.shortDescription,
  }
}

/**
 * Builds a Tier-2 details object: the list fields plus the parameter list (name, description, optionality) and
 * `repeatLastArgs` (how many trailing parameters repeat, normalized by [[clampRepeatLastArgs]]). The caller renders
 * the syntax string from these.
 * `documentationUrl` comes from the catalogue doc, which authors it for every entry; `examples` falls back to `[]`.
 * Built-in parameters carry authored descriptions; custom functions surface empty values.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 * @throws {Error} when `doc.parameters.length` does not equal `(metadata.parameters ?? []).length`
 */
export function buildFunctionDetails(canonicalName: string, doc: FunctionDoc, metadata: StructuralMetadata, translate: TranslateName, aliasOf?: string): FunctionDetails {
  const implParamCount = (metadata.parameters ?? []).length
  if (doc.parameters.length !== implParamCount) {
    throw new Error(`Function metadata mismatch for ${canonicalName}: catalogue has ${doc.parameters.length} parameters, implementation has ${implParamCount}`)
  }
  const args = metadata.parameters ?? []
  const parameters: FunctionParameterDescription[] = doc.parameters.map((param, index) => ({
    name: param.name,
    description: param.description,
    optional: isParameterOptional(args[index]),
  }))
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    // Omitted entirely for non-aliases rather than set to `undefined`: the key would otherwise
    // survive in memory but vanish through JSON.stringify, handing consumers two shapes for the
    // same function (mirrors documentationUrl always being a string).
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: doc.category,
    shortDescription: doc.shortDescription,
    parameters,
    repeatLastArgs: clampRepeatLastArgs(metadata.repeatLastArgs, parameters.length),
    documentationUrl: doc.documentationUrl,
    examples: [...(doc.examples ?? [])],
  }
}

/**
 * Builds a Tier-1 list entry for a custom (user-registered) function, which ships no catalogue doc. The name is the
 * only authored information: `category` is reported as `'Custom'` and `shortDescription` is empty.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildCustomFunctionListEntry(canonicalName: string, translate: TranslateName, aliasOf?: string): FunctionListEntry {
  // `aliasOf` is the only key ever absent: omitting it for a non-alias beats setting it to `undefined`, which would
  // survive in memory but vanish through JSON.stringify, giving consumers two shapes for one function. `category` and
  // `shortDescription` are by contract always present — `'Custom'` and `''` respectively — so a custom function has
  // the same key set as a built-in one and differs only in its values.
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: CUSTOM_FUNCTION_CATEGORY,
    shortDescription: '',
  }
}

/**
 * Builds Tier-2 details for a custom (user-registered) function from its structural metadata alone (no catalogue
 * doc): the `'Custom'` category, positional parameter names (`Arg1`, `Arg2`, ...), per-parameter optionality, and
 * `repeatLastArgs` (normalized by [[clampRepeatLastArgs]], exactly as on the built-in path).
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildCustomFunctionDetails(canonicalName: string, metadata: StructuralMetadata, translate: TranslateName, aliasOf?: string): FunctionDetails {
  const args = metadata.parameters ?? []
  const parameters: FunctionParameterDescription[] = args.map((arg, index) => ({
    name: `Arg${index + 1}`,
    description: '',
    optional: isParameterOptional(arg),
  }))
  // `aliasOf` is emitted only when there is one — see buildCustomFunctionListEntry for why an absent key beats an
  // `undefined`-valued one.
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: CUSTOM_FUNCTION_CATEGORY,
    shortDescription: '',
    parameters,
    repeatLastArgs: clampRepeatLastArgs(metadata.repeatLastArgs, parameters.length),
    documentationUrl: '',
    examples: [],
  }
}
