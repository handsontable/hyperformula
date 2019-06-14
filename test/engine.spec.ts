import {HandsOnEngine} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import './testConfig.ts'

describe('Integration', () => {
  it('#loadSheet load simple sheet', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1'],
    ])

    expect(engine.getCellValue('A1')).toBe(1)
  })

  it('#loadSheet load simple sheet', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    expect(engine.getCellValue('C2')).toBe(6)
  })

  it('#loadSheet evaluate empty vertex', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=A5']])

    expect(engine.getCellValue('A1')).toBe(0)
    expect(engine.getCellValue('A5')).toBe(0)
  })

  it('#loadSheet evaluate empty vertex', async () => {
    const engine = await HandsOnEngine.buildFromArray([['', '=A1']])

    expect(engine.getCellValue('B1')).toBe(0)
  })

  it('loadSheet with a loop', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside plus operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside minus operator', async () => {
    const engine = await HandsOnEngine.buildFromArray([['5', '=A1-B1']])
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.CYCLE))
  })

  it('loadSheet with operator precedence', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=3*7*2-4*1+2']])
    expect(engine.getCellValue('A1')).toBe(40)
  })

  it('loadSheet with operator precedence and brackets', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=3*7+((2-4)*(1+2)+3)*2']])
    expect(engine.getCellValue('A1')).toBe(15)
  })

  it('loadSheet with operator precedence with cells', async () => {
    const engine = await HandsOnEngine.buildFromArray([['3', '4', '=B1*2+A1']])
    expect(engine.getCellValue('C1')).toBe(11)
  })

  it('#loadSheet - it should build graph without cycle but with formula with error', async () => {
    const engine = await HandsOnEngine.buildFromArray([['=A1B1']])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.NAME))
  })

  it('#loadSheet - dependency before value', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue('A1')).toBe(1)
    expect(engine.getCellValue('A2')).toBe(3)
  })
})
