import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function HLOOKUP', () => {
  describe('HLOOKUP - args validation', () => {
    it('not enough parameters', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, A2:B3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('too many parameters', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, A2:B3, 2, TRUE(), "foo")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('wrong type of first argument', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(D1:E1, A2:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('wrong type of second argument', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, "foo", 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('wrong type of third argument', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, A2:B3, "foo", TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('wrong type of fourth argument', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, A2:B3, 2, "bar")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('should return error when index argument greater that range height', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, A2:B3, 3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.IndexLarge))
    })

    it('should return error when index is less than one', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1, C3:D5, 0)'],
        ['=HLOOKUP(1, C2:D3, -1)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    })

    it('should propagate errors properly', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(1/0, B1:B1, 1)'],
        ['=HLOOKUP(1, B1:B1, 1/0)'],
        ['=HLOOKUP(1, A10:A11, 1, NA())']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
    })
  })

  describe('HLOOKUP', () => {
    it('should find value in sorted range', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3', '4', '5'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP(2, A1:E2, 2)']
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('b')
    })

    it('should find value in sorted range using linearSearch', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3', '4', '5'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP(2, A1:E2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('b')
    })

    it('works with wildcards', async() => {
const engine = await HyperFormula.buildFromArray([
        ['abd', 1, 'aaaa', 'ddaa', 'abcd'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP("*c*", A1:E2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('e')
    })

    it('on sorted data ignores wildcards', async() => {
const engine = await HyperFormula.buildFromArray([
        ['abd', 1, '*c*', 'ddaa', 'abcd'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP("*c*", A1:E2, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('c')
    })

    it('should find value in unsorted range using linearSearch', async() => {
const engine = await HyperFormula.buildFromArray([
        ['5', '4', '3', '2', '1'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP(2, A1:E2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('d')
    })

    it('should find value in sorted range with different types', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3', '=TRUE()', 'foo'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP(TRUE(), A1:E2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('d')
    })

    it('should find value in unsorted range with different types', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=TRUE()', '4', 'foo', '2', 'bar'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=HLOOKUP(2, A1:E2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('d')
    })

    it('should return lower bound for sorted values', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3'],
        ['a', 'b', 'c'],
        ['=HLOOKUP(4, A1:C2, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('c')
    })

    it('should return error when all values are greater', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3'],
        ['a', 'b', 'c'],
        ['=HLOOKUP(0, A1:C2, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should return error when value not present using linear search', async() => {
const engine = await HyperFormula.buildFromArray([
        ['1', '2', '3'],
        ['a', 'b', 'c'],
        ['=HLOOKUP(4, A1:C2, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should find value if index build during evaluation', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=B1', '1', '2'],
        ['a', 'b', 'c'],
        ['=HLOOKUP(1, A1:C2, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('a')
    })

    it('should properly calculate absolute row index', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(3, C1:E1, 1, TRUE())', 'foo', '1', '2', '3']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(3)
    })

    it('should calculate indexes properly when using binary search', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(4, E1:J1, 1, TRUE())', null, null, null, '1', '2', '3', '4', '5']
      ], {useColumnIndex: false})

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('should calculate indexes properly when using naitve approach', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(4, E1:J1, 1, TRUE())', null, null, null, '1', '2', '3', '4', '5']
      ], {useColumnIndex: false})

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('should coerce empty arg to 0', async() => {
const engine = await HyperFormula.buildFromArray([
        [ '0', '2', '3', '4', '5' ],
        [ 'a', 'b', 'c', 'd', 'e' ],
        ['=HLOOKUP(F3, A1:E2, 2)'],
        ['=HLOOKUP(, A1:E2, 2)'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual('a')
      expect(engine.getCellValue(adr('A4'))).toEqual('a')
    })

    it('should not coerce', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP("1", A2:C2, 1)'],
        [1, 2, 3],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should properly report no match', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP("0", A2:D2, 1)'],
        [1, 2, 3, '\'1'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should properly report approximate matching', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP("2", A2:D2, 1)'],
        [1, 2, 3, '\'1'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual('1')
    })

    it('should coerce null to zero when using naive approach', async() => {
const engine = await HyperFormula.buildFromArray([
        ['=HLOOKUP(, A2:C2, 1, FALSE())'],
        [1, 3, 0],
      ], {useColumnIndex: false})

      expect(engine.getCellValue(adr('A1'))).toEqual(0)
    })
  })

  it('should work on row ranges', async() => {
const engine = await HyperFormula.buildFromArray([
      [ '=HLOOKUP(2,2:3,2)'],
      [ 1, 2, 3],
      [ 'a', 'b', 'c'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual('b')
  })

  it('works for strings, is not case sensitive', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'b', 'c', 'A', 'B'],
      [1, 2, 3, 4, 5],
      ['=HLOOKUP("A", A1:E2, 2, FALSE())']
    ], {caseSensitive: false})

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('works for strings, is not case sensitive even if config defines case sensitivity', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'b', 'c', 'A', 'B'],
      [1, 2, 3, 4, 5],
      ['=HLOOKUP("A", A1:E2, 2, FALSE())']
    ], {caseSensitive: true})

    expect(engine.getCellValue(adr('A3'))).toEqual(1)
  })

  it('should find value in sorted range', async() => {
const engine = await HyperFormula.buildFromArray([
      ['a', 'B', 'c', 'd', 'e'],
      [1, 2, 3, 4, 5],
      ['=HLOOKUP("b", A1:E2, 2)'],
    ], {caseSensitive: false})
    expect(engine.getCellValue(adr('A3'))).toEqual(2)
  })
})
