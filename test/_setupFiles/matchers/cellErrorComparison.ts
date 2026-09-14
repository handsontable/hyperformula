/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * The one definition of what `toEqualError` compares, shared by both runners.
 *
 * The suite runs under Jest AND Karma/Jasmine, and each has its own matcher wrapper
 * (`_setupFiles/jest/toEqualError.ts`, `_setupFiles/matchers/toEqualError.ts`) because the
 * two runners register matchers differently and hand in a different equality helper. Only
 * the wrapper differs: the decision below used to be copy-pasted into both, and drifted —
 * a field added to one strip list and not the other passes under Jest while the browser
 * run reports hundreds of failures for a reason no diff explains. Keeping the decision here
 * makes that class of bug impossible: there is exactly one strip list to extend.
 */

/** Equality, supplied by whichever runner is active (`this.equals` in Jest, `util.equals` in Jasmine). */
export type EqualsFn = (actual: unknown, expected: unknown) => boolean

/**
 * Fields excluded from the structural comparison.
 *
 * These are asserted explicitly by the specs that care about them, rather than implicitly by
 * every error assertion in the suite. `message` is excluded because it is matched by substring
 * above; `root`, `address`, `propagated`, `originAddress` and `originAddressVersion` because an
 * expectation built by the `detailedError` test helper cannot know the vertex, the address, or how
 * far the engine had travelled when it recorded them.
 *
 * ADDING A FIELD TO `CellError` OR `DetailedCellError`? Add it here, once. Do not add it to a
 * runner wrapper.
 */
const IGNORED_IN_STRUCTURAL_COMPARE = {
  message: undefined,
  root: undefined,
  address: undefined,
  originFunction: undefined,
  argumentIndex: undefined,
  hasMessage: undefined,
  propagated: undefined,
  originAddress: undefined,
  originAddressVersion: undefined,
}

/**
 * Whether a received error matches an expected one.
 *
 * When both sides carry a message, the expected message is treated as a substring of the
 * received one and the remaining fields are compared structurally. Otherwise the two values
 * are compared as-is — which is what makes an expectation on a raw, message-less `CellError`
 * a strict, whole-object comparison.
 *
 * @param received - the value produced by the engine
 * @param expected - the value the spec asserts
 * @param equals - the active runner's deep-equality function
 */
export function cellErrorsMatch(received: any, expected: any, equals: EqualsFn): boolean {
  const bothCarryAMessage = typeof received === 'object' && typeof expected === 'object'
    && received.message != null && expected.message != null

  if (bothCarryAMessage && received.message.includes(expected.message)) {
    return equals(
      {...received, ...IGNORED_IN_STRUCTURAL_COMPARE},
      {...expected, ...IGNORED_IN_STRUCTURAL_COMPARE},
    )
  }

  return equals(received, expected)
}

/**
 * The failure text both runners print, so a mismatch reads identically whichever one found it.
 *
 * @param received - the value produced by the engine
 * @param expected - the value the spec asserts
 */
export function cellErrorMismatchMessage(received: any, expected: any): string {
  return `Expected ${JSON.stringify(received, null, 2)} to match ${JSON.stringify(expected, null, 2)}.`
}
