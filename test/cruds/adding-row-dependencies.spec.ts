import {HyperFormula} from '../../src'
import {EmptyCellVertex} from '../../src/DependencyGraph'
import {CellAddress} from '../../src/parser'
import {adr, colEnd, colStart, expectEngineToBeTheSameAs, extractReference, rowEnd, rowStart} from '../testUtils'

describe('Adding row - fixing dependencies', () => {
  describe('all in same sheet (case 1)', () => {
    it('same sheet, case Aa, absolute row', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['1'],
        // new row
        ['=A$1'],
      ])

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteRow(0, 0))
    })

    it('same sheet, case Aa, absolute row and col', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['1'],
        // new row
        ['=$A$1'],
      ])

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absolute(0, 0))
    })

    it('same sheet, case Ab', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=A$2'],
        // new row
        ['42'],
      ])

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(0, 2))
    })

    it('same sheet, case Raa', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=A2'],
        ['13'],
        // new row
        ['42'],
      ])

      engine.addRows(0, [2, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0))
    })

    it('same sheet, case Rab', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['42'],
        ['13'],
        // new row
        ['=A2'],
      ])

      engine.addRows(0, [2, 1])

      expect(extractReference(engine, adr('A4'))).toEqual(CellAddress.relative(-2, 0))
    })

    it('same sheet, case Rba', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=A3'],
        ['13'],
        // new row
        ['42'],
      ])

      engine.addRows(0, [2, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(3, 0))
    })

    it('same sheet, case Rbb', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['42'],
        // new row
        ['=A3'],
        ['13'],
      ])

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.relative(1, 0))
    })

    it('same sheet, same row', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['42'],
        ['43', '=A2'],
      ])

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.relative(0, -1))
    })
  })

  describe('dependency address sheet different than formula address sheet and sheet in which we add rows (case 2)', () => {
    it('absolute case', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          // new row
          ['=Sheet2!A$1'],
        ],
        Sheet2: [
          ['1'],
        ],
      })

      engine.addRows(0, [0, 1])

      expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.absoluteRow(0, 0, 1))
    })

    it('R < r', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          // new row
          [null],
          ['=Sheet2!A1'],
        ],
        Sheet2: [
          ['1'],
        ],
      })

      engine.addRows(0, [0, 1])

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.relative(-2, 0, 1))
    })

    it('r = R', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          // new row
          ['=Sheet2!A2'],
        ],
        Sheet2: [
          [null],
          ['1'],
        ],
      })

      engine.addRows(0, [0, 1])

      expect(extractReference(engine, adr('A2'))).toEqual(CellAddress.relative(0, 0, 1))
    })

    it('r < R', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          ['=Sheet2!A1'],
          // new row
        ],
        Sheet2: [
          ['1'],
        ],
      })

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
    })
  })

  describe('formula address sheet different than dependency address sheet and sheet in which we add rows (case 3)', () => {
    it('dependency address before added row', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          // new row
          ['1'],
          ['2'],
        ],
        Sheet2: [
          ['=Sheet1!A2'],
        ],
      })

      engine.addRows(0, [0, 1])

      expect(extractReference(engine, adr('A1', 1))).toEqual(CellAddress.relative(2, 0, 0))
    })

    it('dependency address at added row', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          // new row
          ['1'],
        ],
        Sheet2: [
          ['=Sheet1!A1'],
        ],
      })

      engine.addRows(0, [0, 1])

      expect(extractReference(engine, adr('A1', 1))).toEqual(CellAddress.relative(1, 0, 0))
    })

    it('dependency address after added row', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          ['1'],
          // new row
        ],
        Sheet2: [
          ['=Sheet1!A1'],
        ],
      })

      engine.addRows(0, [1, 1])

      expect(extractReference(engine, adr('A1', 1))).toEqual(CellAddress.relative(0, 0, 0))
    })
  })

  describe('sheet where we add rows different than dependency address and formula address (case 4)', () => {
    it('works', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          ['=A2'],
          ['13'],
        ],
        Sheet2: [
          [null],
          // new row
          ['78'],
        ],
      })

      engine.addRows(1, [1, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0))
    })
  })

  describe('each sheet different (case 5)', () => {
    it('works', () => {
      const [engine] = HyperFormula.buildFromSheets({
        Sheet1: [
          ['=Sheet2!A2'],
          ['13'],
        ],
        Sheet2: [
          [null],
          ['78'],
        ],
        Sheet3: [
          [null],
          // new row
          [null],
        ],
      })

      engine.addRows(2, [1, 1])

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(1, 0, 1))
    })
  })
})

describe('Adding row, ranges', () => {
  it('insert row in middle of range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      // new row
      ['2', null],
      ['3', null],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(undefined)
    engine.addRows(0, [1, 1])
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).toBe(undefined)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A4'))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A4)'],
      [null, null],
      ['2', null],
      ['3', null],
    ])[0])
  })

  it('insert row above range', () => {
    const [engine] = HyperFormula.buildFromArray([
      // new row
      ['1', '=SUM(A1:A3)'],
      ['2', null],
      ['3', null],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(undefined)
    engine.addRows(0, [0, 1])
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).toBe(undefined)
    expect(engine.rangeMapping.getRange(adr('A2'), adr('A4'))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null, null],
      ['1', '=SUM(A2:A4)'],
      ['2', null],
      ['3', null],
    ])[0])
  })

  it('insert row below range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', null],
      ['3', null],
      // new row
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(undefined)
    engine.addRows(0, [3, 1])
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', null],
      ['3', null],
      [null, null],
    ])[0])
  })

  it('it should insert new cell with edge to all ranges below', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '=SUM(A1:A1)'],
      ['2', '=SUM(A1:A2)'],
      // new row
      ['3', '=SUM(A1:A3)'],
      ['4', '=SUM(A1:A4)'],
    ])

    engine.addRows(0, [2, 1])

    const a4 = engine.addressMapping.fetchCell(adr('A4'))
    const a3 = engine.addressMapping.fetchCell(adr('A3'))
    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const a1a4 = engine.rangeMapping.fetchRange(adr('A1'), adr('A4')) // A1:A4
    const a1a3 = engine.rangeMapping.fetchRange(adr('A1'), adr('A3')) // A1:A4
    const a1a2 = engine.rangeMapping.fetchRange(adr('A1'), adr('A2')) // A1:A4

    expect(engine.graph.existsEdge(a4, a1a4)).toBe(true)
    expect(engine.graph.existsEdge(a3, a1a3)).toBe(true)
    expect(engine.graph.existsEdge(a2, a1a2)).toBe(true)
    expect(engine.graph.adjacentNodesCount(a4)).toBe(1)
    expect(engine.graph.adjacentNodesCount(a3)).toBe(1)
    expect(engine.graph.adjacentNodesCount(a2)).toBe(1)
  })

  it('it should insert new cell with edge to only one range below, shifted by 1', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      ['2', '=SUM(A1:A1)'],
      ['3', '=SUM(A1:A2)'],
      // new row
      ['4', '=SUM(A1:A3)'],
    ])

    engine.addRows(0, [3, 1])

    const a4 = engine.addressMapping.getCell(adr('A4'))
    expect(a4).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      ['2', '=SUM(A1:A1)'],
      ['3', '=SUM(A1:A2)'],
      [null, null],
      ['4', '=SUM(A1:A3)'],
    ])[0])
  })

  it('range start in row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A2:A4)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A3:A5)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range start above row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A1:A4)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A5'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A1:A5)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range start below row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A3:A4)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A4:A5)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range end above row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A1:A1)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A1:A1)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range end in a row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A1:A2)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.fetchCell(adr('A2'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A1:A3)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range end below row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A1:A3)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.fetchCell(adr('A2'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A4'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A1:A4)'],
      ['3', null],
      ['4', null],
    ])[0])
  })

  it('range start and end in a row', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', null],
      // new row
      ['2', '=SUM(A2:A2)'],
      ['3', null],
      ['4', null],
    ])

    engine.addRows(0, [1, 1])

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', null],
      [null, null],
      ['2', '=SUM(A3:A3)'],
      ['3', null],
      ['4', null],
    ])[0])
  })
})

describe('Adding row, column range', () => {
  it('column range should not be affected', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1', '=SUM(A:B)'],
      // new row
      ['2', '2'],
      ['3', '3'],
    ])

    engine.addRows(0, [1, 1])

    expect(engine.rangeMapping.getRange(colStart('A'), colEnd('B'))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1', '1', '=SUM(A:B)'],
      [null, null],
      ['2', '2'],
      ['3', '3'],
    ])[0])
  })
})

describe('Adding row, fixing row ranges', () => {
  it('insert row in middle of row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      /* new row */
      ['2'],
      ['3'],
      ['=SUM(1:3)'],
    ])

    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).not.toBe(undefined)

    engine.addRows(0, [1, 1])

    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).toBe(undefined)
    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(4))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1'],
      [null],
      ['2'],
      ['3'],
      ['=SUM(1:4)'],
    ])[0])
  })

  it('insert row before row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      /* new row */
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(1:3)'],
    ])

    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).not.toBe(undefined)
    engine.addRows(0, [0, 1])
    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).toBe(undefined)
    expect(engine.rangeMapping.getRange(rowStart(2), rowEnd(4))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [null],
      ['1'],
      ['2'],
      ['3'],
      ['=SUM(2:4)'],
    ])[0])
  })

  it('insert row after row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      /* new row */
      ['=SUM(1:3)'],
    ])

    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).not.toBe(undefined)
    engine.addRows(0, [3, 1])
    expect(engine.rangeMapping.getRange(rowStart(1), rowEnd(3))).not.toBe(undefined)

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['3'],
      [null],
      ['=SUM(1:3)'],
    ])[0])
  })
})
