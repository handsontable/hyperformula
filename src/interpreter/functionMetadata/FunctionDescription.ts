/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * The function categories, in the order the built-in functions guide page presents them. This array is the source of
 * truth: `script/renderBuiltinFunctionsTable.ts` emits one `### <Category>` section per entry, in this order. The
 * hand-written category list in `docs/guide/built-in-functions.tmpl.md` duplicates these labels to build the page's
 * table of contents, so it must be kept in the same order &mdash; `script/generate-builtin-functions-doc.ts` asserts
 * that it is.
 *
 * The ten categories with an Excel equivalent use the same names as the official Excel docs
 * (https://support.microsoft.com/en-us/office/excel-functions-by-category-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb),
 * which name them in full words (e.g. "Math and trigonometry functions", "Lookup and reference functions") rather
 * than the abbreviated ribbon labels ("Math & Trig", "Lookup & Reference"). `Array manipulation`, `Matrix functions`
 * and `Operator` are HyperFormula-specific and have no Excel equivalent.
 */
export const FUNCTION_CATEGORIES = [
  'Array manipulation', 'Database', 'Date and time', 'Engineering',
  'Financial', 'Information', 'Logical', 'Lookup and reference',
  'Math and trigonometry', 'Matrix functions', 'Operator', 'Statistical', 'Text',
] as const

/**
 * Language-independent function category identifier.
 */
export type FunctionCategory = typeof FUNCTION_CATEGORIES[number]

/**
 * Storage: authored, human-readable metadata for one function parameter.
 */
export interface ParameterDoc {
  /** Display name as shown in the syntax, `snake_case`, e.g. `'sum_range'`. */
  name: string,
  /** What the argument does. Authored for every built-in parameter (English). */
  description: string,
}

/**
 * Storage: authored metadata for one canonical function. English (translations are a later phase).
 */
export interface FunctionDoc {
  category: FunctionCategory,
  /**
   * One-liner, sentence-case description (English). (A separate long description may follow later.)
   * May contain inline markdown links (absolute URLs only) and `<br>` line breaks; no other markup.
   */
  shortDescription: string,
  /** Ordered; length MUST equal the function's `implementedFunctions.parameters` length (implementation arity). */
  parameters: ParameterDoc[],
  /**
   * Link to the function's documentation. Required, and authored per entry rather than inherited from a shared
   * default: every built-in happens to point at the same guide page today, but the links are expected to become
   * per-function, so each entry owns its own value and changing one touches only that entry. Making it required also
   * means a new function cannot silently ship without a link.
   */
  documentationUrl: string,
  /** Usage examples (English). Authored for every built-in function; at least one per function. */
  examples?: string[],
}

/**
 * Public: a single entry of the short function list returned by `getAvailableFunctions`.
 */
export interface FunctionListEntry {
  /** Function name, translated for the active language. */
  localizedName: string,
  /** Language-independent function id, e.g. `'SUMIF'`. */
  canonicalName: string,
  /**
   * When this entry is an alias, the id of the function it resolves to (e.g. `'PERCENTILE.INC'` for
   * `'PERCENTILE'`); absent for non-alias functions. An alias borrows its target's category and description, so a
   * picker uses this field to collapse or annotate the aliases without having to call `getFunctionDetails` for
   * every entry. Same meaning as [[FunctionDetails.aliasOf]].
   */
  aliasOf?: string,
  /** Documented category; absent for custom (user-registered) functions that ship no catalogue entry. */
  category?: FunctionCategory,
  /**
   * One-liner description (English in the MVP). Empty (`''`) for custom functions.
   * May contain inline markdown links (absolute URLs) and `<br>` line breaks.
   */
  shortDescription: string,
}

/**
 * Public: a single parameter of a function's full details returned by `getFunctionDetails`.
 */
export interface FunctionParameterDescription {
  /** Human-readable parameter name. */
  name: string,
  /** What the argument does (English). Populated for every built-in parameter; `''` for custom functions. */
  description: string,
  /** `true` when the argument may be omitted. */
  optional: boolean,
}

/**
 * Public: the full details for one function returned by `getFunctionDetails`.
 */
export interface FunctionDetails {
  /** Function name, translated for the active language. */
  localizedName: string,
  /** Language-independent function id, e.g. `'SUMIF'`. */
  canonicalName: string,
  /**
   * When the queried id is an alias, the id of the function it resolves to (e.g. `'CEILING.PRECISE'` for
   * `'ISO.CEILING'`); `undefined` for non-alias functions. An alias borrows its target's metadata — including
   * `examples`, which spell the target's name — so a consumer rendering examples next to the alias can use this
   * field to detect and explain the relation.
   */
  aliasOf?: string,
  /** Documented category; absent for custom (user-registered) functions that ship no catalogue entry. */
  category?: FunctionCategory,
  /**
   * One-liner description (English in the MVP). Empty (`''`) for custom functions.
   * May contain inline markdown links (absolute URLs) and `<br>` line breaks.
   */
  shortDescription: string,
  /** The function's parameters, in declaration order. */
  parameters: FunctionParameterDescription[],
  /**
   * How many of the trailing `parameters` repeat indefinitely (a function with a variable number of arguments).
   * `0` when the argument list is fixed; e.g. `1` for `SUM(number1, ...)`, `2` for `SUMIFS` where the trailing
   * (criteria_range, criteria) pair repeats. The caller renders the syntax string from this.
   */
  repeatLastArgs: number,
  /**
   * Link to the function's documentation. Always a string: the link authored in the catalogue for built-ins, `''`
   * for custom functions.
   */
  documentationUrl: string,
  /** Usage examples (English). At least one per built-in function; `[]` for custom functions. */
  examples: string[],
}
