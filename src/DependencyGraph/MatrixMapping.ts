import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {filterWith} from '../generatorUtils'
import {MatrixVertex} from './'
import {ColumnsSpan} from '../ColumnsSpan'

export class MatrixMapping {
  private readonly matrixMapping: Map<string, MatrixVertex> = new Map()

  public getMatrix(range: AbsoluteCellRange): MatrixVertex | undefined {
    return this.matrixMapping.get(range.toString())
  }

  public setMatrix(range: AbsoluteCellRange, vertex: MatrixVertex) {
    this.matrixMapping.set(range.toString(), vertex)
  }

  public removeMatrix(range: string | AbsoluteCellRange) {
    this.matrixMapping.delete(range.toString())
  }

  public isFormulaMatrixInRows(sheet: number, rowStart: number, rowEnd: number = rowStart) {
    for (let row = rowStart; row <= rowEnd; ++row) {
      for (const mtx of this.matrixMapping.values()) {
        if (mtx.spansThroughSheetRows(sheet, row) && mtx.isFormula()) {
          return true
        }
      }
    }
    return false
  }

  public isFormulaMatrixInColumns(span: ColumnsSpan) {
    for (let col = span.columnStart; col <= span.columnEnd; ++col) {
      for (const mtx of this.matrixMapping.values()) {
        if (mtx.spansThroughSheetColumn(span.sheet, col) && mtx.isFormula()) {
          return true
        }
      }
    }
    return false
  }

  public isMatrixInRange(range: AbsoluteCellRange) {
    for (const mtx of this.matrixMapping.values()) {
      if (mtx.getRange().doesOverlap(range)) {
        return true
      }
    }
    return false
  }

  public* numericMatrices(): IterableIterator<[string, MatrixVertex]> {
    yield* filterWith(([, mtx]) => {
      return !mtx.isFormula()
    }, this.matrixMapping.entries())[Symbol.iterator]()
  }

  public* numericMatricesInRows(sheet: number, startRow: number, endRow: number = startRow): IterableIterator<[string, MatrixVertex]> {
    yield* filterWith(([, mtx]) => {
      return mtx.spansThroughSheetRows(sheet, startRow, endRow) && !mtx.isFormula()
    }, this.matrixMapping.entries()[Symbol.iterator]())
  }

  public* numericMatricesInColumns(sheet: number, startColumn: number, endColumn: number = startColumn): IterableIterator<[string, MatrixVertex]> {
    yield* filterWith(([, mtx]) => {
      return mtx.spansThroughSheetColumn(sheet, startColumn, endColumn) && !mtx.isFormula()
    }, this.matrixMapping.entries()[Symbol.iterator]())
  }

  public truncateMatricesByRows(sheet: number, startRow: number, endRow: number): MatrixVertex[] {
    const verticesToRemove = Array<MatrixVertex>()
    for (const [key, matrix] of this.numericMatricesInRows(sheet, startRow, endRow)) {
      matrix.removeRows(sheet, startRow, endRow)
      if (matrix.height === 0) {
        this.removeMatrix(key)
        verticesToRemove.push(matrix)
      }
    }
    return verticesToRemove
  }

  public truncateMatricesByColumns(sheet: number, startColumn: number, endColumn: number): MatrixVertex[] {
    const verticesToRemove = Array<MatrixVertex>()
    for (const [key, matrix] of this.numericMatricesInColumns(sheet, startColumn, endColumn)) {
      matrix.removeColumns(sheet, startColumn, endColumn)
      if (matrix.width === 0) {
        this.removeMatrix(key)
        verticesToRemove.push(matrix)
      }
    }
    return verticesToRemove
  }
}
