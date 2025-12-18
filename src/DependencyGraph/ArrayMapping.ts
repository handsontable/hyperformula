/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {addressKey, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {ColumnsSpan, RowsSpan} from '../Span'
import {ArrayFormulaVertex} from './'

/**
 * Maps top-left corner addresses to their ArrayFormulaVertex instances.
 * An ArrayFormulaVertex is created for formulas that output multiple values (e.g., MMULT, TRANSPOSE, array literals).
 * The same ArrayFormulaVertex is referenced in AddressMapping for all cells within its spill range.
 * ArrayFormulaVertex lifecycle:
 * - Prediction (ArraySizePredictor.checkArraySize) → determines if formula will produce array
 * - Creation → new ArrayFormulaVertex(...) added via addArrayFormulaVertex()
 * - Address registration → setAddressMappingForArrayFormulaVertex() sets the vertex for all cells in range
 * - Evaluation → computes actual values, stores in ArrayFormulaVertex.array
 * - Shrinking → if content placed in array area, array shrinks via shrinkArrayToCorner()
 */
export class ArrayMapping {
  public readonly arrayMapping: Map<string, ArrayFormulaVertex> = new Map()

  public getArray(range: AbsoluteCellRange): Maybe<ArrayFormulaVertex> {
    const array = this.getArrayByCorner(range.start)
    if (array?.getRange().sameAs(range)) {
      return array
    }
    return
  }

  public getArrayByCorner(address: SimpleCellAddress): Maybe<ArrayFormulaVertex> {
    return this.arrayMapping.get(addressKey(address))
  }

  public setArray(range: AbsoluteCellRange, vertex: ArrayFormulaVertex) {
    this.arrayMapping.set(addressKey(range.start), vertex)
  }

  public removeArray(range: string | AbsoluteCellRange) {
    if (typeof range === 'string') {
      this.arrayMapping.delete(range)
    } else {
      this.arrayMapping.delete(addressKey(range.start))
    }
  }

  public count(): number {
    return this.arrayMapping.size
  }

  public* arraysInRows(rowsSpan: RowsSpan): IterableIterator<[string, ArrayFormulaVertex]> {
    for (const [mtxKey, mtx] of this.arrayMapping.entries()) {
      if (mtx.spansThroughSheetRows(rowsSpan.sheet, rowsSpan.rowStart, rowsSpan.rowEnd)) {
        yield [mtxKey, mtx]
      }
    }
  }

  public* arraysInCols(col: ColumnsSpan): IterableIterator<[string, ArrayFormulaVertex]> {
    for (const [mtxKey, mtx] of this.arrayMapping.entries()) {
      if (mtx.spansThroughSheetColumn(col.sheet, col.columnStart, col.columnEnd)) {
        yield [mtxKey, mtx]
      }
    }
  }

  public isFormulaArrayInRow(sheet: number, row: number): boolean {
    for (const mtx of this.arrayMapping.values()) {
      if (mtx.spansThroughSheetRows(sheet, row)) {
        return true
      }
    }
    return false
  }

  public isFormulaArrayInAllRows(span: RowsSpan): boolean {
    let result = true
    for (const row of span.rows()) {
      if (!this.isFormulaArrayInRow(span.sheet, row)) {
        result = false
      }
    }
    return result
  }

  public isFormulaArrayInColumn(sheet: number, column: number): boolean {
    for (const mtx of this.arrayMapping.values()) {
      if (mtx.spansThroughSheetColumn(sheet, column)) {
        return true
      }
    }
    return false
  }

  public isFormulaArrayInAllColumns(span: ColumnsSpan): boolean {
    let result = true
    for (const col of span.columns()) {
      if (!this.isFormulaArrayInColumn(span.sheet, col)) {
        result = false
      }
    }
    return result
  }

  public isFormulaArrayInRange(range: AbsoluteCellRange) {
    for (const mtx of this.arrayMapping.values()) {
      if (mtx.getRange().doesOverlap(range)) {
        return true
      }
    }
    return false
  }

  public isFormulaArrayAtAddress(address: SimpleCellAddress) {
    for (const mtx of this.arrayMapping.values()) {
      if (mtx.getRange().addressInRange(address)) {
        return true
      }
    }
    return false
  }

  public moveArrayVerticesAfterRowByRows(sheet: number, row: number, numberOfRows: number) {
    this.updateArrayVerticesInSheet(sheet, (key: string, vertex: ArrayFormulaVertex) => {
      const range = vertex.getRange()
      return row <= range.start.row ? [range.shifted(0, numberOfRows), vertex] : undefined
    })
  }

  public moveArrayVerticesAfterColumnByColumns(sheet: number, column: number, numberOfColumns: number) {
    this.updateArrayVerticesInSheet(sheet, (key: string, vertex: ArrayFormulaVertex) => {
      const range = vertex.getRange()
      return column <= range.start.col ? [range.shifted(numberOfColumns, 0), vertex] : undefined
    })
  }

  private updateArrayVerticesInSheet(sheet: number, fn: (key: string, vertex: ArrayFormulaVertex) => Maybe<[AbsoluteCellRange, ArrayFormulaVertex]>) {
    const updated = Array<[AbsoluteCellRange, ArrayFormulaVertex]>()

    for (const [key, vertex] of this.arrayMapping.entries()) {
      if (vertex.sheet !== sheet) {
        continue
      }
      const result = fn(key, vertex)
      if (result !== undefined) {
        this.removeArray(key)
        updated.push(result)
      }
    }

    updated.forEach(([range, array]) => {
      this.setArray(range, array)
    })
  }
}
