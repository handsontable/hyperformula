import {CellError, DetailedCellError, EmptyValue} from '../src'
import {ErrorType} from '../src/Cell'
import {Exporter} from '../src/CellValue'
import {Config} from '../src/Config'
import {enGB, plPL} from '../src/i18n'
import {detailedError} from './testUtils'
import {NamedExpressions} from '../src/NamedExpressions'

const namedExpressionsMock = {} as NamedExpressions

describe( 'rounding', () => {
  it( 'no rounding', () =>{
    const config = new Config({ smartRounding : false })
    const cellValueExporter = new Exporter(config, namedExpressionsMock)
    expect(cellValueExporter.exportValue(1.000000000000001)).toBe(1.000000000000001)
    expect(cellValueExporter.exportValue(-1.000000000000001)).toBe(-1.000000000000001)
    expect(cellValueExporter.exportValue(0.000000000000001)).toBe(0.000000000000001)
    expect(cellValueExporter.exportValue(-0.000000000000001)).toBe(-0.000000000000001)
    expect(cellValueExporter.exportValue(true)).toBe(true)
    expect(cellValueExporter.exportValue(false)).toBe(false)
    expect(cellValueExporter.exportValue(1)).toBe(1)
    expect(cellValueExporter.exportValue(EmptyValue)).toBe(EmptyValue)
    expect(cellValueExporter.exportValue('abcd')).toBe('abcd')
  })

  it( 'with rounding', () =>{
    const config = new Config()
    const cellValueExporter = new Exporter(config, namedExpressionsMock)
    expect(cellValueExporter.exportValue(1.0000000000001)).toBe(1.0000000000001)
    expect(cellValueExporter.exportValue(-1.0000000000001)).toBe(-1.0000000000001)
    expect(cellValueExporter.exportValue(1.000000000000001)).toBe(1)
    expect(cellValueExporter.exportValue(-1.000000000000001)).toBe(-1)
    expect(cellValueExporter.exportValue(0.0000000000001)).toBe(0.0000000000001)
    expect(cellValueExporter.exportValue(-0.0000000000001)).toBe(-0.0000000000001)
    expect(cellValueExporter.exportValue(true)).toBe(true)
    expect(cellValueExporter.exportValue(false)).toBe(false)
    expect(cellValueExporter.exportValue(1)).toBe(1)
    expect(cellValueExporter.exportValue(EmptyValue)).toBe(EmptyValue)
    expect(cellValueExporter.exportValue('abcd')).toBe('abcd')
  })
})

describe('detailed error', () => {
  it('should return detailed errors', () => {
    const config = new Config({ language: 'enGB' })
    const cellValueExporter = new Exporter(config, namedExpressionsMock)

    const error = cellValueExporter.exportValue(new CellError(ErrorType.VALUE)) as DetailedCellError
    expect(error).toEqual(detailedError(ErrorType.VALUE))
    expect(error.value).toEqual('#VALUE!')
  })

  it('should return detailed errors with translation', () => {
    const config = new Config({ language: 'plPL' })
    const cellValueExporter = new Exporter(config, namedExpressionsMock)

    const error = cellValueExporter.exportValue(new CellError(ErrorType.VALUE)) as DetailedCellError
    expect(error).toEqual(detailedError(ErrorType.VALUE, undefined, config))
    expect(error.value).toEqual('#ARG!')  
  })
})
