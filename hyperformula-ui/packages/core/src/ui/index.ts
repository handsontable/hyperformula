export type { CallContext, FunctionPrefix } from "./caret";
export { activeCallContext, currentFunctionPrefix } from "./caret";
export { clear, createEl, ensureRelativePosition, findAncestor } from "./dom";
export type { FocusTrapOptions } from "./focusTrap";
export { FocusTrap } from "./focusTrap";
export type {
  CellRect,
  CellRun,
  FrozenPredicate,
  HighlightLayerKind,
  HighlightLayerOptions,
} from "./highlight";
export {
  classifyCellLayer,
  EPHEMERAL_COLOR,
  fillColor,
  groupCellsIntoRuns,
  HighlightLayer,
} from "./highlight";
export { LiveRegion } from "./liveRegion";
export type {
  ErrorOptions,
  ErrorPopupOptions,
  FunctionHelpOptions,
  FunctionHelpPopupOptions,
  LayoutDirection,
  PopupContextOptions,
  PopupHostOption,
  PopupsOptions,
  SuggestionItem,
  SuggestionsAriaState,
  SuggestionsHandlers,
  SuggestionsOptions,
} from "./popup";
export {
  cellErrorMessage,
  ErrorPopup,
  FunctionHelpPopup,
  PopupContext,
  SuggestionsPopup,
  setCellError,
  withSharedClose,
} from "./popup";
export { RichInput, VisualOverlay } from "./text";
