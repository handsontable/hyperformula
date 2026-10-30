/**
 * Layout direction value taken by the builder/bar/editor `direction` options.
 *
 * @category Utilities
 */
export type LayoutDirection = "ltr" | "rtl";

export interface AnchorRect {
  left: number;
  top: number;
  height: number;
  width: number;
  direction: LayoutDirection;
}

export interface Position {
  left: number;
  top: number;
  maxHeight?: number;
  maxWidth?: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface BoundsRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PositionStrategy {
  compute(
    anchor: AnchorRect,
    popupRect: DOMRect,
    viewport: Viewport,
    bounds?: BoundsRect,
  ): Position;
}

/**
 * One autocomplete row: a function name or (`kind: "named"`) a named expression.
 *
 * @category Popups
 */
export interface SuggestionItem {
  value: string;
  description?: string;
  kind?: "named";
}

/**
 * ARIA combobox state the suggestions popup reports so the host input can mirror it.
 *
 * @category Popups
 */
export interface SuggestionsAriaState {
  expanded: boolean;
  listboxId: string;
  activeOptionId: string | null;
}

/**
 * Callbacks the suggestions popup invokes on selection, explicit close, and ARIA changes.
 *
 * @category Popups
 */
export interface SuggestionsHandlers {
  onSelect: (item: SuggestionItem) => void;
  onExplicitClose: () => void;
  onAriaStateChange?: (state: SuggestionsAriaState) => void;
}

/**
 * Autocomplete popup options.
 *
 * @category Popups
 */
export interface SuggestionsOptions {
  /**
   * Shows the keyboard-hints footer.
   *
   * @defaultValue `true`
   */
  showKeyboardHelp?: boolean;

  /**
   * Shows the close button.
   *
   * @defaultValue `false`
   */
  showClose?: boolean;

  /**
   * Includes named expressions among the suggestions.
   *
   * @defaultValue `true`
   */
  showNamedExpressions?: boolean;
}

/**
 * Function-help popup options.
 *
 * @category Popups
 */
export interface FunctionHelpOptions {
  /**
   * Shows the close button.
   *
   * @defaultValue `false`
   */
  showClose?: boolean;
}

/**
 * Error popup options.
 *
 * @category Popups
 */
export interface ErrorOptions {
  /**
   * Shows the close button.
   *
   * @defaultValue `false`
   */
  showClose?: boolean;
}

/**
 * Docks a popup into a host container instead of the floating overlay.
 *
 * @category Popups
 */
export interface PopupHostOption {
  /**
   * Host element (or selector) the popup mounts into. Omit for floating behavior. Passed to
   * the `FormulaBuilder` constructor, a selector that matches nothing logs a warning once and
   * the popup floats.
   */
  container?: HTMLElement | string;
}

/**
 * Popup options bag on `FormulaBuilderOptions`: the top-level `showClose` is the shared
 * default, overridable per popup.
 *
 * @category Popups
 */
export interface PopupsOptions {
  showClose?: boolean;
  suggestions?: SuggestionsOptions & PopupHostOption;
  fnHelp?: FunctionHelpOptions & PopupHostOption;
  error?: ErrorOptions;
}
