import type { Direction, EditorGridAdapter } from "../adapter/types";
import type { EngineBridge } from "../engine/engineBridge";
import type { HyperFormulaLike } from "../engine/types";
import type { Kernel } from "../kernel/kernel";
import type { KernelEventMap } from "../kernel/types";
import type { FunctionHelpPopup } from "../ui/popup/functionHelpPopup";
import type { PopupContext } from "../ui/popup/popupContext";
import type { SuggestionsPopup } from "../ui/popup/suggestionsPopup";
import type { FunctionHelpOptions, LayoutDirection, SuggestionsOptions } from "../ui/popup/types";
import type { RichInput } from "../ui/text/richInput";
import type { VisualOverlay } from "../ui/text/visualOverlay";
import type { IconsOptions } from "../ui/types";

/**
 * Options for `FormulaEditor`.
 *
 * @category Editor
 */
export interface FormulaEditorOptions {
  /**
   * Optional HyperFormula engine. Absent, autocomplete and named-expression annotation are
   * silently disabled — the editor still works for plain text.
   */
  hyperformula?: HyperFormulaLike;

  /** The narrow adapter slice the editor consumes — not the full `IGridAdapter`. */
  adapter: EditorGridAdapter;

  /** Extra class applied to the editor root (theming entry point). */
  className?: string;

  /** Text the editor opens with. */
  initialValue?: string;

  /**
   * Engine language for function-name localization.
   *
   * @defaultValue `"enGB"`
   */
  language?: string;

  /**
   * Engine sheet id used to resolve named expressions.
   *
   * @defaultValue `0`
   */
  sheetId?: number;

  /**
   * Layout direction of the editor and its popups.
   *
   * @defaultValue `"ltr"`
   */
  direction?: LayoutDirection;

  /** Receives the committed value; the optional `direction` drives the selection move. */
  onCommit?: (value: string, direction?: Direction) => void;

  /** Fires when the edit is cancelled (Escape). */
  onCancel?: () => void;

  /** Autocomplete popup overrides. */
  suggestionsOptions?: SuggestionsOptions;

  /** Function-help popup overrides. */
  fnHelpOptions?: FunctionHelpOptions;

  /** Host factories replacing the built-in icons; each one left out keeps its built-in SVG. */
  icons?: IconsOptions;

  /** Shared popup portal/positioning context, owned by `FormulaBuilder`. */
  popupCtx: PopupContext;
}

/**
 * Event map for `FormulaEditor.on` — kernel events re-exposed on the editor surface.
 *
 * @category Editor
 */
export type FormulaEditorEvents = KernelEventMap;

export interface EditorContext {
  readonly kernel: Kernel;
  readonly engine: EngineBridge;
  readonly adapter: EditorGridAdapter;
  readonly input: RichInput;
  readonly overlay: VisualOverlay;
  readonly suggestions: SuggestionsPopup;
  readonly fnHelp: FunctionHelpPopup;
  readonly rootEl: HTMLElement;
  readonly opts: Omit<FormulaEditorOptions, "hyperformula">;
  readonly refOpeners: string;
  readonly argSeparator: string;
}

export type CommandId = string;

export type ContextFlag = "popupOpen" | "fnHelpOpen" | "isFormula" | "always";

export interface KeyContext {
  popupOpen: boolean;
  fnHelpOpen: boolean;
  isFormula: boolean;
}

export interface Combo {
  key: string;
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
}

export interface Binding {
  combo: Combo;
  when: ContextFlag[];
  command: CommandId;
}

/**
 * Location currently hosting the shared editor: the inline cell overlay or the formula bar.
 *
 * @category Editor
 */
export type EditorHost = "inline" | "bar";

/**
 * Broker for the F6/Shift+F6 editor host toggle, registered via
 * `FormulaEditor.setHostToggleDelegate`.
 *
 * @remarks The toggle runs only while `isAvailable()` returns `true` (an active bar edit
 * session); `focusHost` reparents the shared editor and moves focus to the given host.
 *
 * @category Editor
 */
export interface HostToggleDelegate {
  isAvailable(): boolean;
  currentHost(): EditorHost;
  isDirty?(): boolean;
  focusHost(host: EditorHost): void;
}
