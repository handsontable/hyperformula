/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Lexo-HyperFormula integration module
 * 
 * This module provides utilities to evaluate lexo-workbook formulas using HyperFormula.
 * It handles the conversion between lexo's pod/bag/scenario structure and HyperFormula's
 * sheet-based model.
 * 
 * @example
 * ```typescript
 * import { evaluate } from 'hyperformula/lexo';
 * 
 * const result = evaluate(workbook, 'scenario1', 'pod1', '=SUM(A1:A10)');
 * ```
 */

export {
  evaluate,
  clearCache,
  parseToAst,
} from './evaluator'

export {
  convertPodToSheet,
  convertWorkbookToSheets,
  translateLexoFormula,
} from './converter'

export {
  parseCellAddress,
  indicesToCellAddress,
  findPodByName,
  getCellValueForScenario,
} from './utils'

export type {
  LexoWorkBook,
  BagId,
  PodId,
  RowId,
  ColId,
  CellId,
  ScenarioId,
  LexoBag,
  LexoPod,
  LexoRow,
  LexoColumn,
  LexoCell,
  LexoScenario,
  LexoCellValue,
  LexoCellError,
  LexoEvalResult,
} from './types'

