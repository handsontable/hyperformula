import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {Config} from '../../src/Config'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Number literals', () => {
  it('should work for integer', () => {
    const [engine] = HyperFormula.buildFromArray([['="1" + 2']])
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should work for float with standard decimal separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1.23" + 2']])
    expect(engine.getCellValue(adr('A1'))).toEqual(3.23)
  })

  it('should work for float with custom decimal separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1,23" + 2']], new Config({
      decimalSeparator: ',', functionArgSeparator: ';'
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(3.23)
  })

  it('should work for number with thousand separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1,000" + 2']], new Config({
      thousandSeparator: ',', functionArgSeparator: ';'
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(1002)
  })

  it('should work for number with another thousand separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1 000" + 2']], new Config({
      thousandSeparator: ' '
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(1002)
  })

  it('should work with thousand and decimal separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1 000,2" + 2']], new Config({
      decimalSeparator: ',', thousandSeparator: ' ', functionArgSeparator: ';'
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(1002.2)
  })

  it('should work for multiple thousand separator in one literal', () => {
    const [engine] = HyperFormula.buildFromArray([['="1 000 000" + 2']], new Config({
      thousandSeparator: ' '
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(1000002)
  })

  it('should return value when thousand separator in literal does not match config', () => {
    const [engine] = HyperFormula.buildFromArray([['="1 000" + 2']], new Config({
      thousandSeparator: ',', functionArgSeparator: ';'
    }))
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('should work for number with dot as thousand separator', () => {
    const [engine] = HyperFormula.buildFromArray([['="1.000,3" + 2']], new Config({
      thousandSeparator: '.', decimalSeparator: ',', functionArgSeparator: ';'
    }))
    expect(engine.getCellValue(adr('A1'))).toEqual(1002.3)
  })
})
