import {EmptyValue, HyperFormula} from "../../src";
import {adr} from "../testUtils";
import {AbsoluteCellRange} from "../../src/AbsoluteCellRange";
import {EmptyCellVertex, FormulaCellVertex} from "../../src/DependencyGraph";

describe('Set matrix empty', () => {
  it('should set matrix empty', () => {
    const engine = HyperFormula.buildFromArray([
        ['1', '2'],
        ['{=TRANSPOSE(A1:B1)}'],
        ['{=TRANSPOSE(A1:B1)}']
    ])
    const dependencyGraph = engine.dependencyGraph;
    const matrixVertex = dependencyGraph.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setMatrixEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A3'))).toEqual(EmptyValue)
    expect(dependencyGraph.matrixMapping.matrixMapping.size).toEqual(0)
  })

  it('should adjust edges between matrix cells and formula', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=A1+A2'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}']
    ])
    const dependencyGraph = engine.dependencyGraph;
    const matrixVertex = dependencyGraph.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setMatrixEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A3'))).toEqual(EmptyValue)
    expect(dependencyGraph.matrixMapping.matrixMapping.size).toEqual(0)

    const formula = dependencyGraph.fetchCell(adr('C1'))
    const a1 = dependencyGraph.fetchCell(adr('A1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    const a3 = dependencyGraph.getCell(adr('A3'))
    expect(dependencyGraph.existsEdge(matrixVertex, formula)).toBe(false)
    expect(dependencyGraph.existsEdge(a1, formula)).toBe(true)
    expect(dependencyGraph.existsEdge(a2, formula)).toBe(true)
    expect(a3).toBe(null)
  })

  it('should adjust edges between matrix cells and formula matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '{=TRANSPOSE(A2)}'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}']
    ])
    const dependencyGraph = engine.dependencyGraph;
    const matrixVertex = dependencyGraph.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!

    dependencyGraph.setMatrixEmpty(matrixVertex)

    expect(engine.getCellValue(adr('A2'))).toEqual(EmptyValue)
    expect(engine.getCellValue(adr('A3'))).toEqual(EmptyValue)
    expect(dependencyGraph.matrixMapping.matrixMapping.size).toEqual(1)

    const formulaMatrix = dependencyGraph.fetchCell(adr('C1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    expect(dependencyGraph.existsEdge(matrixVertex, formulaMatrix)).toBe(false)
    expect(dependencyGraph.existsEdge(a2, formulaMatrix)).toBe(true)
  })

  it('should adjust edges between matrix cells and range', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A2:A3)'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])
    const dependencyGraph = engine.dependencyGraph;
    const matrixVertex = dependencyGraph.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!
    const rangeVertex  = dependencyGraph.rangeMapping.getRange(adr('A2'), adr('A3'))!
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(true)

    dependencyGraph.setMatrixEmpty(matrixVertex)

    expect(dependencyGraph.matrixMapping.matrixMapping.size).toEqual(0)

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
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '=SUM(A1:A2)'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])
    const dependencyGraph = engine.dependencyGraph;
    const matrixVertex = dependencyGraph.matrixMapping.getMatrix(AbsoluteCellRange.spanFrom(adr('A2'), 1, 2))!
    const rangeVertex  = dependencyGraph.rangeMapping.getRange(adr('A1'), adr('A2'))!
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(true)

    dependencyGraph.setMatrixEmpty(matrixVertex)

    expect(dependencyGraph.matrixMapping.matrixMapping.size).toEqual(0)

    const formula = dependencyGraph.fetchCell(adr('C1'))
    const a1 = dependencyGraph.fetchCell(adr('A1'))
    const a2 = dependencyGraph.fetchCell(adr('A2'))
    const a3 = dependencyGraph.getCell(adr('A3'))
    expect(dependencyGraph.existsEdge(rangeVertex, formula)).toBe(true)
    expect(dependencyGraph.existsEdge(matrixVertex, rangeVertex)).toBe(false)
    expect(dependencyGraph.existsEdge(a1, rangeVertex)).toBe(true)
    expect(dependencyGraph.existsEdge(a2, rangeVertex)).toBe(true)
    expect(a3).toBe(null)
    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })
})
