import { colLettersToIndex, TokenType } from "../lexer/tokens";
import type { NamedExprMeta, Token } from "../lexer/types";
import type { HyperFormulaLike, NamedExprResolution } from "./types";

export type NamedExprResolver = (name: string) => NamedExprResolution | null;

function metaFor(resolution: NamedExprResolution): NamedExprMeta {
  return { named: true, ...resolution };
}

export function annotateNamedExprs(tokens: Token[], resolve: NamedExprResolver): Token[] {
  return tokens.map((token) => {
    if (token.type !== TokenType.IDENT) {
      return token;
    }

    const resolution = resolve(token.value);

    if (!resolution) {
      return token;
    }

    return { ...token, type: TokenType.NAMED_EXPR, meta: metaFor(resolution) };
  });
}

export function sheetDimensions(
  engine: HyperFormulaLike | undefined,
  sheetId: number,
): { width: number; height: number } | undefined {
  try {
    return engine?.getSheetDimensions?.(sheetId);
  } catch {
    return undefined;
  }
}

export function expandWholeSpan(
  engine: HyperFormulaLike | undefined,
  contextSheetId: number,
  body: string,
): NamedExprResolution | null {
  const columnMatch = body.match(/^(?:(.+)!)?\$?([A-Za-z]+):\$?([A-Za-z]+)$/);
  const rowMatch = body.match(/^(?:(.+)!)?\$?(\d+):\$?(\d+)$/);

  if (!columnMatch && !rowMatch) {
    return null;
  }

  const rawSheet = (columnMatch ?? rowMatch)?.[1];
  const sheetName = rawSheet ? rawSheet.replace(/^'(.*)'$/, "$1").replace(/''/g, "'") : undefined;
  const sheetId = sheetName ? engine?.getSheetId?.(sheetName) : contextSheetId;

  if (sheetId === undefined) {
    return null;
  }

  const dimensions = sheetDimensions(engine, sheetId);

  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    return null;
  }

  const resolvedSheetName = engine?.getSheetName?.(sheetId) ?? "";

  if (columnMatch) {
    const startCol = colLettersToIndex((columnMatch[2] ?? "").toUpperCase());
    const endCol = colLettersToIndex((columnMatch[3] ?? "").toUpperCase());

    return {
      kind: "range",
      sheet: resolvedSheetName,
      range: {
        start: { col: Math.min(startCol, endCol), row: 0 },
        end: { col: Math.max(startCol, endCol), row: dimensions.height - 1 },
      },
    };
  }

  const startRow = Number.parseInt(rowMatch?.[2] ?? "1", 10) - 1;
  const endRow = Number.parseInt(rowMatch?.[3] ?? "1", 10) - 1;

  return {
    kind: "range",
    sheet: resolvedSheetName,
    range: {
      start: { col: 0, row: Math.min(startRow, endRow) },
      end: { col: dimensions.width - 1, row: Math.max(startRow, endRow) },
    },
  };
}
