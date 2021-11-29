import {ErrorType, HyperFormula} from '../../src'
import {ConfigParams} from '../../src/Config'
import {ErrorMessage} from '../../src/error-message'
import {Sheet} from '../../src/Sheet'
import {adr, detailedError} from '../testUtils'

const sharedExamples = (builder: (sheet: Sheet, config?: Partial<ConfigParams>) => HyperFormula) => {
  describe('VLOOKUP - args validation', () => {
    it('not enough parameters', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('too many parameters', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 2, TRUE(), "foo")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('wrong type of first argument', () => {
      const engine = builder([
        ['=VLOOKUP(D1:E1, A2:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('wrong type of second argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, "foo", 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('wrong type of third argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, "foo", TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    })

    it('wrong type of fourth argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 2, "bar")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('should return error when index argument greater that range width', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.IndexLarge))
    })

    it('should return error when index is less than one', () => {
      const engine = builder([
        ['=VLOOKUP(1, C2:D3, 0)'],
        ['=VLOOKUP(1, C2:D3, -1)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.LessThanOne))
    })

    it('should propagate errors properly', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VLOOKUP(1/0, B1:B1, 1)'],
        ['=VLOOKUP(1, B1:B1, 1/0)'],
        ['=VLOOKUP(1, A10:A11, 1, NA())']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
    })
  })

  describe('VLOOKUP', () => {
    it('should find value in sorted range', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['4', 'd'],
        ['5', 'e'],
        ['=VLOOKUP(2, A1:B5, 2)'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('b')
    })

    it('should find value in sorted range using linearSearch', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['4', 'd'],
        ['5', 'e'],
        ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('b')
    })

    it('works with wildcards', () => {
      const engine = builder([
        ['abd', 'a'],
        [1, 'b'],
        ['aaaa', 'c'],
        ['ddaa', 'd'],
        ['abcd', 'e'],
        ['=VLOOKUP("*c*", A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('e')
    })

    it('on sorted data ignores wildcards', () => {
      const engine = builder([
        ['abd', 'a'],
        [1, 'b'],
        ['*c*', 'c'],
        ['ddaa', 'd'],
        ['abcd', 'e'],
        ['=VLOOKUP("*c*", A1:B5, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('c')
    })

    it('should find value in unsorted range using linearSearch', () => {
      const engine = builder([
        ['5', 'a'],
        ['4', 'b'],
        ['3', 'c'],
        ['2', 'd'],
        ['1', 'e'],
        ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('d')
    })

    it('should find value in unsorted range using linearSearch', () => {
      const engine = builder([
        ['5', 'a'],
        ['4', 'b'],
        ['3', 'c'],
        ['2', 'd'],
        ['1', 'e'],
        ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('d')
    })

    it('should find value in sorted range with different types', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=TRUE()', 'd'],
        ['foo', 'e'],
        ['=VLOOKUP(TRUE(), A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('d')
    })

    it('should find value in unsorted range with different types', () => {
      const engine = builder([
        ['=TRUE()', 'a'],
        ['4', 'b'],
        ['foo', 'c'],
        ['2', 'd'],
        ['bar', 'e'],
        ['=VLOOKUP(2, A1:B5, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('d')
    })

    it('should return lower bound for sorted values', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=VLOOKUP(4, A1:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqual('c')
    })

    it('should return error when all values are greater', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=VLOOKUP(0, A1:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should return error when value not present using linear search', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=VLOOKUP(4, A1:B3, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should find value if index build during evaluation', () => {
      const engine = builder([
        ['=A2', 'a'],
        ['1', 'b'],
        ['2', 'c'],
        ['=VLOOKUP(1, A1:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqual('a')
    })

    it('should properly calculate absolute row index', () => {
      const engine = builder([
        ['=VLOOKUP(3, A3:A5, 1, TRUE())'],
        ['foo'],
        ['1'],
        ['2'],
        ['3'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(3)
    })

    it('should work for standard matrices', () => {
      const engine = builder([
        ['=VLOOKUP(3, A4:B6, 2, TRUE())'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['=TRANSPOSE(A2:C3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(6)
    })

    it('should work after updating standard matrix', () => {
      const engine = builder([
        ['=VLOOKUP(4, A4:B6, 2, TRUE())'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['=TRANSPOSE(A2:C3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(6)

      engine.setCellContents(adr('C2'), '5')

      expect(engine.getCellValue(adr('A1'))).toEqual(5)
    })

    it('should coerce empty arg to 0', () => {
      const engine = builder([
        ['0', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['4', 'd'],
        ['5', 'e'],
        ['=VLOOKUP(C3, A1:B5, 2)'],
        ['=VLOOKUP(, A1:B5, 2)'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('a')
      expect(engine.getCellValue(adr('A7'))).toEqual('a')
    })
  })
}

describe('ColumnIndex strategy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedExamples((sheet: Sheet, config: any = {}) => {
    return HyperFormula.buildFromArray(sheet, {
      useColumnIndex: true,
      ...config,
    })[0]
  })
})

describe('BinarySearchStrategy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedExamples((sheet: Sheet, config: any = {}) => {
    return HyperFormula.buildFromArray(sheet, {
      useColumnIndex: false,
      ...config,
    })[0]
  })

  it('should calculate indexes properly when using binary search', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP(4, A5:A10, 1, TRUE())'],
      [],
      [],
      [],
      ['1'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ], {useColumnIndex: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('should calculate indexes properly when using naive approach', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP(4, A5:A10, 1, FALSE())'],
      [],
      [],
      [],
      ['1'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ], {useColumnIndex: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('should coerce null to zero when using naive approach', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP(, A2:A4, 1, FALSE())'],
      [1],
      [3],
      [0],
    ], {useColumnIndex: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('should work on column ranges', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP(2,B:C,2)', 1, 'a'],
      [null, 2, 'b'],
      [null, 3, 'c'],
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual('b')
  })

  it('works for strings, is not case sensitive', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['A', '4'],
      ['B', '5'],
      ['=VLOOKUP("A", A1:B5, 2, FALSE())']
    ], {caseSensitive: false})

    expect(engine.getCellValue(adr('A6'))).toEqual(1)
  })

  it('works for strings, is not case sensitive even if config defines case sensitivity', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['A', '4'],
      ['B', '5'],
      ['=VLOOKUP("A", A1:B5, 2, FALSE())']
    ], {caseSensitive: true})

    expect(engine.getCellValue(adr('A6'))).toEqual(1)
  })

  it('should find value in sorted range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['a', '1'],
      ['B', '2'],
      ['c', '3'],
      ['d', '4'],
      ['e', '5'],
      ['=VLOOKUP("b", A1:B5, 2)'],
    ], {caseSensitive: false})
    expect(engine.getCellValue(adr('A6'))).toEqual(2)
  })

  it('should properly report no match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP("0", A2:A5, 1)'],
      [1],
      [2],
      [3],
      ['\'1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
  })

  it('should properly report approximate matching', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=VLOOKUP("2", A2:A5, 1)'],
      [1],
      [2],
      [3],
      ['\'1'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual('1')
  })
})
