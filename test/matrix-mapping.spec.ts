import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {ArrayMapping, ArrayVertex} from '../src/DependencyGraph'
import {ArraySize} from '../src/ArraySize'
import {buildNumberAst} from '../src/parser/Ast'
import {adr} from './testUtils'

describe('MatrixMapping', () => {
  it('should be empty', () => {
    const matrixMapping = new ArrayMapping()

    expect(matrixMapping.count()).toEqual(0)
  })
  it('should set matrix', () => {
    const matrixMapping = new ArrayMapping()

    const vertex = new ArrayVertex(buildNumberAst(1), adr('A1'), new ArraySize(2, 2))
    const range = AbsoluteCellRange.spanFrom(adr('A1'), 2, 2)
    matrixMapping.setMatrix(range, vertex)

    expect(matrixMapping.count()).toEqual(1)
    expect(matrixMapping.getMatrix(range)).toEqual(vertex)
  })

  it('should answer some questions', () => {
    const matrixMapping = new ArrayMapping()
    const vertex = new ArrayVertex(buildNumberAst(1), adr('B2'), new ArraySize(2, 2))
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
    const matrixMapping = new ArrayMapping()
    const vertex1 = new ArrayVertex(buildNumberAst(1), adr('B1'), new ArraySize(2, 2))
    const range1 = AbsoluteCellRange.spanFrom(adr('B1'), 2, 2)
    const vertex2 = new ArrayVertex(buildNumberAst(1), adr('D2'), new ArraySize(2, 2))
    const range2 = AbsoluteCellRange.spanFrom(adr('D2'), 2, 2)
    matrixMapping.setMatrix(range1, vertex1)
    matrixMapping.setMatrix(range2, vertex2)

    matrixMapping.moveMatrixVerticesAfterRowByRows(0, 0, 2)

    expect(matrixMapping.getMatrixByCorner(range1.start)).toBeUndefined()
    expect(matrixMapping.getMatrixByCorner(range2.start)).toBeUndefined()
    expect(matrixMapping.getMatrixByCorner(adr('B3'))).toEqual(vertex1)
    expect(matrixMapping.getMatrixByCorner(adr('D4'))).toEqual(vertex2)
  })
})
