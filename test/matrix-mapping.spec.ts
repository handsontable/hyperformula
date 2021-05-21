import {MatrixMapping, MatrixVertex} from '../src/DependencyGraph'
import {adr} from './testUtils'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {buildNumberAst} from '../src/parser/Ast'
import {MatrixSize} from '../src/MatrixSize'

describe('MatrixMapping', () => {
  it('should be empty', () => {
    const matrixMapping = new MatrixMapping()

    expect(matrixMapping.count()).toEqual(0)
  })
  it('should set matrix', () => {
    const matrixMapping = new MatrixMapping()

    const vertex = new MatrixVertex(buildNumberAst(1), adr('A1'), new MatrixSize(2, 2))
    const range = AbsoluteCellRange.spanFrom(adr('A1'), 2, 2)
    matrixMapping.setMatrix(range, vertex)

    expect(matrixMapping.count()).toEqual(1)
    expect(matrixMapping.getMatrix(range)).toEqual(vertex)
  })

  it('should answer some questions', () => {
    const matrixMapping = new MatrixMapping()
    const vertex = new MatrixVertex(buildNumberAst(1), adr('B2'), new MatrixSize(2, 2))
    const range = AbsoluteCellRange.spanFrom(adr('B2'), 2, 2)
    matrixMapping.setMatrix(range, vertex)

    expect(matrixMapping.isFormulaMatrixInRow(0, 0)).toBe(false)
    expect(matrixMapping.isFormulaMatrixInRow(0, 1)).toBe(true)
    expect(matrixMapping.isFormulaMatrixAtAddress(adr('A1'))).toBe(false)
    expect(matrixMapping.isFormulaMatrixAtAddress(adr('B2'))).toBe(true)
    expect(matrixMapping.isFormulaMatrixInRange(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))).toEqual(false)
    expect(matrixMapping.isFormulaMatrixInRange(AbsoluteCellRange.spanFrom(adr('B1'), 1, 2))).toEqual(true)
    expect(matrixMapping.isFormulaMatrixInRange(AbsoluteCellRange.spanFrom(adr('A2'), 2, 1))).toEqual(true)
    expect(matrixMapping.isFormulaMatrixInColumn(0, 0)).toEqual(false)
    expect(matrixMapping.isFormulaMatrixInColumn(0, 1)).toEqual(true)
    expect(matrixMapping.isFormulaMatrixInRow(0, 0)).toEqual(false)
    expect(matrixMapping.isFormulaMatrixInRow(0, 1)).toEqual(true)
  })


  it('should move matrices below row', () => {
    const matrixMapping = new MatrixMapping()
    const vertex1 = new MatrixVertex(buildNumberAst(1), adr('B1'), new MatrixSize(2, 2))
    const range1 = AbsoluteCellRange.spanFrom(adr('B1'), 2, 2)
    const vertex2 = new MatrixVertex(buildNumberAst(1), adr('D2'), new MatrixSize(2, 2))
    const range2 = AbsoluteCellRange.spanFrom(adr('D2'), 2, 2)
    matrixMapping.setMatrix(range1, vertex1)
    matrixMapping.setMatrix(range2, vertex2)

    matrixMapping.moveMatrixVerticesAfterRowByRows(0, 0, 2)

    expect(matrixMapping.getMatrix(range1)).toBeUndefined()
    expect(matrixMapping.getMatrix(range2)).toBeUndefined()
    expect(matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('B3'), 2, 2))).toEqual(vertex1)
    expect(matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('D4'), 2, 2))).toEqual(vertex2)
  })
})
