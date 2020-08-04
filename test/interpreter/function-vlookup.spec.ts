import {HyperFormula} from '../../src'
import {ErrorType} from '../../src/Cell'
import {ConfigParams} from '../../src/Config'
import {adr, detailedError} from '../testUtils'
import {Sheet} from '../../src/Sheet'

const sharedExamples = (builder: (sheet: Sheet, config?: Partial<ConfigParams>) => HyperFormula) => {
  describe('VLOOKUP - args validation', () => {
    it('not enough parameters', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    })

    it('too many parameters', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 2, TRUE(), "foo")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))
    })

    it('wrong type of first argument', () => {
      const engine = builder([
        ['=VLOOKUP(D1:D2, A2:B3, 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    })

    it('wrong type of second argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, "foo", 2, TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    })

    it('wrong type of third argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, "foo", TRUE())'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    })

    it('wrong type of fourth argument', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 2, "bar")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE))
    })

    it('should return error when index argument greater that range width', () => {
      const engine = builder([
        ['=VLOOKUP(1, A2:B3, 3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.REF))
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
      ], {vlookupThreshold: 1})

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
      ], {vlookupThreshold: 1})

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
      ], {vlookupThreshold: 1})

      expect(engine.getCellValue(adr('A4'))).toEqual('c')
    })

    it('should return error when all values are greater', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=VLOOKUP(0, A1:B3, 2, TRUE())'],
      ], {vlookupThreshold: 1})

      expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA))
    })

    it('should return error when value not present using linear search', () => {
      const engine = builder([
        ['1', 'a'],
        ['2', 'b'],
        ['3', 'c'],
        ['=VLOOKUP(4, A1:B3, 2, FALSE())'],
      ])

      expect(engine.getCellValue(adr('A4'))).toEqual(detailedError(ErrorType.NA))
    })

    it('should find value if index build during evaluation', () => {
      const engine = builder([
        ['=A2', 'a'],
        ['1', 'b'],
        ['2', 'c'],
        ['=VLOOKUP(1, A1:B3, 2, TRUE())'],
      ], {vlookupThreshold: 1})

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

    it('should work for detected matrices', () => {
      const engine = builder([
        ['=VLOOKUP(3, A3:A5, 1, TRUE())'],
        ['1'],
        ['2'],
        ['3'],
      ], {matrixDetection: true, matrixDetectionThreshold: 1})

      expect(engine.getCellValue(adr('A1'))).toEqual(3)
    })

    it('should work for standard matrices', () => {
      const engine = builder([
        ['=VLOOKUP(3, A4:B6, 2, TRUE())'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['{=TRANSPOSE(A2:C3)}'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(6)
    })

    it('should work after updating standard matrix', () => {
      const engine = builder([
        ['=VLOOKUP(4, A4:B6, 2, TRUE())'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['{=TRANSPOSE(A2:C3)}'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA))

      engine.setCellContents(adr('C2'), '4')

      expect(engine.getCellValue(adr('A1'))).toEqual(6)
    })
  })
}

describe('ColumnIndex strategy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedExamples((sheet: Sheet, config: any = {}) => {
    return HyperFormula.buildFromArray(sheet, {
      useColumnIndex: true,
      ...config,
    })
  })
})

describe('BinarySearchStrategy', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sharedExamples((sheet: Sheet, config: any = {}) => {
    return HyperFormula.buildFromArray(sheet, {
      useColumnIndex: false,
      ...config,
    })
  })

  it('should calculate indexes properly when using binary search', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VLOOKUP(4, A5:A10, 1, TRUE())'],
      [],
      [],
      [],
      ['1'],
      ['2'],
      ['3'],
      ['4'],
      ['5'],
    ], {useColumnIndex: false, vlookupThreshold: 1})

    expect(engine.getCellValue(adr('A1'))).toEqual(4)
  })

  it('should calculate indexes properly when using naitve approach', () => {
    const engine = HyperFormula.buildFromArray([
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
})
