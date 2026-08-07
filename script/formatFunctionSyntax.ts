/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {clampRepeatLastArgs} from '../src/interpreter/functionMetadata/buildFunctionDescriptions'

/**
 * Builds the human-readable syntax string for a function from its parameter list, e.g. `SUM(number1, ...)`.
 * Reuses the convention previously shipped as `generateSyntax`: each optional parameter is wrapped in its own
 * `[brackets]`, and a `, ...` suffix denotes that the trailing arguments repeat. A repeat group spanning more
 * than one parameter (e.g. SUMIFS' criterion-range/criterion pair) is rendered with its next occurrence spelled
 * out, `[criterion_range2, criterion2], ...`, so the group shape stays visible. Parameter names come from the
 * caller (the catalogue in `src/interpreter/functionMetadata/`, which spells them in snake_case) and are
 * reproduced verbatim. Dev-only, like the rest of `script/`: used by the built-in functions docs generator and
 * never bundled into the package.
 *
 * @param {string} localizedName - the function name as shown to the user, e.g. `'SUMIF'`
 * @param {{ name: string, optional: boolean }[]} parameters - ordered parameters with optionality
 * @param {number} repeatLastArgs - number of trailing parameters that repeat; a positive integer adds the repeat
 *   suffix, and anything else (or a count above `parameters.length`) is normalized away — see `repeatSuffix`
 * @returns {string} the syntax string, e.g. `'SUMIF(range, criteria, [sum_range])'`
 */
export function formatFunctionSyntax(
  localizedName: string,
  parameters: { name: string, optional: boolean }[],
  repeatLastArgs: number,
): string {
  const rendered = parameters.map(parameter => parameter.optional ? `[${parameter.name}]` : parameter.name)
  return `${localizedName}(${rendered.join(', ')}${repeatSuffix(parameters, repeatLastArgs)})`
}

/**
 * Renders the repeat suffix. A bare `, ...` after a multi-parameter repeat group would misread as "single
 * trailing arguments repeat" (e.g. `SUMIFS(sum_range, criterion_range1, criterion1, ...)` invites appending one
 * lone criterion), so for a group of two or more the next occurrence is spelled out by bumping the group names'
 * trailing `1`, Excel-docs style: `, [criterion_range2, criterion2], ...`. When any group name lacks the `1`
 * suffix the plain ellipsis is kept rather than inventing names.
 *
 * `repeatLastArgs` is normalized with `clampRepeatLastArgs` before it is used, so this module holds its own contract
 * independently of whoever computed the number. Unguarded, `parameters.slice(-repeatLastArgs)` silently returns the
 * whole list when the count exceeds it and the group is then taken from the wrong span, and a count on an empty
 * parameter list renders the nonsense `F(, ...)` / `F(, [], ...)`.
 *
 * @param {{ name: string, optional: boolean }[]} parameters - ordered parameters with optionality
 * @param {number} repeatLastArgs - number of trailing parameters that repeat
 */
function repeatSuffix(parameters: { name: string, optional: boolean }[], repeatLastArgs: number): string {
  const effectiveRepeatLastArgs = clampRepeatLastArgs(repeatLastArgs, parameters.length)
  if (effectiveRepeatLastArgs === 0) {
    return ''
  }
  const group = parameters.slice(-effectiveRepeatLastArgs)
  if (effectiveRepeatLastArgs > 1 && group.every(parameter => parameter.name.endsWith('1'))) {
    const nextGroup = group.map(parameter => `${parameter.name.slice(0, -1)}2`)
    return `, [${nextGroup.join(', ')}], ...`
  }
  return ', ...'
}
