/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionMetadata, FunctionArgument} from '../plugin/FunctionPlugin'
import {FunctionDoc, FunctionListEntry, FunctionDetails, FunctionParameterDescription} from './FunctionDescription'

/** Resolves a function's display name: the translation for the active language, or the canonical id as fallback. */
type TranslateName = (canonicalName: string) => string | undefined

/** The structural subset of `FunctionMetadata` the builders read (so callers/tests need not supply `method`). */
export type StructuralMetadata = Pick<FunctionMetadata, 'parameters' | 'repeatLastArgs'>

/**
 * The single shared documentation URL for the built-in catalogue (HF-300). Every built-in points at this one page in
 * v1 (no per-function anchors), so it is the default for a `FunctionDoc` that omits `documentationUrl` rather than a
 * value each catalogue entry repeats. Once the guide grows per-function anchors, an entry can override it.
 */
export const DEFAULT_DOCUMENTATION_URL = 'https://hyperformula.handsontable.com/docs/guide/built-in-functions.html'

/**
 * Returns whether a parameter may be omitted: it declares `optionalArg`, or it has a `defaultValue`.
 *
 * @param {FunctionArgument | undefined} arg - the structural argument metadata, or `undefined`
 */
export function isParameterOptional(arg: FunctionArgument | undefined): boolean {
  return arg?.optionalArg === true || arg?.defaultValue !== undefined
}

/**
 * Resolves the display name for a function: the translated name, or the canonical id when there is no usable
 * translation. Some bundled language packs leave a function untranslated as an empty string (e.g. `SWITCH` in
 * several locales), so an empty translation falls back to the canonical id just like a missing one.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup (returns `undefined` when untranslated)
 */
function resolveName(canonicalName: string, translate: TranslateName): string {
  const translated = translate(canonicalName)
  return translated === undefined || translated === '' ? canonicalName : translated
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
 * `repeatLastArgs` (how many trailing parameters repeat). The caller renders the syntax string from these.
 * `documentationUrl` comes from the catalogue doc, falling back to {@link DEFAULT_DOCUMENTATION_URL}; `examples`
 * falls back to `[]`. Built-in parameters carry authored descriptions; custom functions surface empty values.
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
    repeatLastArgs: metadata.repeatLastArgs ?? 0,
    documentationUrl: doc.documentationUrl ?? DEFAULT_DOCUMENTATION_URL,
    examples: [...(doc.examples ?? [])],
  }
}

/**
 * Builds a Tier-1 list entry for a custom (user-registered) function, which ships no catalogue doc. Only the name
 * is known; `category` is omitted and `shortDescription` is empty.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup
 * @param {string | undefined} aliasOf - the alias target's id when `canonicalName` is an alias, else `undefined`
 */
export function buildCustomFunctionListEntry(canonicalName: string, translate: TranslateName, aliasOf?: string): FunctionListEntry {
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    // See buildFunctionDetails: omitted for non-aliases instead of an `undefined` value.
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    // `category` is omitted rather than set to `undefined`, for the same reason as `aliasOf`: the key
    // would survive in memory but vanish through JSON.stringify, giving consumers two shapes for one function.
    shortDescription: '',
  }
}

/**
 * Builds Tier-2 details for a custom (user-registered) function from its structural metadata alone (no catalogue
 * doc): positional parameter names (`Arg1`, `Arg2`, ...), per-parameter optionality, and `repeatLastArgs`.
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
  // A pathological custom plugin may declare `repeatLastArgs` larger than its parameter count, which would render
  // as "the last N of M parameters repeat" with N > M. Clamp to the declared parameter count so the output stays
  // meaningful. (No built-in is affected, so the built-in path keeps the verbatim value.)
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    // See buildFunctionDetails: omitted for non-aliases instead of an `undefined` value.
    ...(aliasOf !== undefined ? {aliasOf} : {}),
    // `category` is omitted for the same reason: a custom function has no catalogue entry, and an
    // `undefined`-valued key disappears through JSON.stringify while an absent one round-trips cleanly.
    shortDescription: '',
    parameters,
    repeatLastArgs: Math.min(metadata.repeatLastArgs ?? 0, parameters.length),
    documentationUrl: '',
    examples: [],
  }
}
