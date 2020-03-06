import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {SimpleCellAddress} from '../Cell'
import {ColumnsSpan} from '../ColumnsSpan'
import {Maybe} from '../Maybe'
import {RowsSpan} from '../RowsSpan'
import {MatrixVertex} from './'

export class MatrixMapping {
  public readonly matrixMapping: Map<string, MatrixVertex> = new Map()

  public getMatrix(range: AbsoluteCellRange): Maybe<MatrixVertex> {
    return this.matrixMapping.get(range.toString())
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex) {
    this.matrixMapping.set(range.toString(), vertex)
  }

  public removeMatrix(range: string | AbsoluteCellRange) {
    this.matrixMapping.delete(range.toString())
  }

  public isFormulaMatrixInRow(sheet: number, row: number): boolean {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.spansThroughSheetRows(sheet, row) && mtx.isFormula()) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixInRows(span: RowsSpan) {
    for (const row of span.rows()) {
      if (this.isFormulaMatrixInRow(span.sheet, row)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixInColumn(sheet: number, column: number): boolean {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.spansThroughSheetColumn(sheet, column) && mtx.isFormula()) {
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
      if (mtx.isFormula() && mtx.getRange().doesOverlap(range)) {
        return true
      }
    }
    return false
  }

  public isFormulaMatrixAtAddress(address: SimpleCellAddress) {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.getRange().addressInRange(address) && mtx.isFormula()) {
        return true
      }
    }
    return false
  }

  public* numericMatrices(): IterableIterator<[string, MatrixVertex]> {
    for (const [mtxKey, mtx] of this.matrixMapping.entries()) {
      if (!mtx.isFormula()) {
        yield [mtxKey, mtx]
      }
    }
  }

  public* numericMatricesInRows(rowsSpan: RowsSpan): IterableIterator<[string, MatrixVertex]> {
    for (const [mtxKey, mtx] of this.matrixMapping.entries()) {
      if (mtx.spansThroughSheetRows(rowsSpan.sheet, rowsSpan.rowStart, rowsSpan.rowEnd) && !mtx.isFormula()) {
        yield [mtxKey, mtx]
      }
    }
  }

  public* numericMatricesInColumns(columnsSpan: ColumnsSpan): IterableIterator<[string, MatrixVertex]> {
    for (const [mtxKey, mtx] of this.matrixMapping.entries()) {
      if (mtx.spansThroughSheetColumn(columnsSpan.sheet, columnsSpan.columnStart, columnsSpan.columnEnd) && !mtx.isFormula()) {
        yield [mtxKey, mtx]
      }
    }
  }

  public* numericMatricesInRange(range: AbsoluteCellRange): IterableIterator<[string, MatrixVertex]> {
    for (const [mtxKey, mtx] of this.matrixMapping.entries()) {
      if (mtx.getRange().doesOverlap(range)) {
        yield [mtxKey, mtx]
      }
    }
  }

  public truncateMatricesByRows(rowsSpan: RowsSpan): MatrixVertex[] {
    const verticesToRemove = Array<MatrixVertex>()
    for (const [key, matrix] of this.numericMatricesInRows(rowsSpan)) {
      matrix.removeRows(rowsSpan)
      if (matrix.height === 0) {
        this.removeMatrix(key)
        verticesToRemove.push(matrix)
      }
    }
    return verticesToRemove
  }

  public truncateMatricesByColumns(columnsSpan: ColumnsSpan): MatrixVertex[] {
    const verticesToRemove = Array<MatrixVertex>()
    for (const [key, matrix] of this.numericMatricesInColumns(columnsSpan)) {
      matrix.removeColumns(columnsSpan)
      if (matrix.width === 0) {
        this.removeMatrix(key)
        verticesToRemove.push(matrix)
      }
    }
    return verticesToRemove
  }

  public destroy(): void {
    this.matrixMapping.clear()
  }
}
