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
 *
 * This is the *documented* category set &mdash; the categories a catalogue entry may declare and the only ones the
 * generated page renders. [[CUSTOM_FUNCTION_CATEGORY]] is deliberately NOT a member: it gets no `### ` section, and
 * adding it here would break `script/generate-builtin-functions-doc.ts`'s assertion that the template's table of
 * contents matches this array label for label.
 */
export const FUNCTION_CATEGORIES = [
  'Array manipulation', 'Database', 'Date and time', 'Engineering',
  'Financial', 'Information', 'Logical', 'Lookup and reference',
  'Math and trigonometry', 'Matrix functions', 'Operator', 'Statistical', 'Text',
] as const

/**
 * A category a built-in function's catalogue entry ([[FunctionDoc]]) may declare: one of [[FUNCTION_CATEGORIES]],
 * never [[CUSTOM_FUNCTION_CATEGORY]]. Every documented function therefore lands in one of the sections the generated
 * built-in functions page renders, which is what keeps that page's rows complete.
 */
export type DocumentedFunctionCategory = typeof FUNCTION_CATEGORIES[number]

/**
 * The category reported for a custom (user-registered) function. Such a function ships no catalogue entry, so it has
 * none of the documented categories &mdash; but `category` is a required field, so it is reported under this one
 * rather than by omitting the key. Not a member of [[FUNCTION_CATEGORIES]]: it names no section of the built-in
 * functions guide page.
 */
export const CUSTOM_FUNCTION_CATEGORY = 'Custom'

/**
 * Language-independent function category identifier: one of the documented categories for a built-in function, or
 * `'Custom'` for a user-registered one.
 */
export type FunctionCategory = DocumentedFunctionCategory | typeof CUSTOM_FUNCTION_CATEGORY

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
  /** Documented category. Restricted to [[FUNCTION_CATEGORIES]]: a catalogue entry can never be `'Custom'`. */
  category: DocumentedFunctionCategory,
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
  /**
   * Function category: one of the documented categories for a built-in function, `'Custom'` for a custom
   * (user-registered) one, which ships no catalogue entry. Always present.
   */
  category: FunctionCategory,
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
  /**
   * Function category: one of the documented categories for a built-in function, `'Custom'` for a custom
   * (user-registered) one, which ships no catalogue entry. Always present.
   */
  category: FunctionCategory,
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
   *
   * Always an integer in `[0, parameters.length]`, for a custom (user-registered) function too: a declared value the
   * interpreter would not honour (negative, fractional, `NaN`, `Infinity`) is reported as `0`, and a valid count
   * larger than the parameter list is clamped to it, so "the last N of M parameters repeat" is never nonsense.
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
