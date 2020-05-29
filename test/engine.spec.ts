import {DetailedCellError, HyperFormula} from '../src'
import {CellType, CellValueType, EmptyValue, ErrorType} from '../src/Cell'
import {plPL} from '../src/i18n'
import {adr, detailedError, expectArrayWithSameContent} from './testUtils'

describe('Integration', () => {
  it('#loadSheet load simple sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
  })

  it('#loadSheet load simple sheet', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '3'],
      ['4', '5', '6'],
    ])

    expect(engine.getCellValue(adr('C2'))).toBe(6)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HyperFormula.buildFromArray([['=A5']])

    expect(engine.getCellValue(adr('A5'))).toBe(null)
    expect(engine.getCellValue(adr('A1'))).toBe(null)
  })

  it('#loadSheet evaluate empty vertex', () => {
    const engine = HyperFormula.buildFromArray([[null, '=A1']])

    expect(engine.getCellValue(adr('B1'))).toBe(null)
  })

  it('getAllValues', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [],
      Foo: [[1]],
    })

    expect(engine.getAllSheetsValues()).toEqual({'Foo': [[1]], 'Sheet1': []})
  })

  it('getAllFormulas', () => {
    const engine = HyperFormula.buildFromSheets({
      Sheet1: [['=A()']],
      Foo: [[1]],
    })

    expect(engine.getAllSheetsFormulas()).toEqual({'Foo': [[undefined]], 'Sheet1': [['=A()']]})
  })

  it('getAllSerialized', () => {
    const engine = HyperFormula.buildFromSheets({
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

  it('handle different input types', () => {
    const engine = HyperFormula.buildFromArray([['', null, undefined]])

    expect(engine.getCellValue(adr('A1'))).toEqual('')
    expect(engine.getCellValue(adr('B1'))).toBe(null)
    expect(engine.getCellValue(adr('C1'))).toBe(null)
  })

  it('loadSheet with a loop', () => {
    const engine = HyperFormula.buildFromArray([['=B1', '=C1', '=A1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.CYCLE))
    expect(engine.getCellValue(adr('C1'))).toEqual(detailedError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside plus operator', () => {
    const engine = HyperFormula.buildFromArray([['5', '=A1+B1']])
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.CYCLE))
  })

  it('#loadSheet with a loop inside minus operator', () => {
    const engine = HyperFormula.buildFromArray([['5', '=A1-B1']])
    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.CYCLE))
  })

  it('loadSheet with operator precedence', () => {
    const engine = HyperFormula.buildFromArray([['=3*7*2-4*1+2']])
    expect(engine.getCellValue(adr('A1'))).toBe(40)
  })

  it('loadSheet with operator precedence and brackets', () => {
    const engine = HyperFormula.buildFromArray([['=3*7+((2-4)*(1+2)+3)*2']])
    expect(engine.getCellValue(adr('A1'))).toBe(15)
  })

  it('loadSheet with operator precedence with cells', () => {
    const engine = HyperFormula.buildFromArray([['3', '4', '=B1*2+A1']])
    expect(engine.getCellValue(adr('C1'))).toBe(11)
  })

  it('#loadSheet - it should build graph without cycle but with formula with error', () => {
    const engine = HyperFormula.buildFromArray([['=A1B1']])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
  })

  it('#loadSheet - dependency before value', () => {
    const engine = HyperFormula.buildFromArray([
      ['=B1', '1', '2'],
      ['=SUM(B2:C2)', '1', '2'],
    ])
    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('A2'))).toBe(3)
  })

  it('should be possible to build graph with reference to not existing sheet', () => {
    const engine = HyperFormula.buildFromArray([['=Sheet2!A2']])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=Sheet2!A2')
    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.REF))
  })

  it('#getCellFormula returns formula when present', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1,2,3,C3)'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(1,2,3,C3)')
  })

  it('#getCellFormula works with -0', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-0'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual('=-0')
  })

  it('#getCellFormula returns undefined for simple values', () => {
    const engine = HyperFormula.buildFromArray([
      [''],
      ['42'],
      ['foobar'],
    ])

    expect(engine.getCellFormula(adr('A1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A2'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A3'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A4'))).toEqual(undefined)
  })

  it('#getCellFormula returns matrix formula for matrix vertices', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
      ['{=MMULT(A1:B2,A1:B2)}', '{=MMULT(A1:B2,A1:B2)}'],
      ['{=MMULT(A1:B2,A1:B2)}', '{=MMULT(A1:B2,A1:B2)}'],
    ])

    expect(engine.getCellFormula(adr('A3'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('A4'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('B3'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
    expect(engine.getCellFormula(adr('B4'))).toEqual('{=MMULT(A1:B2,A1:B2)}')
  })

  it('#getCellFormula returns undefined for numeric matrices', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '1'],
      ['1', '1'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(engine.getCellFormula(adr('A1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('A2'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B1'))).toEqual(undefined)
    expect(engine.getCellFormula(adr('B2'))).toEqual(undefined)
  })

  it('#sheetName if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet()

    expect(engine.getSheetName(0)).toEqual('Sheet1')
  })

  it('#sheetName if sheet doesnt exists', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.getSheetName(0)).toBeUndefined()
  })

  it('#sheetId if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.getSheetId('foobar')).toEqual(0)
  })

  it('#sheetId if sheet doesnt exists', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.getSheetId('doesntexist')).toBeUndefined()
  })

  it('#doesSheetExist if sheet exists', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foobar')

    expect(engine.doesSheetExist('foobar')).toBe(true)
  })

  it('#doesSheetExist if sheet doesnt exist', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.doesSheetExist('foobar')).toBe(false)
  })

  it('#numberOfSheets for zero', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.countSheets()).toBe(0)
  })

  it('#numberOfSheets', () => {
    const engine = HyperFormula.buildEmpty()

    engine.addSheet('foo')

    expect(engine.countSheets()).toBe(1)
  })

  it('#renameSheet', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'bar')

    expect(engine.getSheetName(0)).toBe('bar')
    expect(engine.doesSheetExist('foo')).toBe(false)
    expect(engine.doesSheetExist('bar')).toBe(true)
  })

  it('#renameSheet when theres no sheet with given ID', () => {
    const engine = HyperFormula.buildEmpty()

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrowError('Sheet with id 0 doesn\'t exist')
  })

  it('#renameSheet when new sheet name is already taken', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet()
    engine.addSheet('bar')

    expect(() => {
      engine.renameSheet(0, 'bar')
    }).toThrowError('Sheet \'bar\' already exists')
  })

  it('#renameSheet for the same name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('foo')

    engine.renameSheet(0, 'foo')

    expect(engine.getSheetName(0)).toBe('foo')
    expect(engine.doesSheetExist('foo')).toBe(true)
  })

  it('#renameSheet for the same canonical name', () => {
    const engine = HyperFormula.buildEmpty()
    engine.addSheet('Foo')

    engine.renameSheet(0, 'FOO')

    expect(engine.getSheetName(0)).toBe('FOO')
    expect(engine.doesSheetExist('FOO')).toBe(true)
  })

  it('#sheetNames for empty engine', () => {
    const engine = HyperFormula.buildEmpty()

    expect(engine.getSheetNames()).toEqual([])
  })

  it('#sheetNames', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.addSheet('Foo')

    expect(engine.getSheetNames()).toEqual(['Sheet1', 'Foo'])
  })

  it('#getCellType empty cell', () => {
    const engine = HyperFormula.buildFromArray([[null, undefined]])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.EMPTY)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.EMPTY)
    expect(engine.getCellType(adr('C1'))).toBe(CellType.EMPTY)
  })

  it('#getCellType simple value', () => {
    const engine = HyperFormula.buildFromArray([['1', 'foo']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.VALUE)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.VALUE)
  })

  it('#getCellType formula', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(1, 2)']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.FORMULA)
  })

  it('#getCellType numeric matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
    ], {matrixDetection: true, matrixDetectionThreshold: 1})

    expect(engine.getCellType(adr('A1'))).toBe(CellType.VALUE)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.VALUE)
  })

  it('#getCellType formula matrix', () => {
    const engine = HyperFormula.buildFromArray([['{=TRANSPOSE(C1:C2)}', '{=TRANSPOSE(C1:C2)}']])

    expect(engine.getCellType(adr('A1'))).toBe(CellType.MATRIX)
    expect(engine.getCellType(adr('B1'))).toBe(CellType.MATRIX)
  })

  it('#doesCellHaveSimpleValue true', () => {
    const engine = HyperFormula.buildFromArray([['1', 'foo']])
    expect(engine.doesCellHaveSimpleValue(adr('A1'))).toEqual(true)
    expect(engine.doesCellHaveSimpleValue(adr('B1'))).toEqual(true)
  })

  it('#doesCellHaveSimpleValue false', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(1, 2)', null, '{=TRANSPOSE(A1:A1)}']])
    expect(engine.doesCellHaveSimpleValue(adr('A1'))).toEqual(false)
    expect(engine.doesCellHaveSimpleValue(adr('B1'))).toEqual(false)
    expect(engine.doesCellHaveSimpleValue(adr('C1'))).toEqual(false)
  })

  it('#doesCellHaveFormula true', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(1, 2)']])
    expect(engine.doesCellHaveFormula(adr('A1'))).toEqual(true)
  })

  it('#doesCellHaveFormula false', () => {
    const engine = HyperFormula.buildFromArray([['1', '', '{=TRANSPOSE(A1:A1)}', 'foo', null]])
    expect(engine.doesCellHaveFormula(adr('A1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('B1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('C1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('D1'))).toEqual(false)
    expect(engine.doesCellHaveFormula(adr('E1'))).toEqual(false)
  })

  it('#isCellEmpty true', () => {
    const engine = HyperFormula.buildFromArray([[null, undefined]])
    expect(engine.isCellEmpty(adr('A1'))).toEqual(true)
    expect(engine.isCellEmpty(adr('B1'))).toEqual(true)
    expect(engine.isCellEmpty(adr('C1'))).toEqual(true)
  })

  it('#isCellEmpty false', () => {
    const engine = HyperFormula.buildFromArray([['1', '=SUM(1, 2)', '{=TRANSPOSE(A1:A1)}', 'foo']])
    expect(engine.isCellEmpty(adr('A1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('B1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('C1'))).toEqual(false)
    expect(engine.isCellEmpty(adr('D1'))).toEqual(false)
  })

  it('#isCellPartOfMatrix true', () => {
    const engine = HyperFormula.buildFromArray([['{=TRANSPOSE(B1:B1)}']])
    expect(engine.isCellPartOfMatrix(adr('A1'))).toEqual(true)
  })

  it('#isCellPartOfMatrix false', () => {
    const engine = HyperFormula.buildFromArray([['1', '', '=SUM(1, 2)', 'foo']])
    expect(engine.isCellPartOfMatrix(adr('A1'))).toEqual(false)
    expect(engine.isCellPartOfMatrix(adr('B1'))).toEqual(false)
    expect(engine.isCellPartOfMatrix(adr('C1'))).toEqual(false)
    expect(engine.isCellPartOfMatrix(adr('D1'))).toEqual(false)
  })

  it('#getCellValueType string', () => {
    const engine = HyperFormula.buildFromArray([['foo']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.STRING)
  })

  it('#getCellValueType number', () => {
    const engine = HyperFormula.buildFromArray([['42', '=SUM(1, A1)']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.NUMBER)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.NUMBER)
  })

  it('#getCellValueType boolean', () => {
    const engine = HyperFormula.buildFromArray([['=TRUE()']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.BOOLEAN)
  })

  it('#getCellValueType empty value', () => {
    const engine = HyperFormula.buildFromArray([[null]])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.EMPTY)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.EMPTY)
  })

  it('#getCellValueType error', () => {
    const engine = HyperFormula.buildFromArray([['=1/0', '=SU()', '=A1']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('C1'))).toBe(CellValueType.ERROR)
  })

  it('#getCellValueType formula evaluating to range', () => {
    const engine = HyperFormula.buildFromArray([['=B1:B2', '=C:D']])
    expect(engine.getCellValueType(adr('A1'))).toBe(CellValueType.ERROR)
    expect(engine.getCellValueType(adr('B1'))).toBe(CellValueType.ERROR)
  })

  it('exporting translated errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=#VALUE!'],
    ], {language: 'enGB'})

    const error = engine.getCellValue(adr('A1')) as DetailedCellError
    expect(error.type).toEqual(ErrorType.VALUE)
    expect(error.value).toEqual('#VALUE!')
  })

  it('exporting detailed errors with translations', () => {
    HyperFormula.registerLanguage('plPL', plPL)
    const engine = HyperFormula.buildFromArray([
      ['=#ARG!'],
    ], {language: 'plPL'})

    const error = engine.getCellValue(adr('A1')) as DetailedCellError
    expect(error.type).toEqual(ErrorType.VALUE)
    expect(error.value).toEqual('#ARG!')
  })

  it('should correctly parse all JS types', () => {
    const engine = HyperFormula.buildFromArray([
      [1, true, null],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(1)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(null)
  })

  it('should work with other numerals', () => {
    const engine = HyperFormula.buildFromArray([
      [0o777, 0xFF, 0b1010, 1_000_000_000_000],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(511)
    expect(engine.getCellValue(adr('B1'))).toBe(255)
    expect(engine.getCellValue(adr('C1'))).toBe(10)
    expect(engine.getCellValue(adr('D1'))).toBe(1000000000000)
  })

  it('should allow to edit invalid formula', () => {
    const engine = HyperFormula.buildFromArray([])

    engine.setCellContents(adr('A1'), '=SUM(')

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(')
  })

  it('should allow to edit invalid matrix formula', () => {
    const engine = HyperFormula.buildFromArray([
      [ '{=TRANSPOSE(}' ]
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellFormula(adr('A1'))).toEqual('{=TRANSPOSE(}')
  })

  it('should propagate parsing errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(', '=A1']
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellFormula(adr('A1'))).toEqual('=SUM(')

    expect(engine.getCellValue(adr('B1'))).toEqual(detailedError(ErrorType.ERROR, 'Parsing error'))
    expect(engine.getCellFormula(adr('B1'))).toEqual('=A1')
  })

  it('#getRangeFormulas should return formulas', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, A2)', '=TRUE()']
    ])

    const out = engine.getRangeFormulas(adr('A1'), 2, 1)

    expectArrayWithSameContent([['=SUM(1, A2)', '=TRUE()']], out)
  })

  it('#getRangeValues should return values', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, B1)', '=TRUE()']
    ])

    const out = engine.getRangeValues(adr('A1'), 2, 1)

    expectArrayWithSameContent([[1, true]], out)
  })

  it('#getRangeSerialized should return serialized cells', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(1, B1)', '2', '#VALUE!']
    ])

    const out = engine.getRangeSerialized(adr('A1'), 3, 1)

    expectArrayWithSameContent([['=SUM(1, B1)', 2, '#VALUE!']], out)
  })
})
