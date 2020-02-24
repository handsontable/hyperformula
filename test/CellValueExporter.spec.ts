import {CellError, Config, DetailedCellError, EmptyValue} from '../src'
import {ErrorType} from '../src/Cell'
import {CellValueExporter} from '../src/CellValue'
import {enGB, plPL} from '../src/i18n'
import {detailedError} from './testUtils'

describe( 'rounding', () => {
  it( 'no rounding', () =>{
    const config = new Config({ smartRounding : false})
    const cellValueExporter = new CellValueExporter(config)
    expect(cellValueExporter.export(1.000000000000001)).toBe(1.000000000000001)
    expect(cellValueExporter.export(-1.000000000000001)).toBe(-1.000000000000001)
    expect(cellValueExporter.export(0.000000000000001)).toBe(0.000000000000001)
    expect(cellValueExporter.export(-0.000000000000001)).toBe(-0.000000000000001)
    expect(cellValueExporter.export(true)).toBe(true)
    expect(cellValueExporter.export(false)).toBe(false)
    expect(cellValueExporter.export(1)).toBe(1)
    expect(cellValueExporter.export(EmptyValue)).toBe(EmptyValue)
    expect(cellValueExporter.export('abcd')).toBe('abcd')
  })

  it( 'with rounding', () =>{
    const config = new Config()
    const cellValueExporter = new CellValueExporter(config)
    expect(cellValueExporter.export(1.0000000000001)).toBe(1.0000000000001)
    expect(cellValueExporter.export(-1.0000000000001)).toBe(-1.0000000000001)
    expect(cellValueExporter.export(1.000000000000001)).toBe(1)
    expect(cellValueExporter.export(-1.000000000000001)).toBe(-1)
    expect(cellValueExporter.export(0.0000000000001)).toBe(0.0000000000001)
    expect(cellValueExporter.export(-0.0000000000001)).toBe(-0.0000000000001)
    expect(cellValueExporter.export(true)).toBe(true)
    expect(cellValueExporter.export(false)).toBe(false)
    expect(cellValueExporter.export(1)).toBe(1)
    expect(cellValueExporter.export(EmptyValue)).toBe(EmptyValue)
    expect(cellValueExporter.export('abcd')).toBe('abcd')
  })
})

describe('detailed error', () => {
  it('should return detailed errors', () => {
    const config = new Config({ language: enGB })
    const cellValueExporter = new CellValueExporter(config)

    const error = cellValueExporter.export(new CellError(ErrorType.VALUE)) as DetailedCellError
    expect(error).toEqual(detailedError(ErrorType.VALUE))
    expect(error.value).toEqual('#VALUE!')
  })

  it('should return detailed errors with translation', () => {
    const config = new Config({ language: plPL })
    const cellValueExporter = new CellValueExporter(config)

    const error = cellValueExporter.export(new CellError(ErrorType.VALUE)) as DetailedCellError
    expect(error).toEqual(detailedError(ErrorType.VALUE, config))
    expect(error.value).toEqual('#ARG!')  
  })
})
