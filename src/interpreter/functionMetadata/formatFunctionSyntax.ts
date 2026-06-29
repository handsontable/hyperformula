/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Builds the human-readable syntax string for a function from its parameter list, e.g. `SUM(Number1, ...)`.
 * Reuses the convention previously shipped as `generateSyntax`: each optional parameter is wrapped in its own
 * `[brackets]`, and a single `, ...` suffix denotes that the trailing arguments repeat. Internal to the
 * functionMetadata module (docs generator + future consumers); not exported from the package index.
 *
 * @param {string} localizedName - the function name as shown to the user, e.g. `'SUMIF'`
 * @param {{ name: string, optional: boolean }[]} parameters - ordered parameters with optionality
 * @param {number} repeatLastArgs - number of trailing parameters that repeat; `> 0` adds the `, ...` suffix
 * @returns {string} the syntax string, e.g. `'SUMIF(Range, Criteria, [Sumrange])'`
 */
export function formatFunctionSyntax(
  localizedName: string,
  parameters: { name: string, optional: boolean }[],
  repeatLastArgs: number,
): string {
  const rendered = parameters.map(parameter => parameter.optional ? `[${parameter.name}]` : parameter.name)
  const repeatSuffix = repeatLastArgs > 0 ? ', ...' : ''
  return `${localizedName}(${rendered.join(', ')}${repeatSuffix})`
}
