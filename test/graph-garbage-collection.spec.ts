import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'

describe('vertex counting', () => {
  it('one-time formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
    await engine.calculateFormula('=SUM(A1:B2)', 0)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
  })

  it('cruds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
    await engine.setCellContents(adr('A1'), '=SUM(A2:B2)')
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(5)
    await engine.setCellContents(adr('A1'), 1)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(4)
  })
})

describe('range mapping', () => {
  it('one-time formula', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
    await engine.calculateFormula('=SUM(A1:B2)', 0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('cruds', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4']
    ])
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
    await engine.setCellContents(adr('A1'), '=SUM(A2:B2)')
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(1)
    await engine.setCellContents(adr('A1'), 1)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

describe('larger tests', () => {

  it( 'large fixed', async() => {
    const arr = [
      [
        '=SUM(B2:C4)',
      ],
      [
        null,
        '=SUM(A3:B3)',
      ],
      [
        '=SUM(B2:C3)',
      ],
    ]
    const engine = await HyperFormula.buildFromArray(arr)
    for(let x=0; x<3; x++) {
      for(let y=0; y<3; y++) {
        await engine.setCellContents({sheet: 0, col: x, row: y}, null)
      }
    }
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('large fixed #2', async() => {
    const arr = [
      [
        null,
        '=SUM(A1:A2)',
        '=SUM(A1:A1)',
        '=SUM(A1:A2)',
      ],
    ]
    const engine = await HyperFormula.buildFromArray(arr)
    await engine.setCellContents({sheet: 0, col: 1, row: 0}, null)
    await engine.setCellContents({sheet: 0, col: 2, row: 0}, null)
    await engine.setCellContents({sheet: 0, col: 3, row: 0}, null)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it( 'large fixed #3', async() => {
    const arr =     [
      [
        '=SUM(A1:B1)',
      ],
    ]
    const engine = await HyperFormula.buildFromArray(arr)

    await engine.setCellContents({sheet: 0, col: 0, row: 0}, null)

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it( 'large fixed #4', async() => {
    const arr =     [
      [
        null, '=SUM(A1:A1)', '=SUM(A1:A2)', '=SUM(A1:A3)', '=SUM(A1:A4)',
      ],
    ]
    const engine = await HyperFormula.buildFromArray(arr)

    await engine.setCellContents({sheet: 0, col: 1, row: 0}, null)
    await engine.setCellContents({sheet: 0, col: 2, row: 0}, null)
    await engine.setCellContents({sheet: 0, col: 3, row: 0}, null)
    await engine.setCellContents({sheet: 0, col: 4, row: 0}, null)

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('repeat the same crud', async() => {
const engine = await HyperFormula.buildFromArray([])
    for(let tmp = 0; tmp < 3; tmp++) {
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          const col1 = randomInteger(2, 7)
          const row1 = randomInteger(2, 7)
          const col2 = col1 + randomInteger(-2, 2)
          const row2 = row1 + randomInteger(-2, 2)
          const startAddress = engine.simpleCellAddressToString({
            sheet: 0,
            row: Math.min(row1, row2),
            col: Math.min(col1, col2)
          }, 0)
          const endAddress = engine.simpleCellAddressToString({
            sheet: 0,
            row: Math.max(row1, row2),
            col: Math.max(col1, col2)
          }, 0)
          const formula = '=SUM(' + startAddress + ':' + endAddress + ')'
          await engine.setCellContents({sheet: 0, col: x, row: y}, formula)
        }
      }
    }
    for(let x=0; x<10; x++) {
      for(let y=0; y<10; y++) {
        await engine.setCellContents({sheet: 0, col: x, row: y}, null)
      }
    }
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

describe('cruds', () => {
  it('should collect empty vertices when bigger range is no longer bind to smaller range #1', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      [],
      ['=SUM(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])

    await engine.removeRows(0, [0, 2])
    await engine.removeRows(0, [2, 2])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #2', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      ['=SUM(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])

    await engine.addRows(0, [2, 1])
    await engine.removeRows(0, [0, 2])
    await engine.removeRows(0, [2, 2])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #3', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      ['=SUM(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])
    await engine.addRows(0, [2, 1])

    await engine.removeRows(0, [4, 2])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #4', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      ['=SUM(A1:A3)'],
      ['=SUM(A1:A2)'],
    ])
    await engine.addRows(0, [1, 1])

    await engine.setCellContents(adr('A1'), [[1], [2], [3], [4]])

    expect(engine.getCellValue(adr('A5'))).toBe(10)
    expect(engine.getCellValue(adr('A6'))).toBe(6)

    await engine.removeRows(0, [0, 6])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #5', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      [],
      ['=SUM(A1:A4)'],
      ['=SUM(A1:A3)'],
    ])

    await engine.setCellContents(adr('A1'), [[1], [2], [3], [4]])

    expect(engine.getCellValue(adr('A5'))).toBe(10)
    expect(engine.getCellValue(adr('A6'))).toBe(6)

    await engine.removeRows(0, [0, 6])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #6', async() => {
const engine = await HyperFormula.buildFromArray([
      [1],
      [2],
      [3],
      [4],
      ['=SUM(A1:A4)'],
      ['=SUM(A1:A3)'],
    ])

    expect(engine.getCellValue(adr('A5'))).toBe(10)
    expect(engine.getCellValue(adr('A6'))).toBe(6)

    await engine.removeRows(0, [0, 6])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('should collect empty vertices when bigger range is no longer bind to smaller range #7', async() => {
const engine = await HyperFormula.buildFromArray([
      [],
      [],
      [],
      ['=SUM(A1:A2)', '=SUM(B1:B3)'],
      ['=SUM(A1:A3)', '=SUM(B1:B2)'],
    ])
    await engine.addRows(0, [1, 1])

    await engine.setCellContents(adr('A1'), [[1, 1], [2, 2], [3, 3], [4, 4]])

    expect(engine.getCellValue(adr('A5'))).toBe(6)
    expect(engine.getCellValue(adr('B5'))).toBe(10)
    expect(engine.getCellValue(adr('A6'))).toBe(10)
    expect(engine.getCellValue(adr('B6'))).toBe(6)

    await engine.removeRows(0, [0, 6])

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('column adding', async() => {
const engine = await HyperFormula.buildFromArray([
      [0, 0],
      [0, 0],
      [0, 0],
      ['=SUM(A1:B2)'],
      ['=SUM(A1:B3)']
    ])
    await engine.addColumns(0, [1, 1])
    await engine.setCellContents(adr('B3'), 1)
    expect(engine.getCellSerialized(adr('A4'))).toBe('=SUM(A1:C2)')
    expect(engine.getCellSerialized(adr('A5'))).toBe('=SUM(A1:C3)')
    expect(engine.getCellValue(adr('A4'))).toBe(0)
    expect(engine.getCellValue(adr('A5'))).toBe(1)
  })

  it('movecell', async() => {
const engine = await HyperFormula.buildFromArray([
    [1],
    [2],
    [3],
    [4],
    ['=SUM(A1:A3)'],
    ['=SUM(A1:A4)'],
    ])
    await engine.moveCells(AbsoluteCellRange.spanFrom(adr('A1'), 1, 3), adr('B1'))
    await engine.setCellContents(adr('B1'), null)
    await engine.setCellContents(adr('B2'), null)
    await engine.setCellContents(adr('B3'), null)
    await engine.setCellContents(adr('A4'), null)
    await engine.setCellContents(adr('A5'), null)
    await engine.setCellContents(adr('A6'), null)

    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })

  it('addColumns after addRows', async() => {
const engine = await HyperFormula.buildFromArray([
      ['1'],
      ['2', '=SUM($A$1:A1)'],
      ['3', '=SUM($A$1:A2)'],
    ])

    await engine.addRows(0, [1, 1])
    await engine.addColumns(0, [0, 1])
    await engine.removeColumns(0, [0, 1])

    expect(engine.getCellValue(adr('B3'))).toEqual(1)
    expect(engine.getCellValue(adr('B4'))).toEqual(3)
  })
})
