import type { CellAddress, CellRange } from "../adapter/types";
import { TokenType } from "../lexer/tokens";
import type { NamedExprMeta, RangeRefMeta } from "../lexer/types";
import {
  assignRefIndex,
  makeRefIndexMap,
  paletteColorForIndex,
  type RefIndexMap,
} from "../theme/refPalette";
import { computeDecorations } from "../ui/text/decorations";
import { isFormula } from "./editorContext";
import type { EditorContext } from "./types";

export class HighlightController {
  private suppressed = false;

  constructor(private readonly ctx: EditorContext) {}

  private isOwnSheetRef(meta: Record<string, unknown>): boolean {
    return this.ctx.engine.isOwnSheet(meta.sheet as string | undefined);
  }

  private toAddress(meta: Record<string, unknown>, key: "start" | "end"): CellAddress {
    const part = meta[key] as { col: number; row: number };

    return { sheet: (meta.sheet as string) ?? "", col: part.col, row: part.row };
  }

  private buildRefIndexMap(excludeToken?: { start: number; end: number }): RefIndexMap {
    const refIndexMap = makeRefIndexMap();

    if (!isFormula(this.ctx.kernel)) {
      return refIndexMap;
    }

    for (const token of this.ctx.kernel.getTokens()) {
      if (excludeToken && token.start === excludeToken.start && token.end === excludeToken.end) {
        continue;
      }

      const isRef =
        token.type === TokenType.CELL_REF ||
        token.type === TokenType.RANGE_REF ||
        token.type === TokenType.NAMED_EXPR;

      if (isRef) {
        assignRefIndex(refIndexMap, token.value);
      }
    }

    return refIndexMap;
  }

  suppress(): void {
    if (this.suppressed) {
      return;
    }

    this.suppressed = true;
    this.ctx.adapter.setHighlights([]);
  }

  resume(): void {
    this.suppressed = false;
  }

  renderOverlay(): void {
    const text = this.ctx.kernel.getState().text;
    const tokens = isFormula(this.ctx.kernel) ? this.ctx.kernel.getTokens() : [];
    const decorations = computeDecorations(tokens, this.ctx.input.getCaret());

    this.ctx.overlay.render(tokens, text, decorations);
  }

  previewColorFor(refStr: string, replacingToken?: { start: number; end: number }): string {
    const refIndexMap = this.buildRefIndexMap(replacingToken);

    return paletteColorForIndex(assignRefIndex(refIndexMap, refStr));
  }

  pushHighlights(): void {
    if (this.suppressed || !isFormula(this.ctx.kernel)) {
      this.ctx.adapter.setHighlights([]);

      return;
    }

    const tokens = this.ctx.kernel.getTokens();
    const caret = this.ctx.input.getCaret();
    const refIndexMap = this.buildRefIndexMap();
    const items: { range: CellRange; color: string; fill: boolean; whole?: "column" | "row" }[] =
      [];

    for (const token of tokens) {
      const meta = token.meta as Record<string, unknown> | undefined;

      if (!meta || !this.isOwnSheetRef(meta)) {
        continue;
      }

      const refIndex = assignRefIndex(refIndexMap, token.value);
      const color = paletteColorForIndex(refIndex);
      const fill = caret >= token.start && caret <= token.end;

      if (token.type === TokenType.NAMED_EXPR) {
        const namedMeta = meta as NamedExprMeta;

        if (namedMeta.kind === "cell") {
          const address: CellAddress = {
            sheet: namedMeta.sheet,
            col: namedMeta.cell.col,
            row: namedMeta.cell.row,
          };

          items.push({ range: { start: address, end: address }, color, fill });
        } else if (namedMeta.kind === "range") {
          const { sheet } = namedMeta;

          items.push({
            range: {
              start: { sheet, col: namedMeta.range.start.col, row: namedMeta.range.start.row },
              end: { sheet, col: namedMeta.range.end.col, row: namedMeta.range.end.row },
            },
            color,
            fill,
          });
        }

        continue;
      }

      if (token.type === TokenType.RANGE_REF && "start" in meta && "end" in meta) {
        const rangeMeta = meta as unknown as RangeRefMeta;

        if (rangeMeta.whole) {
          const expanded = this.ctx.engine.expandWholeRange(rangeMeta);

          if (expanded) {
            items.push({ range: expanded, color, fill, whole: rangeMeta.whole });
          }

          continue;
        }

        items.push({
          range: {
            start: this.toAddress(meta, "start"),
            end: this.toAddress(meta, "end"),
          },
          color,
          fill,
        });
      } else if (token.type === TokenType.CELL_REF) {
        const address: CellAddress = {
          sheet: (meta.sheet as string) ?? "",
          col: meta.col as number,
          row: meta.row as number,
        };

        items.push({ range: { start: address, end: address }, color, fill });
      }
    }

    this.ctx.adapter.setHighlights(items);
  }

  afterMutation(): void {
    this.renderOverlay();
    this.pushHighlights();
  }
}
