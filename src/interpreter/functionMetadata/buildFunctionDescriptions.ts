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
 * The two rules have different provenance: the first mirrors the evaluator, the second normalizes a declaration the
 * evaluator cannot honour sensibly.
 * - Only a positive integer means anything. `FunctionPlugin.buildMetadataForEachArgumentValue` gates the repeat on
 *   `Number.isInteger(repeatLastArgs) && repeatLastArgs > 0`, so for `undefined`, `0`, a negative, a fraction, `NaN`
 *   or `Infinity` the evaluator repeats nothing and the function has a fixed arity. Reporting `0` for all of those
 *   describes what actually runs instead of echoing a value the interpreter ignores. (`Math.min` alone would not do:
 *   `Math.min(NaN, 2)` is `NaN` and `Math.min(-1, 2)` is `-1`.)
 * - A valid count is clamped to the parameter count. This is a repair of a malformed declaration for reporting
 *   purposes, not a claim about how the evaluator treats it: a count above the parameter count makes
 *   `buildMetadataForEachArgumentValue`'s `slice(length - repeatLastArgs)` index negative, so the parameter list
 *   doubles on every pass and the function ends up accepting an erratic set of arities that no `repeatLastArgs`
 *   value describes. Since the field cannot be reported faithfully at all in that case, it carries the largest
 *   meaningful count rather than rendering "the last N of M parameters repeat" with N > M.
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
 * Describes an argument list from the implementation alone, naming each parameter by its position (`Arg1`, `Arg2`,
 * ...) and leaving its description empty. Used wherever no authored names apply: for a custom function, which ships
 * no catalogue entry at all, and as the drift fallback for a built-in whose entry no longer matches its signature.
 *
 * @param {FunctionArgument[]} args - the implementation's parameters, in declaration order
 */
function buildPositionalParameters(args: FunctionArgument[]): FunctionParameterDescription[] {
  return args.map((arg, index) => ({
    name: `Arg${index + 1}`,
    description: '',
    optional: isParameterOptional(arg),
  }))
}

/**
 * Describes a documented function's argument list, joining the implementation's parameters with the authored names
 * and descriptions of the catalogue entry.
 *
 * The implementation is the authority on how many arguments there are, so a catalogue entry that has drifted out of
 * step with the signature loses its parameter prose rather than the function losing its entry: the arguments are
 * reported positionally, as for a custom function. The authored names are dropped wholesale rather than paired with
 * the arguments they still line up with: once the two lists differ in length, any pairing is a guess, and a
 * plausible but wrong name misinforms more than an unnamed `Arg2` does.
 *
 * The mismatch is warned about on every call rather than recorded once: this is a catalogue bug to fix in the
 * source, and the alternative to noise is a degradation nobody notices. The list tier never lands here, so a
 * function picker rebuilding its list does not warn — only a consumer actually reading the degraded parameters.
 *
 * @param {string} canonicalName - the language-independent function id, named in the drift warning
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {FunctionArgument[]} args - the implementation's parameters, in declaration order
 */
function buildDocumentedParameters(canonicalName: string, doc: FunctionDoc, args: FunctionArgument[]): FunctionParameterDescription[] {
  if (doc.parameters.length !== args.length) {
    console.warn(`Function metadata mismatch for ${canonicalName}: the catalogue describes ${doc.parameters.length} parameter(s) but the implementation declares ${args.length}. Reporting the implemented parameters under positional names; update the catalogue entry to restore the authored ones.`)
    return buildPositionalParameters(args)
  }
  return doc.parameters.map((param, index) => ({
    name: param.name,
    description: param.description,
    optional: isParameterOptional(args[index]),
  }))
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
 * `documentationUrl` and `examples` come from the catalogue doc, which authors both for every entry, as it does the
 * parameter descriptions. A custom function has none of them; see [[buildCustomFunctionDetails]].
 *
 * The parameter list always has one entry per implemented argument, so it describes what the evaluator actually
 * accepts even when the catalogue entry has drifted out of step with the signature; see
 * [[buildDocumentedParameters]] for what such an entry still contributes.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildFunctionDetails(canonicalName: string, doc: FunctionDoc, metadata: StructuralMetadata, translate: TranslateName, aliasOf?: string): FunctionDetails {
  const parameters = buildDocumentedParameters(canonicalName, doc, metadata.parameters ?? [])
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    // Omitted entirely for non-aliases rather than set to `undefined`: the key would otherwise
    // survive in memory but vanish through JSON.stringify, handing consumers two shapes for the
    // same function.
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: doc.category,
    shortDescription: doc.shortDescription,
    parameters,
    repeatLastArgs: clampRepeatLastArgs(metadata.repeatLastArgs, parameters.length),
    documentationUrl: doc.documentationUrl,
    examples: [...doc.examples],
  }
}

/**
 * Builds a Tier-1 list entry for a custom (user-registered) function, which ships no catalogue doc. The name is the
 * only authored information: `category` is reported as `'Custom'` and there is no `shortDescription`.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildCustomFunctionListEntry(canonicalName: string, translate: TranslateName, aliasOf?: string): FunctionListEntry {
  // Every key with nothing to report is left out rather than filled with a placeholder, so a consumer tells "no
  // authored description" from "an empty one" and the object survives JSON.stringify unchanged: `shortDescription`
  // because a custom function has no catalogue entry to author it, `aliasOf` because a non-alias resolves to
  // nothing. `category` is the exception — `'Custom'` is a real value, not a stand-in for a missing one.
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: CUSTOM_FUNCTION_CATEGORY,
  }
}

/**
 * Builds Tier-2 details for a custom (user-registered) function from its structural metadata alone (no catalogue
 * doc): the `'Custom'` category, positional parameter names (`Arg1`, `Arg2`, ...), per-parameter optionality, and
 * `repeatLastArgs` (normalized by [[clampRepeatLastArgs]], exactly as on the built-in path). The authored fields —
 * `shortDescription`, `documentationUrl` and `examples` — have no source here, so they are omitted.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildCustomFunctionDetails(canonicalName: string, metadata: StructuralMetadata, translate: TranslateName, aliasOf?: string): FunctionDetails {
  const parameters = buildPositionalParameters(metadata.parameters ?? [])
  // Only the fields the implementation itself provides are emitted — see buildCustomFunctionListEntry for why an
  // absent key beats a placeholder value.
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    category: CUSTOM_FUNCTION_CATEGORY,
    parameters,
    repeatLastArgs: clampRepeatLastArgs(metadata.repeatLastArgs, parameters.length),
  }
}
