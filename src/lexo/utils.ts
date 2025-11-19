/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  LexoWorkBook,
  PodId,
  BagId,
  ScenarioId,
  CellId,
  LexoCellValue,
  CellValueType,
} from './types'
import {RawCellContent} from '../CellContentParser'

/**
 * Parse cell address like "A1" to row/col indices
 */
export function parseCellAddress(address: string): { row: number; col: number } {
  const match = address.match(/^([A-Z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Invalid cell address: ${address}`)
  }

  // Convert column letters to index (A=0, B=1, ..., Z=25, AA=26, etc.)
  const colLetters = match[1]
  let col = 0
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1)
  }
  col -= 1 // Convert to 0-based

  const row = parseInt(match[2]) - 1 // Convert to 0-based

  return { row, col }
}

/**
 * Convert row/col indices to cell address like "A1"
 */
export function indicesToCellAddress(col: number, row: number): string {
  let colStr = ''
  let colNum = col + 1 // Convert to 1-based
  
  while (colNum > 0) {
    const remainder = (colNum - 1) % 26
    colStr = String.fromCharCode('A'.charCodeAt(0) + remainder) + colStr
    colNum = Math.floor((colNum - 1) / 26)
  }
  
  return `${colStr}${row + 1}`
}

/**
 * Find pod by name, optionally within a specific bag
 */
export function findPodByName(
  workbook: LexoWorkBook,
  podName: string,
  bagName?: string
): PodId | undefined {
  for (const podId of workbook.pods.allIds) {
    const pod = workbook.pods.byId[podId]
    if (pod.name === podName) {
      if (bagName) {
        const bag = workbook.bags.byId[pod.bagId]
        if (bag.name === bagName) {
          return podId
        }
      } else {
        return podId
      }
    }
  }
  return undefined
}

/**
 * Get cell value for a specific scenario
 */
export function getCellValueForScenario(
  workbook: LexoWorkBook,
  scenarioId: ScenarioId,
  cellId: CellId
): CellValueType | null {
  const scenario = workbook.scenarios.byId[scenarioId]
  if (!scenario) {
    return null
  }

  // Check computed values first (for data pods with formulas)
  const computedValue = scenario.computedCellValues[cellId]
  if (computedValue !== undefined) {
    if (computedValue.error) {
      return null // Errors are handled separately
    }
    return computedValue.value === '' ? null : computedValue.value
  }

  // Check input values (for scenario pods)
  const inputValue = scenario.inputCellValues[cellId]
  if (inputValue !== undefined) {
    if (inputValue.error) {
      return null
    }
    return inputValue.value === '' ? null : inputValue.value
  }

  // Check base cell content
  const cell = workbook.cells.byId[cellId]
  if (cell?.content) {
    if (cell.content.error) {
      return null
    }
    return cell.content.value === '' ? null : cell.content.value
  }

  return null
}

/**
 * Convert lexo cell value to HyperFormula RawCellContent
 */
export function lexoValueToRawContent(value: CellValueType | null): RawCellContent {
  if (value === null || value === undefined || value === '') {
    return null
  }
  return value
}

/**
 * Get the grid dimensions for a pod
 */
export function getPodDimensions(workbook: LexoWorkBook, podId: PodId): { rows: number; cols: number } {
  const pod = workbook.pods.byId[podId]
  if (!pod) {
    return { rows: 0, cols: 0 }
  }
  return {
    rows: pod.rowOrder.length,
    cols: pod.colOrder.length,
  }
}

/**
 * Get cell ID from pod, row, and col indices
 */
export function getCellIdFromIndices(
  workbook: LexoWorkBook,
  podId: PodId,
  rowIndex: number,
  colIndex: number
): CellId | undefined {
  const pod = workbook.pods.byId[podId]
  if (!pod) return undefined

  const rowId = pod.rowOrder[rowIndex]
  const colId = pod.colOrder[colIndex]
  
  if (!rowId || !colId) return undefined

  // Lexo cell IDs are formatted as: podId_rowId_colId (with underscores)
  return `${podId}_${rowId}_${colId}`
}

