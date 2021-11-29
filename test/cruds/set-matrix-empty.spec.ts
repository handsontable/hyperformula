import {HyperFormula} from '../../src'
import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
import {adr} from '../testUtils'

describe('Set matrix empty', () => {
  it('should set matrix empty', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])
    const dependencyGraph = engine.dependencyGraph
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matrixVertex = dependencyGraph.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setArrayEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(dependencyGraph.arrayMapping.arrayMapping.size).toEqual(0)
  })

  it('should adjust edges between matrix cells and formula', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=A1+A2'],
      ['=TRANSPOSE(A1:B1)'],
    ])
    const dependencyGraph = engine.dependencyGraph
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matrixVertex = dependencyGraph.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setArrayEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(dependencyGraph.arrayMapping.arrayMapping.size).toEqual(0)

    const formula = dependencyGraph.fetchCell(adr('C1'))
    const a1 = dependencyGraph.fetchCell(adr('A1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    const a3 = dependencyGraph.getCell(adr('A3'))
    expect(dependencyGraph.existsEdge(matrixVertex, formula)).toBe(false)
    expect(dependencyGraph.existsEdge(a1, formula)).toBe(true)
    expect(dependencyGraph.existsEdge(a2, formula)).toBe(true)
    expect(a3).toBe(undefined)
  })

  it('should adjust edges between matrix cells and formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=TRANSPOSE(A1:B1)'],
      ['=TRANSPOSE(A1:B1)'],
    ])
    const dependencyGraph = engine.dependencyGraph
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matrixVertex = dependencyGraph.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setArrayEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toBe(null)
    expect(engine.getCellValue(adr('A3'))).toBe(null)
    expect(dependencyGraph.arrayMapping.arrayMapping.size).toEqual(1)

    const formulaMatrix = dependencyGraph.fetchCell(adr('C1'))
    const a1 = dependencyGraph.fetchCell(adr('A1'))
    expect(dependencyGraph.existsEdge(matrixVertex, formulaMatrix)).toBe(false)
    expect(dependencyGraph.existsEdge(a1, formulaMatrix)).toBe(false)
  })

  it('should adjust edges between matrix cells and range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A2:A3)'],
      ['=TRANSPOSE(A1:B1)'],
    ])
    const dependencyGraph = engine.dependencyGraph
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matrixVertex = dependencyGraph.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rangeVertex = dependencyGraph.rangeMapping.getRange(adr('A2'), adr('A3'))!
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(true)

    dependencyGraph.setArrayEmpty(matrixVertex)

    expect(dependencyGraph.arrayMapping.arrayMapping.size).toEqual(0)

    const formula = dependencyGraph.fetchCell(adr('C1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    const a3 = dependencyGraph.fetchCell(adr('A3'))
    expect(a2).not.toBe(a3)
    expect(dependencyGraph.existsEdge(rangeVertex, formula)).toBe(true)
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(false)
    expect(dependencyGraph.existsEdge(a2, rangeVertex)).toBe(true)
    expect(dependencyGraph.existsEdge(a3, rangeVertex)).toBe(true)
  })

  it('should adjust edges between matrix cells and range crossing matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:A2)'],
      ['=TRANSPOSE(A1:B1)'],
    ])
    const dependencyGraph = engine.dependencyGraph
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const matrixVertex = dependencyGraph.arrayMapping.getArray(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rangeVertex = dependencyGraph.rangeMapping.getRange(adr('A1'), adr('A2'))!
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(true)

    dependencyGraph.setArrayEmpty(matrixVertex)

    expect(dependencyGraph.arrayMapping.arrayMapping.size).toEqual(0)

    const formula = dependencyGraph.fetchCell(adr('C1'))
    const a1 = dependencyGraph.fetchCell(adr('A1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    const a3 = dependencyGraph.getCell(adr('A3'))
    expect(dependencyGraph.existsEdge(rangeVertex, formula)).toBe(true)
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(false)
    expect(dependencyGraph.existsEdge(a1, rangeVertex)).toBe(true)
    expect(dependencyGraph.existsEdge(a2, rangeVertex)).toBe(true)
    expect(a3).toBe(undefined)
    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })
})
