import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {filterWith} from '../generatorUtils'
import {MatrixVertex} from './Vertex'

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

  public isFormulaMatrixInColumns(sheet: number, colStart: number, colEnd: number = colStart) {
    for (let col = colStart; col <= colEnd; ++col) {
      for (const mtx of this.matrixMapping.values()) {
        if (mtx.spansThroughSheetColumn(sheet, col) && mtx.isFormula()) {
          return true
        }
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
}
