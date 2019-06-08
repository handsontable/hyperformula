import { ExpectedValue} from '../benchmark'
import {sheetCellAddressToString} from '../../src/Cell'

const matrixSize = 1000

export function sheet(): string[][] {
  const sheet = []

  for (let i = 0; i < matrixSize; i++) {
    const rowToPush: string[] = []
    for (let j = 0; j < matrixSize; j++) {
      rowToPush.push(j.toString())
    }
    sheet.push(rowToPush)
  }

  const topRightCorner = sheetCellAddressToString({ row: matrixSize - 1, col: matrixSize - 1 })
  for (let i = 0; i < matrixSize; i++) {
    const rowToPush: string[] = []
    for (let j = 0; j < matrixSize; j++) {
      rowToPush.push(`{=MMULT(A1:${topRightCorner}, A1:${topRightCorner})}`)
    }
    sheet.push(rowToPush)
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: `$Sheet1.${sheetCellAddressToString({ row: matrixSize, col: 0 })}`, value: 0 },
    { address: `$Sheet1.${sheetCellAddressToString({ row: matrixSize + 1, col: 0 })}`, value: 0 },
    { address: `$Sheet1.${sheetCellAddressToString({ row: matrixSize, col: 1 })}`, value: 499500 },
    { address: `$Sheet1.${sheetCellAddressToString({ row: matrixSize, col: 2 })}`, value: 999000 },
  ]
}
