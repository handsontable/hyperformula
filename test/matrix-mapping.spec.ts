import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {ArraySize} from '../src/ArraySize'
import {ArrayMapping, ArrayVertex} from '../src/DependencyGraph'
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
    matrixMapping.setArray(range, vertex)

    expect(matrixMapping.count()).toEqual(1)
    expect(matrixMapping.getArray(range)).toEqual(vertex)
  })

  it('should answer some questions', () => {
    const matrixMapping = new ArrayMapping()
    const vertex = new ArrayVertex(buildNumberAst(1), adr('B2'), new ArraySize(2, 2))
    const range = AbsoluteCellRange.spanFrom(adr('B2'), 2, 2)
    matrixMapping.setArray(range, vertex)

    expect(matrixMapping.isFormulaArrayInRow(0, 0)).toBe(false)
    expect(matrixMapping.isFormulaArrayInRow(0, 1)).toBe(true)
    expect(matrixMapping.isFormulaArrayAtAddress(adr('A1'))).toBe(false)
    expect(matrixMapping.isFormulaArrayAtAddress(adr('B2'))).toBe(true)
    expect(matrixMapping.isFormulaArrayInRange(AbsoluteCellRange.spanFrom(adr('A1'), 1, 1))).toEqual(false)
    expect(matrixMapping.isFormulaArrayInRange(AbsoluteCellRange.spanFrom(adr('B1'), 1, 2))).toEqual(true)
    expect(matrixMapping.isFormulaArrayInRange(AbsoluteCellRange.spanFrom(adr('A2'), 2, 1))).toEqual(true)
    expect(matrixMapping.isFormulaArrayInColumn(0, 0)).toEqual(false)
    expect(matrixMapping.isFormulaArrayInColumn(0, 1)).toEqual(true)
    expect(matrixMapping.isFormulaArrayInRow(0, 0)).toEqual(false)
    expect(matrixMapping.isFormulaArrayInRow(0, 1)).toEqual(true)
  })

  it('should move matrices below row', () => {
    const matrixMapping = new ArrayMapping()
    const vertex1 = new ArrayVertex(buildNumberAst(1), adr('B1'), new ArraySize(2, 2))
    const range1 = AbsoluteCellRange.spanFrom(adr('B1'), 2, 2)
    const vertex2 = new ArrayVertex(buildNumberAst(1), adr('D2'), new ArraySize(2, 2))
    const range2 = AbsoluteCellRange.spanFrom(adr('D2'), 2, 2)
    matrixMapping.setArray(range1, vertex1)
    matrixMapping.setArray(range2, vertex2)

    matrixMapping.moveArrayVerticesAfterRowByRows(0, 0, 2)

    expect(matrixMapping.getArrayByCorner(range1.start)).toBeUndefined()
    expect(matrixMapping.getArrayByCorner(range2.start)).toBeUndefined()
    expect(matrixMapping.getArrayByCorner(adr('B3'))).toEqual(vertex1)
    expect(matrixMapping.getArrayByCorner(adr('D4'))).toEqual(vertex2)
  })
})
