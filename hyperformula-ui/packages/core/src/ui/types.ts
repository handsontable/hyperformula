/**
 * A glyph the editor renders: the popup close button (`close`), the function-help "Learn more"
 * link (`externalLink`), the named-expression marker in suggestions (`namedExpression`), and
 * the formula bar's fx icon (`function`).
 *
 * @category Theming
 */
export type IconName = "close" | "externalLink" | "namedExpression" | "function";

/**
 * Host factories that replace the built-in glyphs, keyed by {@link IconName}. A factory is
 * called once per rendered icon and must return a new element each time. An icon left out
 * keeps its built-in SVG.
 *
 * @category Theming
 */
export type IconsOptions = Partial<Record<IconName, () => Element>>;

/**
 * The words the editor shows or speaks: accessible names, hints, and screen-reader
 * announcements. Pass a partial object through the `phrases` option to translate them; every
 * phrase left out keeps its English default from {@link DEFAULT_PHRASES}.
 *
 * @category Utilities
 */
export interface Phrases {
  /** Accessible name of the formula editor's text box. */
  formulaEditor: string;

  /** Accessible name of the formula bar's idle formula cell. */
  formulaInput: string;

  /** Accessible name of the formula bar's address box. */
  cellAddress: string;

  /** Accessible name of the suggestions list. */
  formulaSuggestions: string;

  /** Text after the Tab key chip in the suggestions footer; the popup adds the spaces around it. */
  acceptSuggestionHint: string;

  /** Text after the arrow key chips in the suggestions footer; the popup adds the space before it. */
  navigateSuggestionsHint: string;

  /** Accessible name of the function help popup before it shows a function. */
  functionHelp: string;

  /** Accessible name of the function help popup showing `functionName`. */
  functionHelpFor: (functionName: string) => string;

  /** Text of the link to a function's documentation. */
  learnMore: string;

  /** Accessible name of a popup's close button. */
  close: string;

  /** Announcement for address-box input that names no cell or range the grid can select. */
  invalidCellAddress: (text: string) => string;

  /** Announcement for a committed cell that now shows an error. */
  cellError: (cellAddress: string, message: string) => string;

  /** Announcement for other cells that now show an error after a commit. */
  dependentCellErrors: (count: number) => string;
}
