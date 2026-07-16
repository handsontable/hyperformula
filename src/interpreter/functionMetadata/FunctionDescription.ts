/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * The function categories, matching the `### <Category>` headers in `docs/guide/built-in-functions.md`.
 *
 * The ten categories with an Excel equivalent use the same names as the official Excel docs
 * (https://support.microsoft.com/en-us/office/excel-functions-by-category-5f91f4e9-7b42-46d2-9bd1-63f26a86c0eb),
 * which name them in full words (e.g. "Math and trigonometry functions", "Lookup and reference functions") rather
 * than the abbreviated ribbon labels ("Math & Trig", "Lookup & Reference"). `Array manipulation`, `Matrix functions`
 * and `Operator` are HyperFormula-specific and have no Excel equivalent.
 */
export const FUNCTION_CATEGORIES = [
  'Array manipulation', 'Database', 'Date and time', 'Engineering',
  'Information', 'Financial', 'Logical', 'Lookup and reference',
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
  /** Display name as shown in the syntax, Google-Sheets style, e.g. `'Factor1'`. */
  name: string,
  /** What the argument does. Authored for every built-in parameter (English). */
  description: string,
}

/**
 * Storage: authored metadata for one canonical function. English (translations are a later phase).
 */
export interface FunctionDoc {
  category: FunctionCategory,
  /** One-liner, sentence-case description (English). (A separate long description may follow later.) */
  shortDescription: string,
  /** Ordered; length MUST equal the function's `implementedFunctions.parameters` length (implementation arity). */
  parameters: ParameterDoc[],
  /**
   * Link to the function's documentation. Required for all functions.
   */
  documentationUrl?: string,
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
  /** Documented category, or `undefined` for custom (user-registered) functions that ship no catalogue entry. */
  category: FunctionCategory | undefined,
  /** One-liner description (English in the MVP). Empty (`''`) for custom functions. */
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
  /** Documented category, or `undefined` for custom (user-registered) functions that ship no catalogue entry. */
  category: FunctionCategory | undefined,
  /** One-liner description (English in the MVP). Empty (`''`) for custom functions. */
  shortDescription: string,
  /** The function's parameters, in declaration order. */
  parameters: FunctionParameterDescription[],
  /**
   * How many of the trailing `parameters` repeat indefinitely (a function with a variable number of arguments).
   * `0` when the argument list is fixed; e.g. `1` for `SUM(Number1, ...)`, `2` for `SUMIFS` where the last
   * (Criteria range, Criterion) pair repeats. The caller renders the syntax string from this.
   */
  repeatLastArgs: number,
  /** Link to the function's documentation. The single shared docs URL for built-ins; `''` for custom functions. */
  documentationUrl: string,
  /** Usage examples (English). At least one per built-in function; `[]` for custom functions. */
  examples: string[],
}
