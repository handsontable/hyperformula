/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawCellContent} from './CellContentParser'

/**
 * Two-dimenstional array representation of sheet
 */
export type Sheet = RawCellContent[][]

export type Sheets = Record<string, Sheet>

/**
 * Represents size and fill ratio of a sheet
*/
export interface SheetBoundaries {
  width: number,
  height: number,
  fill: number,
}

/**
 * Returns actual width, height and fill ratio of a sheet
 *
 * @param sheet - two-dimmensional array sheet representation
 */
export function findSheetBoundaries(sheet: Sheet): SheetBoundaries {
  let maxWidth = 0
  let cellsCount = 0
  for (let currentRow = 0; currentRow < sheet.length; currentRow++) {
    const currentRowWidth = sheet[currentRow].length
    if (maxWidth === undefined || maxWidth < currentRowWidth) {
      maxWidth = currentRowWidth
    }
    for (let currentCol = 0; currentCol < currentRowWidth; currentCol++) {
      const currentValue = sheet[currentRow][currentCol]
      if (currentValue !== '') {
        cellsCount++
      }
    }
  }
  const sheetSize = sheet.length * maxWidth

  return {
    height: sheet.length,
    width: maxWidth,
    fill: sheetSize === 0 ? 0 : cellsCount / sheetSize,
  }
}