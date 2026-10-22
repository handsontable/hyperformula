import type { Phrases } from "./types";

/**
 * The English phrases the editor uses unless the `phrases` option replaces them.
 *
 * @category Utilities
 */
export const DEFAULT_PHRASES: Readonly<Phrases> = Object.freeze({
  formulaEditor: "Formula editor",
  formulaInput: "Formula input",
  cellAddress: "Cell address",
  formulaSuggestions: "Formula suggestions",
  acceptSuggestionHint: "to accept.",
  navigateSuggestionsHint: "to navigate",
  functionHelp: "Function help",
  functionHelpFor: (functionName: string) => `${functionName} function help`,
  learnMore: "Learn more",
  close: "Close",
  invalidCellAddress: (text: string) => `Invalid cell address: ${text}`,
  cellUnavailable: (text: string) => `Cannot select ${text}`,
  cellError: (cellAddress: string, message: string) => `Error in ${cellAddress}: ${message}.`,
  dependentCellErrors: (count: number) =>
    count === 1 ? "1 more cell now contains an error." : `${count} more cells now contain errors.`,
});

export function resolvePhrases(overrides?: Partial<Phrases>): Phrases {
  return { ...DEFAULT_PHRASES, ...overrides };
}
