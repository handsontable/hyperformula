import type { CellTextSource, EngineCellAddress } from "./types";

/**
 * Reads a cell's editable text with the formula → serialized → value fallback chain.
 * Shared by adapters and demo hosts to seed editors from a {@link CellTextSource}.
 *
 * @category Engine
 */
export function readCellText(engine: CellTextSource, address: EngineCellAddress): string {
  const formula = engine.getCellFormula?.(address);

  if (typeof formula === "string" && formula.length > 0) {
    return formula;
  }

  const serialized = engine.getCellSerialized?.(address);

  if (serialized !== undefined && serialized !== null) {
    return String(serialized);
  }

  const value = engine.getCellValue?.(address);

  return value === null || value === undefined ? "" : String(value);
}
