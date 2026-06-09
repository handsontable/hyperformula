/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionPluginDefinition, FunctionMetadata, FunctionArgument} from '../plugin/FunctionPlugin'
import {FunctionDoc, FunctionListEntry, FunctionDetails, FunctionParameterDescription} from './FunctionDescription'

/** Resolves a function's display name: the translation for the active language, or the canonical id as fallback. */
type TranslateName = (canonicalName: string) => string | undefined

/** The structural subset of `FunctionMetadata` the builders read (so callers/tests need not supply `method`). */
export type StructuralMetadata = Pick<FunctionMetadata, 'parameters' | 'repeatLastArgs'>

/**
 * Returns the canonical function id set: the union of every plugin's `implementedFunctions` keys.
 *
 * Aliases (kept in a separate `plugin.aliases` map) and protected ids (e.g. `VERSION`, `OFFSET`, registered
 * outside the regular plugin set) are excluded by construction. Operators such as `HF.ADD` are included because
 * they live in an arithmetic plugin's `implementedFunctions`.
 *
 * @param {FunctionPluginDefinition[]} plugins - registered function plugins, e.g. from `FunctionRegistry.getPlugins()`
 */
export function getCanonicalFunctionIds(plugins: FunctionPluginDefinition[]): string[] {
  const ids = new Set<string>()
  plugins.forEach(plugin => {
    Object.keys(plugin.implementedFunctions).forEach(id => ids.add(id))
  })
  return Array.from(ids)
}

/**
 * Returns whether a parameter may be omitted: it declares `optionalArg`, or it has a `defaultValue`.
 *
 * @param {FunctionArgument | undefined} arg - the structural argument metadata, or `undefined`
 */
export function isParameterOptional(arg: FunctionArgument | undefined): boolean {
  return arg?.optionalArg === true || arg?.defaultValue !== undefined
}

/**
 * Builds the display syntax string from parameter names and structural metadata. Required parameters are rendered
 * bare, optional ones in brackets, and a trailing `, ...` is appended when the last `repeatLastArgs` parameters repeat.
 *
 * @param {string} displayName - the function name to show (the translated name in the active language)
 * @param {string[]} parameterNames - authored parameter names, index-aligned with `metadata.parameters`
 * @param {StructuralMetadata} metadata - structural metadata (`parameters` + `repeatLastArgs`) from `implementedFunctions`
 */
export function generateSyntax(displayName: string, parameterNames: string[], metadata: StructuralMetadata): string {
  const args = metadata.parameters ?? []
  const rendered = parameterNames.map((name, index) => isParameterOptional(args[index]) ? `[${name}]` : name)
  const repeatSuffix = (metadata.repeatLastArgs ?? 0) > 0 ? ', ...' : ''
  return `${displayName}(${rendered.join(', ')}${repeatSuffix})`
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
    name: resolveName(canonicalName, translate),
    canonicalName,
    category: doc.category,
    shortDescription: doc.shortDescription,
  }
}

/**
 * Builds a Tier-2 details object: the list fields plus generated syntax and per-parameter optionality/repeatability.
 * `documentationUrl`, `examples` and each parameter `description` are present but empty in the MVP.
 *
 * @param {string} canonicalName - the language-independent function id
 * @param {FunctionDoc} doc - the function's authored catalogue entry
 * @param {StructuralMetadata} metadata - structural metadata from `implementedFunctions`
 * @param {TranslateName} translate - per-id translation lookup
 */
export function buildFunctionDetails(canonicalName: string, doc: FunctionDoc, metadata: StructuralMetadata, translate: TranslateName): FunctionDetails {
  const name = resolveName(canonicalName, translate)
  const args = metadata.parameters ?? []
  const repeatLastArgs = metadata.repeatLastArgs ?? 0
  const firstRepeatableIndex = doc.parameters.length - repeatLastArgs
  const parameters: FunctionParameterDescription[] = doc.parameters.map((param, index) => ({
    name: param.name,
    description: param.description,
    optional: isParameterOptional(args[index]),
    repeatable: repeatLastArgs > 0 && index >= firstRepeatableIndex,
  }))
  return {
    name,
    canonicalName,
    category: doc.category,
    shortDescription: doc.shortDescription,
    syntax: generateSyntax(name, doc.parameters.map(parameter => parameter.name), metadata),
    parameters,
    documentationUrl: '',
    examples: [],
  }
}
