import {HandsOnEngine} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import './testConfig.ts'

const range = (rangeString: string): AbsoluteCellRange => {
  return new AbsoluteCellRange(simpleCellAddress(0,0,0), simpleCellAddress(0,0,0))
}

describe("Cross operation - integers vertically", () => {
  xit('starting from one simple integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1']
    ])

    engine.crossOperation(range("A1:A1"), range("A1:A3"))

    expect(engine.getCellValue("A2")).toEqual(2)
    expect(engine.getCellValue("A3")).toEqual(3)
  })

  xit('starting from one bigger integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3']
    ])

    engine.crossOperation(range("A1:A1"), range("A1:A3"))

    expect(engine.getCellValue("A2")).toEqual(4)
    expect(engine.getCellValue("A3")).toEqual(5)
  })

  xit('starting from few subsequent integers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['4'],
      ['5'],
    ])

    engine.crossOperation(range("A1:A3"), range("A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(6)
    expect(engine.getCellValue("A5")).toEqual(7)
  })

  xit('starting from few integers with regular step (2)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['5'],
      ['7'],
    ])

    engine.crossOperation(range("A1:A3"), range("A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(9)
    expect(engine.getCellValue("A5")).toEqual(11)
  })

  xit('starting from few integers with regular step (3)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3'],
      ['6'],
      ['9'],
    ])

    engine.crossOperation(range("A1:A3"), range("A1:A5"))

    expect(engine.getCellValue("A4")).toEqual(12)
    expect(engine.getCellValue("A5")).toEqual(15)
  })

  xit('few integers with irregular steps', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['2'],
      ['7'],
      ['34'],
    ])

    engine.crossOperation(range("A1:A3"), range("A1:A9"))

    expect(engine.getCellValue("A4")).toEqual(3)
    expect(engine.getCellValue("A5")).toEqual(8)
    expect(engine.getCellValue("A6")).toEqual(35)
    expect(engine.getCellValue("A7")).toEqual(4)
    expect(engine.getCellValue("A8")).toEqual(9)
    expect(engine.getCellValue("A9")).toEqual(36)
  })
})

describe("Cross operation - integers horizontally", () => {
  xit('starting from one simple integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1']
    ])

    engine.crossOperation(range("A1:A1"), range("A1:C1"))

    expect(engine.getCellValue("B1")).toEqual(2)
    expect(engine.getCellValue("C1")).toEqual(3)
  })

  xit('starting from one bigger integer', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3']
    ])

    engine.crossOperation(range("A1:A1"), range("A1:C1"))

    expect(engine.getCellValue("B1")).toEqual(4)
    expect(engine.getCellValue("C1")).toEqual(5)
  })

  xit('starting from few subsequent integers', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '4', '5'],
    ])

    engine.crossOperation(range("A1:C1"), range("A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(6)
    expect(engine.getCellValue("E1")).toEqual(7)
  })

  xit('starting from few integers with regular step (2)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '5', '7'],
    ])

    engine.crossOperation(range("A1:C1"), range("A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(9)
    expect(engine.getCellValue("E1")).toEqual(11)
  })

  xit('starting from few integers with regular step (3)', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['3', '6', '9'],
    ])

    engine.crossOperation(range("A1:C1"), range("A1:E1"))

    expect(engine.getCellValue("D1")).toEqual(12)
    expect(engine.getCellValue("E1")).toEqual(15)
  })

  xit('few integers with irregular steps', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['2', '7', '34'],
    ])

    engine.crossOperation(range("A1:C1"), range("A1:I1"))

    expect(engine.getCellValue("D1")).toEqual(3)
    expect(engine.getCellValue("E1")).toEqual(8)
    expect(engine.getCellValue("F1")).toEqual(35)
    expect(engine.getCellValue("G1")).toEqual(4)
    expect(engine.getCellValue("H1")).toEqual(9)
    expect(engine.getCellValue("I1")).toEqual(36)
  })
})
