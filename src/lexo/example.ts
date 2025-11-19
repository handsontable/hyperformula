/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Example usage of lexo-HyperFormula integration
 * 
 * This file demonstrates how to use the eval function from lexo-workbook
 */

import { evaluate, clearCache } from './evaluator'
import type { LexoWorkBook } from './types'

/**
 * Example workbook with simple structure
 */
function createExampleWorkbook(): LexoWorkBook {
  return {
    bags: {
      byId: {
        'bag1': {
          id: 'bag1',
          name: 'Main',
          podIds: ['pod1', 'pod2'],
        },
      },
      allIds: ['bag1'],
    },
    pods: {
      byId: {
        'pod1': {
          id: 'pod1',
          bagId: 'bag1',
          name: 'Revenue',
          type: 'data',
          rowOrder: ['row1', 'row2', 'row3'],
          colOrder: ['col1', 'col2'],
          cellIds: [],
        },
        'pod2': {
          id: 'pod2',
          bagId: 'bag1',
          name: 'Expenses',
          type: 'data',
          rowOrder: ['row1', 'row2'],
          colOrder: ['col1', 'col2'],
          cellIds: [],
        },
      },
      allIds: ['pod1', 'pod2'],
    },
    rows: {
      byId: {
        'row1': { id: 'row1', index: 0 },
        'row2': { id: 'row2', index: 1 },
        'row3': { id: 'row3', index: 2 },
      },
    },
    cols: {
      byId: {
        'col1': { id: 'col1', index: 0 },
        'col2': { id: 'col2', index: 1 },
      },
    },
    cells: {
      byId: {},
    },
    scenarios: {
      byId: {
        'scenario1': {
          id: 'scenario1',
          name: 'Base Case',
          inputCellValues: {
            // Revenue pod cells
            'pod1:row1:col1': { value: 100 },
            'pod1:row2:col1': { value: 200 },
            'pod1:row3:col1': { value: 300 },
            // Expenses pod cells
            'pod2:row1:col1': { value: 50 },
            'pod2:row2:col1': { value: 75 },
          },
          computedCellValues: {},
        },
      },
      allIds: ['scenario1'],
    },
  }
}

/**
 * Run example evaluations
 */
export function runExamples() {
  const workbook = createExampleWorkbook()
  const scenarioId = 'scenario1'
  const podId = 'pod1'

  console.log('=== Lexo-HyperFormula Integration Examples ===\n')

  // Example 1: Simple SUM
  console.log('Example 1: SUM of local cells')
  const result1 = evaluate(workbook, scenarioId, podId, '=SUM(A1:A3)')
  console.log('Formula: =SUM(A1:A3)')
  console.log('Result:', result1) // Expected: 600
  console.log()

  // Example 2: Cross-pod reference
  console.log('Example 2: Cross-pod reference')
  const result2 = evaluate(workbook, scenarioId, podId, '=A1 + Expenses!A1')
  console.log('Formula: =A1 + Expenses!A1')
  console.log('Result:', result2) // Expected: 150
  console.log()

  // Example 3: Complex formula with multiple functions
  console.log('Example 3: Complex formula')
  const result3 = evaluate(workbook, scenarioId, podId, '=AVERAGE(A1:A3) * 2')
  console.log('Formula: =AVERAGE(A1:A3) * 2')
  console.log('Result:', result3) // Expected: 400
  console.log()

  // Example 4: IF function
  console.log('Example 4: IF function')
  const result4 = evaluate(workbook, scenarioId, podId, '=IF(A1>150, "High", "Low")')
  console.log('Formula: =IF(A1>150, "High", "Low")')
  console.log('Result:', result4) // Expected: "Low"
  console.log()

  // Example 5: Error handling - invalid reference
  console.log('Example 5: Error handling')
  const result5 = evaluate(workbook, scenarioId, podId, '=A1 + InvalidPod!A1')
  console.log('Formula: =A1 + InvalidPod!A1')
  console.log('Result:', result5) // Expected: error object
  console.log()

  // Clean up
  clearCache()
  console.log('Cache cleared')
}

// Uncomment to run examples:
// runExamples()

