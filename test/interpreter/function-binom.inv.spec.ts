import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function BINOM.INV', () => {
  it('should return error for wrong number of arguments', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(1, 2)'],
      ['=BINOM.INV(1, 2, 3, 4)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('should return error for arguments of wrong type', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV("foo", 0.5, 3)'],
      ['=BINOM.INV(1, "baz", 3)'],
      ['=BINOM.INV(1, 0.5, "baz")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(10, 0.5, 0.001)',
        '=BINOM.INV(10, 0.5, 0.01)',
        '=BINOM.INV(10, 0.5, 0.025)',
        '=BINOM.INV(10, 0.5, 0.05)',
        '=BINOM.INV(10, 0.5, 0.1)',
        '=BINOM.INV(10, 0.5, 0.2)',
        '=BINOM.INV(10, 0.5, 0.3)',
        '=BINOM.INV(10, 0.5, 0.4)',
        '=BINOM.INV(10, 0.5, 0.5)',
        '=BINOM.INV(10, 0.5, 0.6)',
        '=BINOM.INV(10, 0.5, 0.7)',
        '=BINOM.INV(10, 0.5, 0.8)',
        '=BINOM.INV(10, 0.5, 0.9)',
        '=BINOM.INV(10, 0.5, 0.95)',
        '=BINOM.INV(10, 0.5, 0.975)',
        '=BINOM.INV(10, 0.5, 0.99)',
        '=BINOM.INV(10, 0.5, 0.999)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[1, 1, 2, 2, 3, 4, 4, 5, 5, 5, 6, 6, 7, 8, 8, 9, 9]])
  })

  it('should work, different p-value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(10, 0.8, 0.001)',
        '=BINOM.INV(10, 0.8, 0.1)',
        '=BINOM.INV(10, 0.8, 0.2)',
        '=BINOM.INV(10, 0.8, 0.3)',
        '=BINOM.INV(10, 0.8, 0.4)',
        '=BINOM.INV(10, 0.8, 0.5)',
        '=BINOM.INV(10, 0.8, 0.6)',
        '=BINOM.INV(10, 0.8, 0.7)',
        '=BINOM.INV(10, 0.8, 0.8)',
        '=BINOM.INV(10, 0.8, 0.9)',
        '=BINOM.INV(10, 0.8, 0.999)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[4, 6, 7, 7, 8, 8, 8, 9, 9, 10, 10]])
  })

  it('should work, small number of trials', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(0, 0.8, 0.001)',
        '=BINOM.INV(0, 0.8, 0.1)',
        '=BINOM.INV(0, 0.8, 0.2)',
        '=BINOM.INV(0, 0.8, 0.3)',
        '=BINOM.INV(0, 0.8, 0.4)',
        '=BINOM.INV(0, 0.8, 0.5)',
        '=BINOM.INV(0, 0.8, 0.6)',
        '=BINOM.INV(0, 0.8, 0.7)',
        '=BINOM.INV(0, 0.8, 0.8)',
        '=BINOM.INV(0, 0.8, 0.9)',
        '=BINOM.INV(0, 0.8, 0.999)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]])
  })

  it('should work, another small number of trials', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(1, 0.8, 0.001)',
        '=BINOM.INV(1, 0.8, 0.1)',
        '=BINOM.INV(1, 0.8, 0.2)',
        '=BINOM.INV(1, 0.8, 0.3)',
        '=BINOM.INV(1, 0.8, 0.4)',
        '=BINOM.INV(1, 0.8, 0.5)',
        '=BINOM.INV(1, 0.8, 0.6)',
        '=BINOM.INV(1, 0.8, 0.7)',
        '=BINOM.INV(1, 0.8, 0.8)',
        '=BINOM.INV(1, 0.8, 0.9)',
        '=BINOM.INV(1, 0.8, 0.999)'],
    ])

    //both products #1 and #2 return 1 for '=BINOM.INV(1, 0.8, 0.2)', which is incorrect
    expect(engine.getSheetValues(0)).toEqual([[0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]])
  })

  it('should work, large number of trials', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(1000, 0.8, 0.001)',
        '=BINOM.INV(1000, 0.8, 0.1)',
        '=BINOM.INV(1000, 0.8, 0.2)',
        '=BINOM.INV(1000, 0.8, 0.3)',
        '=BINOM.INV(1000, 0.8, 0.4)',
        '=BINOM.INV(1000, 0.8, 0.5)',
        '=BINOM.INV(1000, 0.8, 0.6)',
        '=BINOM.INV(1000, 0.8, 0.7)',
        '=BINOM.INV(1000, 0.8, 0.8)',
        '=BINOM.INV(1000, 0.8, 0.9)',
        '=BINOM.INV(1000, 0.8, 0.999)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[760, 784, 789, 793, 797, 800, 803, 807, 811, 816, 838]])
  })

  it('truncation works', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(1000.1, 0.8, 0.001)',
        '=BINOM.INV(1000.2, 0.8, 0.1)',
        '=BINOM.INV(1000.3, 0.8, 0.2)',
        '=BINOM.INV(1000.4, 0.8, 0.3)',
        '=BINOM.INV(1000.5, 0.8, 0.4)',
        '=BINOM.INV(1000.6, 0.8, 0.5)',
        '=BINOM.INV(1000.7, 0.8, 0.6)',
        '=BINOM.INV(1000.8, 0.8, 0.7)',
        '=BINOM.INV(1000.9, 0.8, 0.8)',
        '=BINOM.INV(1000.99, 0.8, 0.9)',
        '=BINOM.INV(1000.999, 0.8, 0.999)'],
    ])

    expect(engine.getSheetValues(0)).toEqual([[760, 784, 789, 793, 797, 800, 803, 807, 811, 816, 838]])
  })

  it('checks bounds', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=BINOM.INV(0, 0.5, 0.5)'],
      ['=BINOM.INV(-0.001, 0.5, 0.5)'],
      ['=BINOM.INV(10, 0, 0.5)'],
      ['=BINOM.INV(10, 1, 0.5)'],
      ['=BINOM.INV(10, -0.001, 0.5)'],
      ['=BINOM.INV(10, 1.001, 0.5)'],
      ['=BINOM.INV(10, 0.5, 0)'],
      ['=BINOM.INV(10, 0.5, 1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
    //product #1 returns 0 for the following test
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    //both products #1 and #2 return NUM for '=BINOM.INV(10, 0, 0.5)', which is incorrect
    expect(engine.getCellValue(adr('A3'))).toEqual(0)
    //both products #1 and #2 return NUM for '=BINOM.INV(10, 1, 0.5)', which is incorrect
    expect(engine.getCellValue(adr('A4'))).toEqual(10)
    expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
    expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueSmall))
    expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.NUM, ErrorMessage.ValueLarge))
  })
})
