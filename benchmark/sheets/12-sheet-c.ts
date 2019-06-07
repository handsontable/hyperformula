import { ExpectedValue} from '../benchmark'
import {sheetCellAddressToString} from '../../src/Cell'

export function sheet(): string[][] {
  const matrixSize = 1000

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
    { address: '$Sheet1.A1', value:  500500 },
    { address: '$Sheet1.A2', value:  500500 },
    { address: '$Sheet1.B1', value: 1001000 },
  ]
}
