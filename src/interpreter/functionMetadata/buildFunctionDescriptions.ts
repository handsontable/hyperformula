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
 */
export function buildFunctionListEntry(canonicalName: string, doc: FunctionDoc, translate: TranslateName): FunctionListEntry {
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    category: doc.category,
    shortDescription: doc.shortDescription,
  }
}

/**
 * Builds a Tier-2 details object: the list fields plus the parameter list (name, description, optionality) and
 * `repeatLastArgs` (how many trailing parameters repeat). The caller renders the syntax string from these.
 * `documentationUrl`, `examples` and each parameter `description` are present but empty in the MVP.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 * @throws {Error} when `doc.parameters.length` does not equal `(metadata.parameters ?? []).length`
 */
export function buildFunctionDetails(canonicalName: string, doc: FunctionDoc, metadata: StructuralMetadata, translate: TranslateName): FunctionDetails {
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
    category: doc.category,
    shortDescription: doc.shortDescription,
    parameters,
    repeatLastArgs: metadata.repeatLastArgs ?? 0,
    documentationUrl: '',
    examples: [],
  }
}

/**
 * Builds a Tier-1 list entry for a custom (user-registered) function, which ships no catalogue doc. Only the name
 * is known; `category` is `undefined` and `shortDescription` is empty.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {TranslateName} translate - per-id translation lookup
 */
export function buildCustomFunctionListEntry(canonicalName: string, translate: TranslateName): FunctionListEntry {
  return {
    localizedName: resolveName(canonicalName, translate),
    canonicalName,
    category: undefined,
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
 */
export function buildCustomFunctionDetails(canonicalName: string, metadata: StructuralMetadata, translate: TranslateName): FunctionDetails {
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
    category: undefined,
    shortDescription: '',
    parameters,
    repeatLastArgs: Math.min(metadata.repeatLastArgs ?? 0, parameters.length),
    documentationUrl: '',
    examples: [],
  }
}
