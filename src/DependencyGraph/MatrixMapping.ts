/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {addressKey, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {ColumnsSpan, RowsSpan} from '../Span'
import {MatrixVertex} from './'

export class MatrixMapping {
  public readonly matrixMapping: Map<string, MatrixVertex> = new Map()

  public getMatrix(range: AbsoluteCellRange): Maybe<MatrixVertex> {
    const matrix =  this.getMatrixByCorner(range.start)
    if (matrix?.getRange().sameAs(range)) {
      return matrix
    }
    return
  }

  public getMatrixByCorner(address: SimpleCellAddress): Maybe<MatrixVertex> {
    return this.matrixMapping.get(addressKey(address))
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex) {
    this.matrixMapping.set(addressKey(range.start), vertex)
  }

  public setMatrixByCorner(address: SimpleCellAddress, vertex: MatrixVertex) {
    this.matrixMapping.set(addressKey(address), vertex)
  }

  public removeMatrix(range: string | AbsoluteCellRange) {
    if (typeof range === 'string') {
      this.matrixMapping.delete(range)
    } else {
      this.matrixMapping.delete(addressKey(range.start))
    }
  }

  public count(): number {
    return this.matrixMapping.size
  }

  public* matricesInRows(rowsSpan: RowsSpan): IterableIterator<[string, MatrixVertex]> {
    for (const [mtxKey, mtx] of this.matrixMapping.entries()) {
      if (mtx.spansThroughSheetRows(rowsSpan.sheet, rowsSpan.rowStart, rowsSpan.rowEnd)) {
        yield [mtxKey, mtx]
      }
    }
  }

  public isFormulaMatrixInRow(sheet: number, row: number): boolean {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.spansThroughSheetRows(sheet, row)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixInAllRows(span: RowsSpan) {
    let result = true
    for (const row of span.rows()) {
      if (!this.isFormulaMatrixInRow(span.sheet, row)) {
        result = false
      }
    }
    return result
  }

  public isFormulaMatrixInColumn(sheet: number, column: number): boolean {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.spansThroughSheetColumn(sheet, column)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixInColumns(span: ColumnsSpan) {
    for (const col of span.columns()) {
      if (this.isFormulaMatrixInColumn(span.sheet, col)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixInRange(range: AbsoluteCellRange) {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.getRange().doesOverlap(range)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixAtAddress(address: SimpleCellAddress) {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.getRange().addressInRange(address)) {
        return true
      }
    }
    return false
  }

  public destroy(): void {
    this.matrixMapping.clear()
  }

  public moveMatrixVerticesAfterRowByRows(sheet: number, row: number, numberOfRows: number) {
    this.updateMatrixVerticesInSheet(sheet, (key: string, vertex: MatrixVertex) => {
      const range = vertex.getRange()
      return row <= range.start.row ? [range.shifted(0, numberOfRows), vertex] : undefined
    })
  }

  private updateMatrixVerticesInSheet(sheet: number, fn: (key: string, vertex: MatrixVertex) => Maybe<[AbsoluteCellRange, MatrixVertex]>) {
    const updated = Array<[AbsoluteCellRange, MatrixVertex]>()

    for (const [key, vertex] of this.matrixMapping.entries()) {
      if (vertex.sheet !== sheet) {
        continue
      }
      const result = fn(key, vertex)
      if (result !== undefined) {
        this.removeMatrix(key)
        updated.push(result)
      }
    }

    updated.forEach(([range, matrix]) => {
      this.setMatrix(range, matrix)
    })
  }
}
