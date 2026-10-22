import type { IGridAdapter } from "../../src/adapter/types";
import { FormulaEditor } from "../../src/formulaEditor/formulaEditor";
import type { FormulaEditorOptions } from "../../src/formulaEditor/types";
import { PopupContext } from "../../src/ui/popup/popupContext";
import { TestGridAdapter } from "./testGridAdapter";

type EditorHarnessOptions = Omit<Partial<FormulaEditorOptions>, "adapter" | "popupCtx"> & {
  adapter?: IGridAdapter;
};

export interface EditorHarness<TAdapter extends IGridAdapter> {
  host: HTMLDivElement;
  popupCtx: PopupContext;
  adapter: TAdapter;
  editor: FormulaEditor;
  destroy: () => void;
}

export function createEditorHarness(): EditorHarness<TestGridAdapter>;
export function createEditorHarness(
  options: EditorHarnessOptions & { adapter?: undefined },
): EditorHarness<TestGridAdapter>;
export function createEditorHarness<TAdapter extends IGridAdapter>(
  options: EditorHarnessOptions & { adapter: TAdapter },
): EditorHarness<TAdapter>;
export function createEditorHarness(
  options: EditorHarnessOptions = {},
): EditorHarness<IGridAdapter> {
  const { adapter: providedAdapter, ...editorOptions } = options;
  const adapter = providedAdapter ?? new TestGridAdapter();
  const host = document.createElement("div");
  const popupCtx = new PopupContext();
  const editor = new FormulaEditor(host, { adapter, popupCtx, ...editorOptions });

  return {
    host,
    popupCtx,
    adapter,
    editor,
    destroy: () => {
      editor.destroy();
      popupCtx.destroy();
    },
  };
}
