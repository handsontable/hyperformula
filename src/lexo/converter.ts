/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {
  LexoWorkBook,
  PodId,
  ScenarioId,
} from './types'
import {Sheet} from '../Sheet'
import {
  getCellValueForScenario,
  lexoValueToRawContent,
  getPodDimensions,
  getCellIdFromIndices,
} from './utils'

/**
 * Convert a lexo pod's scenario data to a HyperFormula sheet (2D array)
 */
export function convertPodToSheet(
  workbook: LexoWorkBook,
  podId: PodId,
  scenarioId: ScenarioId
): Sheet {
  const dimensions = getPodDimensions(workbook, podId)
  
  // Create empty 2D array
  const sheet: Sheet = []
  
  for (let row = 0; row < dimensions.rows; row++) {
    const sheetRow: any[] = []
    for (let col = 0; col < dimensions.cols; col++) {
      const cellId = getCellIdFromIndices(workbook, podId, row, col)
      if (cellId) {
        const value = getCellValueForScenario(workbook, scenarioId, cellId)
        sheetRow.push(lexoValueToRawContent(value))
      } else {
        sheetRow.push(null)
      }
    }
    sheet.push(sheetRow)
  }
  
  return sheet
}

/**
 * Convert all pods in a workbook to sheets for a specific scenario
 */
export function convertWorkbookToSheets(
  workbook: LexoWorkBook,
  scenarioId: ScenarioId
): Record<string, Sheet> {
  const sheets: Record<string, Sheet> = {}
  
  for (const podId of workbook.pods.allIds) {
    const pod = workbook.pods.byId[podId]
    const bag = workbook.bags.byId[pod.bagId]
    
    // Create sheet name: BagName__PodName to ensure uniqueness
    const sheetName = `${bag.name}__${pod.name}`
    sheets[sheetName] = convertPodToSheet(workbook, podId, scenarioId)
  }
  
  return sheets
}

/**
 * Translate lexo-style formula to HyperFormula format
 * Converts references like:
 *   - A1 -> A1 (same pod)
 *   - Pod2!A1 -> BagName__Pod2!A1
 *   - Bag2!Pod3!A1 -> Bag2__Pod3!A1
 */
export function translateLexoFormula(
  workbook: LexoWorkBook,
  currentPodId: PodId,
  formula: string
): string {
  // Ensure formula starts with =
  let translated = formula.trim()
  if (!translated.startsWith('=')) {
    translated = `=${translated}`
  }

  const currentPod = workbook.pods.byId[currentPodId]
  const currentBag = workbook.bags.byId[currentPod.bagId]

  // STEP 1: Replace cross-bag references (Bag!Pod!Cell or 'Bag'!'Pod'!Cell)
  // Pattern: optional quotes around bag, !, optional quotes around pod, !, cell reference
  const crossBagPattern = /(?:'([^']+)'|([A-Za-z0-9_\s]+))!(?:'([^']+)'|([A-Za-z0-9_\s]+))!([A-Z]+\d+)/g
  translated = translated.replace(
    crossBagPattern,
    (match, quotedBag, bag, quotedPod, pod, cell) => {
      const bagName = (quotedBag || bag).trim()
      const podName = (quotedPod || pod).trim()
      return `${bagName}__${podName}!${cell}`
    }
  )

  // STEP 2: Replace cross-bag ranges (Bag!Pod!A1:B2)
  const crossBagRangePattern = /(?:'([^']+)'|([A-Za-z0-9_\s]+))!(?:'([^']+)'|([A-Za-z0-9_\s]+))!([A-Z]+\d+):([A-Z]+\d+)/g
  translated = translated.replace(
    crossBagRangePattern,
    (match, quotedBag, bag, quotedPod, pod, startCell, endCell) => {
      const bagName = (quotedBag || bag).trim()
      const podName = (quotedPod || pod).trim()
      return `${bagName}__${podName}!${startCell}:${endCell}`
    }
  )

  // STEP 3: Replace same-bag pod references (Pod!Cell or 'Pod Name'!Cell)
  // We need to find the pod and prepend the bag name
  const sameBagPattern = /(?:'([^']+)'|([A-Za-z0-9_\s]+))!([A-Z]+\d+)/g
  translated = translated.replace(
    sameBagPattern,
    (match, quotedPod, pod, cell) => {
      const podName = (quotedPod || pod).trim()
      
      // Find the pod in current bag
      const targetPodId = workbook.pods.allIds.find(id => {
        const p = workbook.pods.byId[id]
        return p.name === podName && p.bagId === currentPod.bagId
      })
      
      if (targetPodId) {
        return `${currentBag.name}__${podName}!${cell}`
      }
      
      // If not found in current bag, keep original
      return match
    }
  )

  // STEP 4: Replace same-bag pod ranges (Pod!A1:B2)
  const sameBagRangePattern = /(?:'([^']+)'|([A-Za-z0-9_\s]+))!([A-Z]+\d+):([A-Z]+\d+)/g
  translated = translated.replace(
    sameBagRangePattern,
    (match, quotedPod, pod, startCell, endCell) => {
      const podName = (quotedPod || pod).trim()
      
      // Find the pod in current bag
      const targetPodId = workbook.pods.allIds.find(id => {
        const p = workbook.pods.byId[id]
        return p.name === podName && p.bagId === currentPod.bagId
      })
      
      if (targetPodId) {
        return `${currentBag.name}__${podName}!${startCell}:${endCell}`
      }
      
      return match
    }
  )

  return translated
}

