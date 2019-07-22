import {HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {cellAddressFromString, CellAddress} from '../src/parser'
import './testConfig.ts'

const range = (engine: HandsOnEngine, rangeString: string): AbsoluteCellRange => {
  const [adr1, adr2] = rangeString.split(":")
  return new AbsoluteCellRange(
    cellAddressFromString(engine.sheetMapping.fetch, adr1, CellAddress.absolute(0, 0, 0)),
    cellAddressFromString(engine.sheetMapping.fetch, adr2, CellAddress.absolute(0, 0, 0)),
  )
}

describe("Cross operation - integers vertically", () => {
  it('starting from one simple integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:A3"))

    expect(engine.getCellValue("A2")).toEqual(2)
    expect(engine.getCellValue("A3")).toEqual(3)
  })

  it('starting from one bigger integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:A3"))

    expect(engine.getCellValue("A2")).toEqual(4)
    expect(engine.getCellValue("A3")).toEqual(5)
  })

  it('starting from few subsequent integers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.crossOperation(range(engine, "A1:A3"), range(engine, "A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(6)
    expect(engine.getCellValue("A5")).toEqual(7)
  })

  it('starting from few integers with regular step (2)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['5'],
      ['7'],
    ])

    engine.crossOperation(range(engine, "A1:A3"), range(engine, "A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(9)
    expect(engine.getCellValue("A5")).toEqual(11)
  })

  it('starting from few integers with regular step (3)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['6'],
      ['9'],
    ])

    engine.crossOperation(range(engine, "A1:A3"), range(engine, "A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(12)
    expect(engine.getCellValue("A5")).toEqual(15)
  })

  xit('few integers with irregular steps', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['2'],
      ['7'],
      ['34'],
    ])

    engine.crossOperation(range(engine, "A1:A3"), range(engine, "A1:A9"))

    expect(engine.getCellValue("A4")).toEqual(3)
    expect(engine.getCellValue("A5")).toEqual(8)
    expect(engine.getCellValue("A6")).toEqual(35)
    expect(engine.getCellValue("A7")).toEqual(4)
    expect(engine.getCellValue("A8")).toEqual(9)
    expect(engine.getCellValue("A9")).toEqual(36)
  })

  it('subsequent integers, crossoping upwards', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      [''],
      [''],
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.crossOperation(range(engine, "A4:A6"), range(engine, "A1:A6"))

    expect(engine.getCellValue("A1")).toEqual(0)
    expect(engine.getCellValue("A2")).toEqual(1)
    expect(engine.getCellValue("A3")).toEqual(2)
  })
})

describe("Cross operation - integers horizontally", () => {
  xit('starting from one simple integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:C1"))

    expect(engine.getCellValue("B1")).toEqual(2)
    expect(engine.getCellValue("C1")).toEqual(3)
  })

  xit('starting from one bigger integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:C1"))

    expect(engine.getCellValue("B1")).toEqual(4)
    expect(engine.getCellValue("C1")).toEqual(5)
  })

  xit('starting from few subsequent integers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '4', '5'],
    ])

    engine.crossOperation(range(engine, "A1:C1"), range(engine, "A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(6)
    expect(engine.getCellValue("E1")).toEqual(7)
  })

  xit('starting from few integers with regular step (2)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '5', '7'],
    ])

    engine.crossOperation(range(engine, "A1:C1"), range(engine, "A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(9)
    expect(engine.getCellValue("E1")).toEqual(11)
  })

  xit('starting from few integers with regular step (3)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '6', '9'],
    ])

    engine.crossOperation(range(engine, "A1:C1"), range(engine, "A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(12)
    expect(engine.getCellValue("E1")).toEqual(15)
  })

  xit('few integers with irregular steps', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['2', '7', '34'],
    ])

    engine.crossOperation(range(engine, "A1:C1"), range(engine, "A1:I1"))

    expect(engine.getCellValue("D1")).toEqual(3)
    expect(engine.getCellValue("E1")).toEqual(8)
    expect(engine.getCellValue("F1")).toEqual(35)
    expect(engine.getCellValue("G1")).toEqual(4)
    expect(engine.getCellValue("H1")).toEqual(9)
    expect(engine.getCellValue("I1")).toEqual(36)
  })
})
