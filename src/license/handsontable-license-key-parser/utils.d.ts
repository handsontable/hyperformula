/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Hand-written declarations for `utils.js`, which is a verbatim copy of upstream.
 * See PROVENANCE.md: the JavaScript is not edited here, so the types live beside it.
 *
 * `bytesToBase64` and `stringToBase64Url` are upstream's generation-side helpers. They are
 * declared because the file exports them, and nothing in HyperFormula calls them.
 */

/** A date in `YYYY-MM-DD`, split into its parts plus the epoch milliseconds of its UTC midnight. */
export interface ParsedIsoDate {
  year: number,
  month: number,
  day: number,
  timestamp: number,
}

/** Freezes the value and everything reachable from it, in place, and returns it. */
export function deepFreeze<T>(value: T): T

/**
 * Parses a `YYYY-MM-DD` date. Throws when the value is not a string, is malformed, or names a day
 * that does not exist in the calendar.
 *
 * The parameter is `unknown` rather than `string` because upstream checks the type itself, and
 * these declarations state what the code does rather than what a caller ought to pass.
 *
 * @param {unknown} isoDate - the value to parse
 * @param {string} dateLabel - the field name used in the error message
 */
export function parseIsoDate(isoDate: unknown, dateLabel: string): ParsedIsoDate

/** UTF-8 encodes the text. */
export function stringToUtf8Bytes(text: string): number[]

/** Decodes UTF-8 bytes back to text. */
export function utf8BytesToString(bytes: number[]): string

/** Base64-encodes the bytes. Generation-side; unused in HyperFormula. */
export function bytesToBase64(bytes: number[]): string

/** Decodes base64 or base64url, tolerating missing padding. `null` when the input is not base64. */
export function base64ToBytes(base64: string): number[] | null

/** Base64url-encodes the text. Generation-side; unused in HyperFormula. */
export function stringToBase64Url(text: string): string

/** Decodes base64 to text. `null` when the input is not base64. */
export function base64ToString(base64: string): string | null
