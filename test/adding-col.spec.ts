import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {EmptyCellVertex, FormulaCellVertex} from '../src/DependencyGraph'
import {CellReferenceAst} from '../src/parser/Ast'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'

const extractReference = (engine: HandsOnEngine, address: SimpleCellAddress): CellAddress => {
  return ((engine.addressMapping!.fetchCell(address) as FormulaCellVertex).getFormula() as CellReferenceAst).reference
}

describe('Adding column', () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error('It is not possible to add column in column with matrix'))

    expect(() => {
      engine.addColumns(0, 0, 1)
    }).toThrow(new Error('It is not possible to add column in column with matrix'))
  })

  it('updates addresses in formulas', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=A1'],
    ])

    engine.addColumns(0, 1, 1)

    const c1 = engine.addressMapping!.getCell(simpleCellAddress(0, 2, 0)) as FormulaCellVertex
    expect(c1).toBeInstanceOf(FormulaCellVertex)
    expect(c1.getAddress()).toEqual(simpleCellAddress(0, 2, 0))
  })

  it('add column inside numeric matrix, expand matrix', () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('B1')).toEqual(2)

    engine.addColumns(0, 1, 2)

    expect(engine.getCellValue('B1')).toEqual(0)
    expect(engine.getCellValue('C1')).toEqual(0)
    expect(engine.getCellValue('D1')).toEqual(2)
  })

  it('reevaluates cells', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '2', '=COLUMNS(A1:B1)'],
    ])

    expect(engine.getCellValue('C1')).toEqual(2)
    engine.addColumns(0, 1, 1)
    expect(engine.getCellValue('D1')).toEqual(3)
  })
})

describe('Adding column, fixing dependency', () => {
  it('same sheet, case Aa, absolute column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absoluteCol(0, 0, 0))
  })

  it('same sheet, case Aa, absolute row and col', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '=$A$1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.absolute(0, 0, 0))
  })

  it('same sheet, case Ab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=$B1' /* new col */, '42'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.absoluteCol(0, 2, 0))
  })

  it('same sheet, case Raa', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '13', /* new col */ '42'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, case Rab', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '13', /* new col */ '=B1'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 3, 0))).toEqual(CellAddress.relative(0, -2, 0))
  })

  it('same sheet, case Rba', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=C1', '13', /* new col */ '42'],
    ])

    engine.addColumns(0, 2, 1)

    expect(extractReference(engine, simpleCellAddress(0, 0, 0))).toEqual(CellAddress.relative(0, 3, 0))
  })

  it('same sheet, case Rbb', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', /* new col */ '=C1', '13'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 0))).toEqual(CellAddress.relative(0, 1, 0))
  })

  it('same sheet, same column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['42', '43'],
      ['', '=B1'],
    ])

    engine.addColumns(0, 1, 1)

    expect(extractReference(engine, simpleCellAddress(0, 2, 1))).toEqual(CellAddress.relative(0, 0, -1))
  })
})

describe('Adding column, fixing ranges', () => {
  it('insert column in middle of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* new col */ '2', '3'],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).not.toBe(null)

    engine.addColumns(0, 1, 1)

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).toBe(null)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 3, 0))).not.toBe(null)
  })

  it('insert column above range', () => {
    const engine = HandsOnEngine.buildFromArray([
      [/* new col */ '1', '2', '3'],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).not.toBe(null)
    engine.addColumns(0, 0, 1)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).toBe(null)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 1, 0), simpleCellAddress(0, 3, 0))).not.toBe(null)
  })

  it('insert column below range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3' /* new col */],
      ['=SUM(A1:C1)'],
    ])

    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).not.toBe(null)
    engine.addColumns(0, 3, 1)
    expect(engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))).not.toBe(null)
  })

  it('it should insert new cell with edge to only one range at right', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', /* */ '3', '4'],
      ['=SUM(A1:A1)', '=SUM(A1:B1)', /* */ '=SUM(A1:C1)', '=SUM(A1:D1)'],
    ])

    engine.addColumns(0, 2, 1)

    const c1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 2, 0))
    const a1d1 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 3, 0))!
    const a1e1 = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 4, 0))!

    expect(engine.graph.existsEdge(c1, a1d1)).toBe(true)
    expect(engine.graph.existsEdge(c1, a1e1)).toBe(true)
    expect(engine.graph.adjacentNodesCount(c1)).toBe(2)
  })

  it ('range start in column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(B1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    expect(b1).toBe(null)
  })

  it('range start before added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))
    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 4, 0))!
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range start after added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(C1:D1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    expect(b1).toBe(null)
  })

  it ('range end before added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:A1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    expect(b1).toBe(null)
  })

  it ('range end in a added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:B1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 2, 0))!
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range end after added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(A1:C1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))

    const range = engine.rangeMapping.getRange(simpleCellAddress(0, 0, 0), simpleCellAddress(0, 3, 0))!
    expect(b1).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(b1, range)).toBe(true)
  })

  it ('range start and end in an added column', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', /* */ '2', '3', '4'],
      ['', /* */ '=SUM(B1:B1)'],
    ])

    engine.addColumns(0, 1, 1)

    const b1 = engine.addressMapping!.getCell(simpleCellAddress(0, 1, 0))
    expect(b1).toBe(null)
  })
})
