import {HyperFormula} from '../../src'
import {copyAst} from '../../src/CopyPaste'
import {CellAddress} from '../../src/parser'
import {buildCellReferenceAst} from '../../src/parser/Ast'
import {CellReferenceType} from '../../src/parser/CellAddress'
import '../testConfig'
import {adr, expect_array_with_same_content} from '../testUtils'

describe('copy ast', () => {
  it('should be different objects', () => {
    const formula = buildCellReferenceAst(new CellAddress(0, 0, 0, CellReferenceType.CELL_REFERENCE_RELATIVE))
    const copied = copyAst(formula)

    expect(formula).toEqual(copied)
    expect(formula).not.toBe(copied)
  })
})

describe('Copy - paste', () => {
  it('copy should return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', 'bar'],
    ])

    const values = engine.copy(adr('A1'), 2, 2)

    expect_array_with_same_content([1, 2], values[0])
    expect_array_with_same_content(['foo', 'bar'], values[1])
  })

  it('should work for single number', () => {
    const engine = HyperFormula.buildFromArray([
      ['1']
    ])

    engine.copy(adr('A1'), 1, 1)
    engine.paste(adr('B1'))

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
  })

  it('should work for area', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['foo', 'bar'],
    ])

    engine.copy(adr('A1'), 2, 2)
    engine.paste(adr('C1'))

    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqual(2)
    expect(engine.getCellValue(adr('C2'))).toEqual('foo')
    expect(engine.getCellValue(adr('D2'))).toEqual('bar')
  })
})
