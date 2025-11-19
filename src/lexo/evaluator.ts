/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {HyperFormula} from '../HyperFormula'
import {SimpleCellAddress} from '../Cell'
import {CellError, ErrorType} from '../Cell'
import {DetailedCellError, CellValue} from '../CellValue'
import {
  LexoWorkBook,
  PodId,
  ScenarioId,
  LexoEvalResult,
  LexoCellError,
} from './types'
import {convertWorkbookToSheets, translateLexoFormula} from './converter'

/**
 * Cached HyperFormula instances per scenario
 * Key format: `${workbookHash}:${scenarioId}`
 */
const instanceCache = new Map<string, {
  hf: HyperFormula;
  podToSheetMap: Map<PodId, number>;
}>()

/**
 * Generate a simple hash for workbook (based on pod count and IDs)
 * This is used for cache invalidation
 */
function getWorkbookHash(workbook: LexoWorkBook): string {
  return workbook.pods.allIds.join(',')
}

/**
 * Get or create HyperFormula instance for a scenario
 */
function getHyperFormulaInstance(
  workbook: LexoWorkBook,
  scenarioId: ScenarioId
): { hf: HyperFormula; podToSheetMap: Map<PodId, number> } {
  const cacheKey = `${getWorkbookHash(workbook)}:${scenarioId}`
  
  // Check cache
  const cached = instanceCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Create new instance
  const sheets = convertWorkbookToSheets(workbook, scenarioId)
  const hf = HyperFormula.buildFromSheets(sheets, {
    licenseKey: 'gpl-v3',
  })

  // Build pod to sheet ID mapping
  const podToSheetMap = new Map<PodId, number>()
  for (const podId of workbook.pods.allIds) {
    const pod = workbook.pods.byId[podId]
    const bag = workbook.bags.byId[pod.bagId]
    const sheetName = `${bag.name}__${pod.name}`
    const sheetId = hf.getSheetId(sheetName)
    if (sheetId !== undefined) {
      podToSheetMap.set(podId, sheetId)
    }
  }

  const instance = { hf, podToSheetMap }
  instanceCache.set(cacheKey, instance)
  
  return instance
}

/**
 * Convert HyperFormula error to LexoCellError
 */
function convertError(error: CellError | DetailedCellError): LexoCellError {
  const errorType = error instanceof DetailedCellError ? error.type : error.type
  
  const errorTypeMap: Record<ErrorType, string> = {
    [ErrorType.VALUE]: 'SYNTAX',
    [ErrorType.REF]: 'REF',
    [ErrorType.CYCLE]: 'CYCLE',
    [ErrorType.DIV_BY_ZERO]: 'DIV0',
    [ErrorType.NUM]: 'SYNTAX',
    [ErrorType.NA]: 'REF',
    [ErrorType.NAME]: 'REF',
    [ErrorType.ERROR]: 'SYNTAX',
    [ErrorType.SPILL]: 'SYNTAX',
    [ErrorType.LIC]: 'SYNTAX',
  }

  const message = error instanceof DetailedCellError ? error.message : (error.message || 'Formula error')
  
  return {
    code: errorTypeMap[errorType] || 'SYNTAX',
    message: message,
  }
}

/**
 * Main evaluation function - evaluates a formula in the context of a workbook and scenario
 * 
 * @param workbook - The lexo workbook
 * @param scenarioId - The scenario to evaluate in
 * @param podId - The pod context for the formula
 * @param formula - The formula to evaluate (with or without leading =)
 * @returns The evaluated result or error
 */
export function evaluate(
  workbook: LexoWorkBook,
  scenarioId: ScenarioId,
  podId: PodId,
  formula: string
): LexoEvalResult {
  try {
    // Get or create HyperFormula instance
    const { hf, podToSheetMap } = getHyperFormulaInstance(workbook, scenarioId)

    // Get sheet ID for the pod
    const sheetId = podToSheetMap.get(podId)
    if (sheetId === undefined) {
      return {
        code: 'REF',
        message: 'Pod not found in scenario',
      }
    }

    // Translate formula from lexo format to HyperFormula format
    const translatedFormula = translateLexoFormula(workbook, podId, formula)

    // Use a temporary cell at a reasonable location to avoid conflicts
    // Row 10000, Col 0 should be safe and within default limits
    const tempAddress: SimpleCellAddress = {
      sheet: sheetId,
      row: 10000,
      col: 0,
    }

    // Set the formula
    hf.setCellContents(tempAddress, translatedFormula)

    // Get the computed value
    const result: CellValue = hf.getCellValue(tempAddress)

    // Clean up temp cell
    hf.setCellContents(tempAddress, null)

    // Convert result
    if (result instanceof DetailedCellError) {
      return convertError(result)
    }

    // Return primitive values (number, string, boolean, null)
    return result as LexoEvalResult
  } catch (error) {
    return {
      code: 'SYNTAX',
      message: error instanceof Error ? error.message : 'Invalid formula',
    }
  }
}

/**
 * Clear the cache for a specific scenario or all scenarios
 */
export function clearCache(workbook?: LexoWorkBook, scenarioId?: ScenarioId): void {
  if (workbook && scenarioId) {
    const cacheKey = `${getWorkbookHash(workbook)}:${scenarioId}`
    const cached = instanceCache.get(cacheKey)
    if (cached) {
      cached.hf.destroy()
      instanceCache.delete(cacheKey)
    }
  } else {
    // Clear all
    for (const cached of instanceCache.values()) {
      cached.hf.destroy()
    }
    instanceCache.clear()
  }
}

/**
 * Evaluate a formula and return AST (for debugging/analysis)
 */
export function parseToAst(
  workbook: LexoWorkBook,
  podId: PodId,
  formula: string
): any {
  try {
    // Get HyperFormula instance (any scenario will do for parsing)
    const scenarioId = workbook.scenarios.allIds[0]
    if (!scenarioId) {
      throw new Error('No scenarios available')
    }

    const { hf, podToSheetMap } = getHyperFormulaInstance(workbook, scenarioId)
    const sheetId = podToSheetMap.get(podId)
    
    if (sheetId === undefined) {
      throw new Error('Pod not found')
    }

    // Translate formula
    const translatedFormula = translateLexoFormula(workbook, podId, formula)
    
    // Use HyperFormula's parser (access internal parser)
    const address: SimpleCellAddress = { sheet: sheetId, row: 0, col: 0 }
    // @ts-ignore - accessing private parser for debugging purposes
    const ast = hf._parser.parse(translatedFormula, address)
    
    return ast
  } catch (error) {
    throw new Error(`Failed to parse formula: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

