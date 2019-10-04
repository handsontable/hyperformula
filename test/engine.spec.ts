import {HandsOnEngine} from '../src'
import {CellError, EmptyValue, ErrorType} from '../src/Cell'
import './testConfig.ts'
import {adr, expect_reference_to_have_ref_error} from "./testUtils";

describe('Integration', () => {
  it('#loadSheet load simple sheet', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
    ])

    expect(engine.getCellValue('A1')).toBe(1)
  })

  it('#loadSheet load simple sheet', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    expect(engine.getCellValue('C2')).toBe(6)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([['=A5']])

    expect(engine.getCellValue('A5')).toBe(EmptyValue)
    expect(engine.getCellValue('A1')).toBe(EmptyValue)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([['', '=A1']])

    expect(engine.getCellValue('B1')).toBe(EmptyValue)
  })

  it('loadSheet with a loop', () => {
    const engine = HandsOnEngine.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside plus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside minus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['5', '=A1-B1']])
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('loadSheet with operator precedence', () => {
    const engine = HandsOnEngine.buildFromArray([['=3*7*2-4*1+2']])
    expect(engine.getCellValue('A1')).toBe(40)
  })

  it('loadSheet with operator precedence and brackets', () => {
    const engine = HandsOnEngine.buildFromArray([['=3*7+((2-4)*(1+2)+3)*2']])
    expect(engine.getCellValue('A1')).toBe(15)
  })

  it('loadSheet with operator precedence with cells', () => {
    const engine = HandsOnEngine.buildFromArray([['3', '4', '=B1*2+A1']])
    expect(engine.getCellValue('C1')).toBe(11)
  })

  it('#loadSheet - it should build graph without cycle but with formula with error', () => {
    const engine = HandsOnEngine.buildFromArray([['=A1B1']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME))
  })

  it('#loadSheet - dependency before value', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue('A1')).toBe(1)
    expect(engine.getCellValue('A2')).toBe(3)
  })

  xit('should be possible to build graph with reference to not existing sheet', () => {
    const engine = HandsOnEngine.buildFromArray([['=$Sheet2.A2']])

    expect_reference_to_have_ref_error(engine, adr("A1"))
  });
})
