import {HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {cellAddressFromString, CellAddress} from '../src/parser'
import {expect_cell_to_have_formula} from './testUtils'
import './testConfig.ts'

const range = (engine: HandsOnEngine, rangeString: string): AbsoluteCellRange => {
  const [adr1, adr2] = rangeString.split(":")
  return new AbsoluteCellRange(
    cellAddressFromString(engine.sheetMapping.fetch, adr1, CellAddress.absolute(0, 0, 0)),
    cellAddressFromString(engine.sheetMapping.fetch, adr2, CellAddress.absolute(0, 0, 0)),
  )
}

describe("Cross operation", () => {
  it("raise error when not prefix nor suffix", () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['2'],
    ])

    expect(() => {
      engine.crossOperation(range(engine, "A1:A2"), range(engine, "B1:B2"))
    }).toThrowError('neither prefix nor suffix')
  })

  it("recomputes", () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['', '=A2'],
      ['', '=A3']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:A3"))

    expect(engine.getCellValue("B2")).toEqual(2)
    expect(engine.getCellValue("B3")).toEqual(3)
  })
})

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

  it('few integers with irregular steps', () => {
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

  it('few integers with irregular steps, upwards', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      ['2'],
      ['7'],
      ['34'],
    ])

    engine.crossOperation(range(engine, "A7:A9"), range(engine, "A1:A9"))

    expect(engine.getCellValue("A1")).toEqual(0)
    expect(engine.getCellValue("A2")).toEqual(5)
    expect(engine.getCellValue("A3")).toEqual(32)
    expect(engine.getCellValue("A4")).toEqual(1)
    expect(engine.getCellValue("A5")).toEqual(6)
    expect(engine.getCellValue("A6")).toEqual(33)
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

describe("Cross operation - formulas", () => {
  it('simple relative reference', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1']
    ])

    engine.crossOperation(range(engine, "A1:A1"), range(engine, "A1:A3"))

    expect_cell_to_have_formula(engine, "A2", "=B2")
    expect_cell_to_have_formula(engine, "A3", "=B3")
  })

  it('simple relative reference, going upwards', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      [''],
      ['=B4']
    ])

    engine.crossOperation(range(engine, "A3:A3"), range(engine, "A1:A3"))

    expect_cell_to_have_formula(engine, "A1", "=B2")
    expect_cell_to_have_formula(engine, "A2", "=B3")
  })

  it('simple relative reference, going upwards, changing bad references to REF', () => {
    const engine = HandsOnEngine.buildFromArray([
      [''],
      ['=B1']
    ])

    engine.crossOperation(range(engine, "A2:A2"), range(engine, "A1:A2"))

    expect_cell_to_have_formula(engine, "A1", "=#REF!")
  })

  it('just repeat formulas if no pattern', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1'],
      ['=B3'],
    ])

    engine.crossOperation(range(engine, "A1:A2"), range(engine, "A1:A4"))

    expect_cell_to_have_formula(engine, "A3", "=B3")
    expect_cell_to_have_formula(engine, "A4", "=B5")
  })
})

describe("Cross operation - mixing types", () => {
  it('just use what fits for every type', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      ['=B1'],
    ])

    engine.crossOperation(range(engine, "A1:A2"), range(engine, "A1:A4"))

    expect(engine.getCellValue("A3")).toEqual(2)
    expect_cell_to_have_formula(engine, "A4", "=B3")
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
