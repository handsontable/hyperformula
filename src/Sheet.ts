/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {RawCellContent} from './CellContentParser'
import {InvalidArgumentsError} from './errors'

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = RawCellContent[][]

export type Sheets = Record<string, Sheet>

/**
 * Represents size of a sheet
 */
export type SheetDimensions = {
  width: number,
  height: number,
}

/**
 * Represents size and fill ratio of a sheet
 */
export interface SheetBoundaries {
  width: number,
  height: number,
  fill: number,
}

export function validateAsSheet(sheet: Sheet): void {
  if (!Array.isArray(sheet)) {
    throw new InvalidArgumentsError('an array of arrays.')
  }
  for (let i = 0; i < sheet.length; i++) {
    if (!Array.isArray(sheet[i])) {
      throw new InvalidArgumentsError('an array of arrays.')
    }
  }
}

/**
 * Returns actual width, height and fill ratio of a sheet
 *
 * @param sheet - two-dimmensional array sheet representation
 */
export function findBoundaries(sheet: Sheet): SheetBoundaries {
  let width = 0
  let height = 0
  let cellsCount = 0

  for (let currentRow = 0; currentRow < sheet.length; currentRow++) {
    let currentRowWidth = 0
    for (let currentCol = 0; currentCol < sheet[currentRow].length; currentCol++) {
      const currentValue = sheet[currentRow][currentCol]
      if (currentValue === undefined || currentValue === null) {
        continue
      }
      currentRowWidth = currentCol + 1
      ++cellsCount
    }

    width = Math.max(width, currentRowWidth)
    if (currentRowWidth > 0) {
      height = currentRow + 1
    }
  }

  const sheetSize = width * height

  return {
    height: height,
    width: width,
    fill: sheetSize === 0 ? 0 : cellsCount / sheetSize,
  }
}
