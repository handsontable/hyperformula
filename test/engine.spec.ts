import {DetailedCellError, ErrorType, HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {CellType, CellValueDetailedType, CellValueType} from '../src/Cell'
import {Config} from '../src/Config'
import {ErrorMessage} from '../src/error-message'
import {plPL} from '../src/i18n/languages'
import {adr, detailedError, expectArrayWithSameContent} from './testUtils'

describe('#buildFromArray', () => {
  it('load single value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('load simple sheet', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    expect(engine.getCellValue(adr('C2'))).toBe(6)
  })

  it('evaluate empty vertex', () => {
    const [engine] = HyperFormula.buildFromArray([['=A5']])

    expect(engine.getCellValue(adr('A5'))).toBe(null)
    expect(engine.getCellValue(adr('A1'))).toBe(null)
  })

  it('evaluate empty vertex reference', () => {
    const [engine] = HyperFormula.buildFromArray([[null, '=A1']])

    expect(engine.getCellValue(adr('B1'))).toBe(null)
  })

  it('cycle', () => {
    const [engine] = HyperFormula.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('cycle with formula', () => {
    const [engine] = HyperFormula.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
  })

  it('operator precedence', () => {
    const [engine] = HyperFormula.buildFromArray([['=3*7*2-4*1+2']])
    expect(engine.getCellValue(adr('A1'))).toBe(40)
  })

  it('operator precedence and brackets', () => {
    const [engine] = HyperFormula.buildFromArray([['=3*7+((2-4)*(1+2)+3)*2']])
    expect(engine.getCellValue(adr('A1'))).toBe(15)
  })

  it('operator precedence with cells', () => {
    const [engine] = HyperFormula.buildFromArray([['3', '4', '=B1*2+A1']])
    expect(engine.getCellValue(adr('C1'))).toBe(11)
  })

  it('parsing error', () => {
    const [engine] = HyperFormula.buildFromArray([['=A1B1']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('dependency before value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(3)
  })

  it('should handle different input types', () => {
    const [engine] = HyperFormula.buildFromArray([['', null, undefined, 1, true]])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('B1'))).toBe(null)
    expect(engine.getCellValue(adr('C1'))).toBe(null)
    expect(engine.getCellValue(adr('D1'))).toBe(1)
    expect(engine.getCellValue(adr('E1'))).toBe(true)
  })

  it('should work with other numerals', () => {
    const [engine] = HyperFormula.buildFromArray([
      [0o777, 0xFF, 0b1010, 1_000_000_000_000],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(511)
    expect(engine.getCellValue(adr('B1'))).toBe(255)
    expect(engine.getCellValue(adr('C1'))).toBe(10)
    expect(engine.getCellValue(adr('D1'))).toBe(1000000000000)
  })

  it('should be possible to build graph with reference to not existing sheet', () => {
    const [engine] = HyperFormula.buildFromArray([['=Sheet2!A2']])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=Sheet2!A2')
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF))
  })

  it('should propagate parsing errors', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(', '=A1']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(')

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('B1'))).toEqual('=A1')
  })
})

describe('#getCellFormula', () => {
  it('returns formula when present', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1,2,3,C3)'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(1,2,3,C3)')
  })

  it('works with -0', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-0'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=-0')
  })

  it('returns undefined for simple values', () => {
    const [engine] = HyperFormula.buildFromArray([
      [''],
      ['42'],
      ['foobar'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A2'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A3'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A4'))).toEqual(undefined)
  })

  it('returns matrix formula for matrix vertices', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['=MMULT(A1:B2,A1:B2)'],
    ])

    expect(engine.getCellFormula(adr('A3'))).toEqual('=MMULT(A1:B2,A1:B2)')
    expect(engine.getCellFormula(adr('A4'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B3'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B4'))).toEqual(undefined)
  })

  it('returns invalid formula literal', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(')
  })

  it('returns invalid matrix formula literal', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=TRANSPOSE(')
  })
})

describe('#getAllFormulas', () => {
  it('should return formulas from all sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [['=A()']],
      Foo: [[1, '=SUM(A1)']],
    })

    expect(engine.getAllSheetsFormulas()).toEqual({'Foo': [[undefined, '=SUM(A1)']], 'Sheet1': [['=A()']]})
  })
})

describe('#getRangeFormulas', () => {
  it('should return formulas', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, A2)', '=TRUE()'],
      ['=SUM(', null, 1]
    ])

    const out = engine.getRangeFormulas(AbsoluteCellRange.spanFrom(adr('A1'), 3, 2))

    expectArrayWithSameContent([['=SUM(1, A2)', '=TRUE()', undefined], ['=SUM(', undefined, undefined]], out)
  })
})

describe('#getSheetFormulas', () => {
  it('should return formulas from sheet', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, A2)', '=TRUE()'],
      ['=SUM(', null, 1]
    ])

    const out = engine.getSheetFormulas(0)

    expectArrayWithSameContent([['=SUM(1, A2)', '=TRUE()'], ['=SUM(']], out)
  })
})

describe('#getCellValue', () => {
  it('should return simple value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['', 1, '1', 'foo', true, -1.000000000000001]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('C1'))).toEqual(1)
    expect(engine.getCellValue(adr('D1'))).toEqual('foo')
    expect(engine.getCellValue(adr('E1'))).toEqual(true)
    expect(engine.getCellValue(adr('F1'))).toEqual(-1)
  })

  it('should return null for empty cells', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, undefined]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(null)
    expect(engine.getCellValue(adr('B1'))).toEqual(null)
    expect(engine.getCellValue(adr('C1'))).toEqual(null)
  })

  it('should return value of a formula', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=1', '=SUM(1, A1)', '=TRUE()', '=1/0']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValue(adr('B1'))).toEqual(2)
    expect(engine.getCellValue(adr('C1'))).toEqual(true)
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('should return parsing error value', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.ERROR, ErrorMessage.ParseError))
  })

  it('should return value of a cell in a formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['=TRANSPOSE(A1:B1)'],
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })

  it('should return translated error', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const [engine] = HyperFormula.buildFromArray([
      ['=#ARG!'],
    ], {language: 'plPL'})

    const error = engine.getCellValue(adr('A1')) as DetailedCellError
    expect(error).toEqualError(detailedError(ErrorType.VALUE, '', new Config({language: 'plPL'})))
    expect(error.value).toEqual('#ARG!')
  })
})

describe('#getSheetDimensions', () => {
  it('should work for empty sheet', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expect(engine.getSheetDimensions(0)).toEqual({height: 0, width: 0})
  })

  it('should return sheet dimensions', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 1],
      [1, null, 1],
    ])

    expect(engine.getSheetDimensions(0)).toEqual({height: 2, width: 3})
  })
})

describe('#getAllSheetsDimensions', () => {
  it('should return dimension of all sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Sheet1': [],
      'Sheet2': [[1]],
      'Foo': [[null]],
      'Bar': [[null], [null, 'foo']]
    })

    expect(engine.getAllSheetsDimensions()).toEqual({
      'Sheet1': {width: 0, height: 0},
      'Sheet2': {width: 1, height: 1},
      'Foo': {width: 0, height: 0},
      'Bar': {width: 2, height: 2},
    })
  })
})

describe('#getRangeValues', () => {
  it('should return values from range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, B1)', '=TRUE()', null]
    ])

    const out = engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A1'), 3, 1))

    expectArrayWithSameContent([[1, true, null]], out)
  })
})

describe('#getSheetValues', () => {
  it('should return values from sheet', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 'foo', '=SUM(1, A1)', null, '=TRUE()', null]
    ])

    const out = engine.getSheetValues(0)

    expectArrayWithSameContent([[1, 'foo', 2, null, true]], out)
  })
})

describe('#getAllValues', () => {
  it('should return values from all sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [],
      Foo: [[1]],
    })

    expect(engine.getAllSheetsValues()).toEqual({'Foo': [[1]], 'Sheet1': []})
  })
})

describe('#getCellSerialized', () => {
  it('should return formula for formula vertex', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, A2)']
    ])

    expect(engine.getCellSerialized(adr('A1'))).toEqual('=SUM(1, A2)')
  })

  it('should return formula for parsing error', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(']
    ])

    expect(engine.getCellSerialized(adr('A1'))).toEqual('=SUM(')
  })

  it('should return simple value', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, '2', 'foo', true]
    ])

    expect(engine.getCellSerialized(adr('A1'))).toEqual(1)
    expect(engine.getCellSerialized(adr('B1'))).toEqual('2')
    expect(engine.getCellSerialized(adr('C1'))).toEqual('foo')
    expect(engine.getCellSerialized(adr('D1'))).toEqual(true)
  })

  it('should return empty value', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, undefined]
    ])

    expect(engine.getCellSerialized(adr('A1'))).toEqual(null)
    expect(engine.getCellSerialized(adr('B1'))).toEqual(null)
    expect(engine.getCellSerialized(adr('C1'))).toEqual(null)
  })

  it('should return formula of a formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['1', '2'],
      ['{=TRANSPOSE(A1:B1)}'],
      ['{=TRANSPOSE(A1:B1)}'],
    ])

    expect(engine.getCellSerialized(adr('A2'))).toEqual('{=TRANSPOSE(A1:B1)}')
    expect(engine.getCellSerialized(adr('A3'))).toEqual('{=TRANSPOSE(A1:B1)}')
  })

  it('should return translated error', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const [engine] = HyperFormula.buildFromArray([
      ['=#ARG!'],
    ], {language: 'plPL'})

    expect(engine.getCellSerialized(adr('A1'))).toEqual('=#ARG!')
  })
})

describe('#getAllSheetsSerialized', () => {
  it('should serialize all sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({
      Sheet1: [['=A()']],
      Foo: [[1]],
      Err1: [['=A1']],
      Err2: [['234.23141234.2314']],
      Err3: [['#DIV/0!']],
    })

    expect(engine.getAllSheetsSerialized()).toEqual({
      'Foo': [[1]],
      'Sheet1': [['=A()']],
      'Err1': [['=A1']],
      'Err2': [['234.23141234.2314']],
      'Err3': [['#DIV/0!']],
    })
  })
})

describe('#getRangeSerialized', () => {
  it('should return empty values', () => {
    const [engine] = HyperFormula.buildFromArray([])

    expectArrayWithSameContent([[null, null]], engine.getRangeSerialized(AbsoluteCellRange.spanFrom(adr('A1'), 2, 1)))
  })

  it('should return serialized cells from range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SUM(1, B1)', '2', '#VALUE!', null, '=#DIV/0!', '{=TRANSPOSE(A1:B1)}']
    ])

    const out = engine.getRangeSerialized(AbsoluteCellRange.spanFrom(adr('A1'), 6, 1))

    expectArrayWithSameContent([['=SUM(1, B1)', '2', '#VALUE!', null, '=#DIV/0!', '{=TRANSPOSE(A1:B1)}']], out)
  })
})

describe('#sheetName', () => {
  it('returns sheet name if sheet exists', () => {
    const [engine] = HyperFormula.buildEmpty()

    engine.addSheet()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('returns undefined if sheet doesnt exists', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(engine.getSheetName(0)).toBeUndefined()
  })
})

describe('#sheetId', () => {
  it('returns id if sheet exists', () => {
    const [engine] = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.getSheetId('foobar')).toEqual(0)
  })

  it('returns undefined if sheet doesnt exists', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(engine.getSheetId('doesntexist')).toBeUndefined()
  })
})

describe('#doesSheetExist', () => {
  it('true if sheet exists', () => {
    const [engine] = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.doesSheetExist('foobar')).toBe(true)
  })

  it('false if sheet doesnt exist', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(engine.doesSheetExist('foobar')).toBe(false)
  })
})

describe('#numberOfSheets', () => {
  it('returns 0 if empty', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(engine.countSheets()).toBe(0)
  })

  it('returns number of sheets', () => {
    const [engine] = HyperFormula.buildEmpty()

    engine.addSheet('foo')

    expect(engine.countSheets()).toBe(1)
  })
})

describe('#sheetNames', () => {
  it('empty engine', () => {
    const [engine] = HyperFormula.buildEmpty()

    expect(engine.getSheetNames()).toEqual([])
  })

  it('returns sheet names', () => {
    const [engine] = HyperFormula.buildFromArray([])
    engine.addSheet('Foo')

    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Foo'])
  })
})

describe('#getCellType', () => {
  it('empty cell', () => {
    const [engine] = HyperFormula.buildFromArray([[null, undefined]])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.EMPTY)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.EMPTY)
    expect(engine.getCellType(adr('C1'))).toBe(CellType.EMPTY)
  })

  it('simple value', () => {
    const [engine] = HyperFormula.buildFromArray([['1', 'foo']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.VALUE)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.VALUE)
  })

  it('formula', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUM(1, 2)']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.FORMULA)
  })

  it('formula matrix', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRANSPOSE(C1:C2)']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.ARRAYFORMULA)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.ARRAY)
  })

  it('parsing error is a formula cell', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUM(']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.FORMULA)
  })
})

describe('#getCellValueDetailedType', () => {
  it('string', () => {
    const [engine] = HyperFormula.buildFromArray([['foo']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.STRING)
  })

  it('number data', () => {
    const [engine] = HyperFormula.buildFromArray([['42']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_RAW)
  })

  it('number currency', () => {
    const [engine] = HyperFormula.buildFromArray([['42$']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_CURRENCY)
  })

  it('number percent', () => {
    const [engine] = HyperFormula.buildFromArray([['42%']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_PERCENT)
  })

  it('number date', () => {
    const [engine] = HyperFormula.buildFromArray([['01/01/1967']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATE)
  })

  it('number datetime', () => {
    const [engine] = HyperFormula.buildFromArray([['01/01/1967 15:34']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_DATETIME)
  })

  it('number time', () => {
    const [engine] = HyperFormula.buildFromArray([['15:34']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.NUMBER_TIME)
  })

  it('boolean', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE()']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.BOOLEAN)
  })

  it('empty value', () => {
    const [engine] = HyperFormula.buildFromArray([[null]])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.EMPTY)
    expect(engine.getCellValueDetailedType(adr('B1'))).toBe(CellValueDetailedType.EMPTY)
  })

  it('error', () => {
    const [engine] = HyperFormula.buildFromArray([['=1/0', '=SU()', '=A1']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.ERROR)
    expect(engine.getCellValueDetailedType(adr('B1'))).toBe(CellValueDetailedType.ERROR)
    expect(engine.getCellValueDetailedType(adr('C1'))).toBe(CellValueDetailedType.ERROR)
  })

  it('formula evaluating to range', () => {
    const [engine] = HyperFormula.buildFromArray([['=B1:B2', '=C:D']])
    expect(engine.getCellValueDetailedType(adr('A1'))).toBe(CellValueDetailedType.ERROR)
    expect(engine.getCellValueDetailedType(adr('B1'))).toBe(CellValueDetailedType.ERROR)
  })
})

describe('#getCellValueFormat', () => {
  it('non-currency', () => {
    const [engine] = HyperFormula.buildFromArray([['foo']])
    expect(engine.getCellValueFormat(adr('A1'))).toEqual(undefined)
  })

  it('currency', () => {
    const [engine] = HyperFormula.buildFromArray([['1PLN']], {currencySymbol: ['PLN', '$']})
    expect(engine.getCellValueFormat(adr('A1'))).toEqual('PLN')
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.NUMBER_CURRENCY)
  })

  it('unicode currency', () => {
    const [engine] = HyperFormula.buildFromArray([['1₪']], {currencySymbol: ['₪']})
    expect(engine.getCellValueFormat(adr('A1'))).toEqual('₪')
    expect(engine.getCellValue(adr('A1'))).toEqual(1)
    expect(engine.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.NUMBER_CURRENCY)
  })
})

describe('#getCellValueType', () => {
  it('string', () => {
    const [engine] = HyperFormula.buildFromArray([['foo']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('number', () => {
    const [engine] = HyperFormula.buildFromArray([['42', '=SUM(1, A1)']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.NUMBER)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.NUMBER)
  })

  it('boolean', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRUE()']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.BOOLEAN)
  })

  it('empty value', () => {
    const [engine] = HyperFormula.buildFromArray([[null]])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.EMPTY)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.EMPTY)
  })

  it('error', () => {
    const [engine] = HyperFormula.buildFromArray([['=1/0', '=SU()', '=A1']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('C1'))).toBe(CellValueType.ERROR)
  })

  it('formula evaluating to range', () => {
    const [engine] = HyperFormula.buildFromArray([['=B1:B2', '=C:D']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.ERROR)
  })
})

describe('#doesCellHaveSimpleValue', () => {
  it('true', () => {
    const [engine] = HyperFormula.buildFromArray([['1', 'foo']])
    expect(engine.doesCellHaveSimpleValue(adr('A1'))).toEqual(true)
    expect(engine.doesCellHaveSimpleValue(adr('B1'))).toEqual(true)
  })

  it('false', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUM(1, 2)', null, '=TRANSPOSE(A1:A1)']])
    expect(engine.doesCellHaveSimpleValue(adr('A1'))).toEqual(false)
    expect(engine.doesCellHaveSimpleValue(adr('B1'))).toEqual(false)
    expect(engine.doesCellHaveSimpleValue(adr('C1'))).toEqual(false)
  })
})

describe('#doesCellHaveFormula', () => {
  it('true', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUM(1, 2)']])
    expect(engine.doesCellHaveFormula(adr('A1'))).toEqual(true)
  })

  it('false', () => {
    const [engine] = HyperFormula.buildFromArray([['1', '', '{=TRANSPOSE(A1:A1)}', 'foo', null]])
    expect(engine.doesCellHaveFormula(adr('A1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('B1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('C1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('D1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('E1'))).toEqual(false)
  })

  it('arrayformula', () => {
    const [engine] = HyperFormula.buildFromArray([['=ARRAYFORMULA(ISEVEN(B1:B2*2))']])
    expect(engine.doesCellHaveFormula(adr('A1'))).toEqual(true)
  })
})

describe('#isCellEmpty', () => {
  it('true', () => {
    const [engine] = HyperFormula.buildFromArray([[null, undefined]])
    expect(engine.isCellEmpty(adr('A1'))).toEqual(true)
    expect(engine.isCellEmpty(adr('B1'))).toEqual(true)
    expect(engine.isCellEmpty(adr('C1'))).toEqual(true)
  })

  it('false', () => {
    const [engine] = HyperFormula.buildFromArray([['1', '=SUM(1, 2)', '{=TRANSPOSE(A1:A1)}', 'foo']])
    expect(engine.isCellEmpty(adr('A1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('B1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('C1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('D1'))).toEqual(false)
  })
})

describe('#isCellPartOfArray', () => {
  it('true', () => {
    const [engine] = HyperFormula.buildFromArray([['=TRANSPOSE(B1:C1)']])
    expect(engine.isCellPartOfArray(adr('A1'))).toEqual(true)
  })

  it('false', () => {
    const [engine] = HyperFormula.buildFromArray([['1', '', '=SUM(1, 2)', 'foo']])
    expect(engine.isCellPartOfArray(adr('A1'))).toEqual(false)
    expect(engine.isCellPartOfArray(adr('B1'))).toEqual(false)
    expect(engine.isCellPartOfArray(adr('C1'))).toEqual(false)
    expect(engine.isCellPartOfArray(adr('D1'))).toEqual(false)
  })
})

describe('dateTime', () => {
  it('dateTime', () => {
    const [engine] = HyperFormula.buildEmpty()
    expect(engine.numberToDateTime(43845.1)).toEqual({
      'day': 15,
      'hours': 2,
      'minutes': 24,
      'month': 1,
      'seconds': 0,
      'year': 2020
    })
    expect(engine.numberToDate(43845)).toEqual({'day': 15, 'month': 1, 'year': 2020})
    expect(engine.numberToTime(1.1)).toEqual({'hours': 26, 'minutes': 24, 'seconds': 0})
  })
})

describe('Graph dependency topological ordering module', () => {
  it('should build correctly when rows are dependant on cells that are not yet processed #1', () => {
    expect(() => HyperFormula.buildFromArray([
      ['=A3+A2'],
      ['=A3'],
    ])).not.toThrowError()
  })

  it('should build correctly when rows are dependant on cells that are not yet processed #2', () => {
    expect(() => HyperFormula.buildFromArray([
      ['=A4+A3+A2'],
      ['=A4+A3'],
      ['=A4'],
    ])).not.toThrowError()
  })

  it('should build correctly when rows are dependant on cells that are not yet processed #3', () => {
    expect(() => HyperFormula.buildFromArray([
      ['=A5+A4+A3+A2'],
      ['=A5+A4+A3'],
      ['=A5+A4'],
      ['=A5'],
    ])).not.toThrowError()
  })
})

describe('#getFillRangeData from corner source', () => {
  it('should properly apply wrap-around #1', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('C3'), 3, 3))
    ).toEqual([['2', '=$A$1', '2'], ['=A3', 1, '=C3'], ['2', '=$A$1', '2']])
  })

  it('should properly apply wrap-around #2', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('B2'), 3, 3))
    ).toEqual([[1, '=A1', 1], ['=$A$1', '2', '=$A$1'], [1, '=A3', 1]])
  })

  it('should properly apply wrap-around #3', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('A1'), 3, 3))
    ).toEqual([['2', '=$A$1', '2'], ['=#REF!', 1, '=A1'], ['2', '=$A$1', '2']])
  })
})

describe('#getFillRangeData from target source', () => {
  it('should properly apply wrap-around #1', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('C3'), 3, 3), true)
    ).toEqual([[1, '=B2', 1], ['=$A$1', '2', '=$A$1'], [1, '=B4', 1]])
  })

  it('should properly apply wrap-around #2', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('B2'), 3, 3), true)
    ).toEqual([[1, '=A1', 1], ['=$A$1', '2', '=$A$1'], [1, '=A3', 1]])
  })

  it('should properly apply wrap-around #3', () => {
    const [engine] = HyperFormula.buildFromArray([[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']])

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2'), 2, 2), AbsoluteCellRange.spanFrom(adr('A1'), 3, 3), true)
    ).toEqual([[1, '=#REF!', 1], ['=$A$1', '2', '=$A$1'], [1, '=#REF!', 1]])
  })
})

describe('#getFillRangeData', () => {
  it('should move between sheets - sheet relative addresses', () => {
    const [engine] = HyperFormula.buildFromSheets({
        'Sheet1': [[], [undefined, 1, '=A1'], [undefined, '=$A$1', '2']],
        'Sheet2': [],
      }
    )

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2', 0), 2, 2), AbsoluteCellRange.spanFrom(adr('C3', 1), 3, 3))
    ).toEqual([['2', '=$A$1', '2'], ['=A3', 1, '=C3'], ['2', '=$A$1', '2']])
  })

  it('should move between sheets - sheet absolute addresses', () => {
    const [engine] = HyperFormula.buildFromSheets({
        'Sheet1': [[], [undefined, 1, '=Sheet1!A1'], [undefined, '=Sheet2!$A$1', '2']],
        'Sheet2': [],
      }
    )

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2', 0), 2, 2), AbsoluteCellRange.spanFrom(adr('C3', 1), 3, 3))
    ).toEqual([['2', '=Sheet2!$A$1', '2'], ['=Sheet1!A3', 1, '=Sheet1!C3'], ['2', '=Sheet2!$A$1', '2']])
  })

  it('should move between sheets - no sheet of a given name', () => {
    const [engine] = HyperFormula.buildFromSheets({
        'Sheet1': [],
      }
    )

    expect(engine.getFillRangeData(AbsoluteCellRange.spanFrom(adr('B2', 0), 1, 1), AbsoluteCellRange.spanFrom(adr('C3', 1), 1, 1))
    ).toEqual([[null]])
  })

})
