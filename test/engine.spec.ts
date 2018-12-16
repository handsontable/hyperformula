import {buildAddressMapping, HandsOnEngine} from '../src'
import {AddressMapping} from '../src/AddressMapping'
import {ArrayAddressMapping} from '../src/ArrayAddressMapping'
import {cellError, ErrorType} from '../src/Cell'

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

    expect(engine.getCellValue('A1')).toBe('')
    expect(engine.getCellValue('A5')).toBe('')
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HandsOnEngine.buildFromArray([['', '=A1']])

    expect(engine.getCellValue('B1')).toBe('')
  })

  it('loadSheet with a loop', () => {
    const engine = HandsOnEngine.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.CYCLE))
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.CYCLE))
    expect(engine.getCellValue('C1')).toEqual(cellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside plus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside minus operator', () => {
    const engine = HandsOnEngine.buildFromArray([['5', '=A1-B1']])
    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.CYCLE))
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

  it('#loadSheet change cell content', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
    ])

    engine.setCellContent('A1', '2')

    expect(engine.getCellValue('B1')).toBe(2)
  })

  it('#loadSheet change cell content which was formula throws error', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=A1'],
    ])

    expect(() => {
      engine.setCellContent('B1', '2')
    }).toThrowError(new Error('Changes to cells other than simple values not supported'))
  })

  it('#loadSheet change cell content to formula throws error', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
    ])

    expect(() => {
      engine.setCellContent('B1', '=A1')
    }).toThrowError(new Error('Changes to cells other than simple values not supported'))
  })

  it('#loadSheet - it should build graph without cycle but with formula with error', () => {
    const engine = HandsOnEngine.buildFromArray([['=A1B1']])

    expect(engine.getCellValue('A1')).toEqual(cellError(ErrorType.NAME))
  })

  it('#loadSheet - changing value inside range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '0'],
      ['2', '0'],
      ['3', '=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue('B3')).toEqual(6)

    engine.setCellContent('A1', '3')
    expect(engine.getCellValue('B3')).toEqual(8)
  })

  it('#loadSheet - dependency before value', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue('A1')).toBe(1)
    expect(engine.getCellValue('A2')).toBe(3)
  })

  it('#buildAddresMapping - when sparse matrix', () => {
    const addressMapping = buildAddressMapping([
      ['', '', ''],
      ['', '', '1'],
    ])

    expect(addressMapping).toBeInstanceOf(AddressMapping)
  })

  it('#buildAddresMapping - when dense matrix', () => {
    const addressMapping = buildAddressMapping([
      ['1', '1'],
      ['1', '1'],
    ])

    expect(addressMapping).toBeInstanceOf(ArrayAddressMapping)
  })
})
