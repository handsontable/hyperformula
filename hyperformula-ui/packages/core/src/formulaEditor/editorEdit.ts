import type { HighlightController } from "./highlightController";
import type { EditorContext } from "./types";

export interface EditorEdit {
  start: number;
  end: number;
  text: string;
  caret: number;
}

export function applyEditorEdit(
  ctx: EditorContext,
  highlights: HighlightController,
  edit: EditorEdit,
): void {
  ctx.kernel.replaceRange(edit.start, edit.end, edit.text);

  if (ctx.kernel.getState().cursor.offset !== edit.caret) {
    ctx.kernel.setCaret({ offset: edit.caret });
  }

  ctx.input.setText(ctx.kernel.getState().text);
  ctx.input.setCaret(edit.caret);
  highlights.afterMutation();
}
