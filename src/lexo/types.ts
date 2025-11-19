/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Lexo workbook type definitions
 * These mirror the types from lexo-workbook without creating a direct dependency
 */

export type BagId = string;
export type PodId = string;
export type RowId = string;
export type ColId = string;
export type CellId = string;
export type ScenarioId = string;

export type PodType = 'scenario' | 'data';
export type CellValueType = number | string | boolean;
export type CellErrorType = 'SYNTAX' | 'REF' | 'CYCLE' | 'DIV0' | string;

export interface LexoWorkBook {
  bags: {
    byId: Record<BagId, LexoBag>;
    allIds: BagId[];
  };
  pods: {
    byId: Record<PodId, LexoPod>;
    allIds: PodId[];
  };
  rows: {
    byId: Record<RowId, LexoRow>;
  };
  cols: {
    byId: Record<ColId, LexoColumn>;
  };
  cells: {
    byId: Record<CellId, LexoCell>;
  };
  scenarios: {
    byId: Record<ScenarioId, LexoScenario>;
    allIds: ScenarioId[];
  };
}

export interface LexoBag {
  id: BagId;
  name: string;
  podIds: PodId[];
}

export interface LexoPod {
  id: PodId;
  bagId: BagId;
  name: string;
  type: PodType;
  rowOrder: RowId[];
  colOrder: ColId[];
  cellIds: CellId[];
}

export interface LexoRow {
  id: RowId;
  index: number;
}

export interface LexoColumn {
  id: ColId;
  index: number;
}

export interface LexoCellError {
  code: CellErrorType;
  message: string;
}

export interface LexoCellValue {
  value: CellValueType | '';
  error?: LexoCellError;
}

export interface LexoCell {
  id: CellId;
  podId: PodId;
  rowId: RowId;
  colId: ColId;
  address?: string;
  content?: LexoCellValue;
  isFormula?: boolean;
}

export interface LexoScenario {
  id: ScenarioId;
  name: string;
  inputCellValues: Record<CellId, LexoCellValue>;
  computedCellValues: Record<CellId, LexoCellValue>;
}

/**
 * Result of evaluating a lexo formula
 */
export type LexoEvalResult = CellValueType | LexoCellError | null;

