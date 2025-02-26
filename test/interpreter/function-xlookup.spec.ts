import { HyperFormula, ErrorType } from '../../src'
import { ErrorMessage } from '../../src/error-message'
import { adr, detailedError } from '../testUtils'
import { AbsoluteCellRange } from '../../src/AbsoluteCellRange'

describe('Function XLOOKUP', () => {
  describe('validates arguments', () => {
    it('returns error when less than 3 arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:B3)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('returns error when more than 5 arguments', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:A3, B2:B3, "foo", 0, 1, 42)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('returns error when shapes of lookupArray and returnArray are incompatible', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, B1:B10, C1:C9)'], // returnArray too short
        ['=XLOOKUP(1, B1:B10, C1:C11)'], // returnArray too long
        ['=XLOOKUP(1, B1:B10, C1:D5)'], // returnArray too short
        ['=XLOOKUP(1, B1:E1, B2:D2)'], // returnArray too short
        ['=XLOOKUP(1, B1:E1, B2:F2)'], // returnArray too long
        ['=XLOOKUP(1, B1:E1, B2:C3)'], // returnArray too short
        ['=XLOOKUP(1, B1:B3, C1:E1)'], // transposed
        ['=XLOOKUP(1, C1:E1, B1:B3)'], // transposed
        ['=XLOOKUP(1, B1:C2, D3:E4)'], // lookupArray: 2d range
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A7'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A8'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
      expect(engine.getCellValue(adr('A9'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongDimension))
    })

    it('returns error when matchMode is of wrong type', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, -2)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 3)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0.5)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, "string")'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, B1:B2)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
      expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))   
    })

    it('returns error when searchMode is of wrong type', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, -3)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, 3)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, 0)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, 0.5)'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, "string")'],
        ['=XLOOKUP(1, B1:B2, C1:C2, 0, 0, D1:D2)'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A4'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
      expect(engine.getCellValue(adr('A5'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
      expect(engine.getCellValue(adr('A6'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
    })

    it('propagates errors properly', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1/0, B1:B1, 1)'],
        ['=XLOOKUP(1, B1:B1, 1/0)'],
        ['=XLOOKUP(1, A10:A11, NA())']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
    })
  })

  describe('with default matchMode and searchMode', () => {
    it('finds value in a sorted row', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:D1, B1:D1)', 1, 2, 3],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('finds value in an unsorted row', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:D1, B1:D1)', 4, 2, 3],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('finds value in a sorted column', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:B3, B1:B3)', 1],
        ['', 2],
        ['', 3],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('finds value in an unsorted column', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:B3, B1:B3)', 4],
        ['', 2],
        ['', 3],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('when key is not found, returns ifNotFound value or NA error', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:B3, B1:B3)'],
        ['=XLOOKUP(2, B1:D1, B1:D1)'],
        ['=XLOOKUP(2, B1:B3, B1:B3, "not found")'],
        ['=XLOOKUP(2, B1:D1, B1:D1, "not found")'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      expect(engine.getCellValue(adr('A3'))).toEqual('not found')
      expect(engine.getCellValue(adr('A4'))).toEqual('not found')
    })

    it('works when returnArray is shifted (vertical search)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:B3, C11:C13)', 1],
        ['', 2],
        ['', 3],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        ['', '', 'a'],
        ['', '', 'b'],
        ['', '', 'c'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual('b')
    })

    it('works when returnArray is shifted (horizontal search)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, B1:D1, C2:E2)', '1', '2', '3'],
        ['', '', 'a', 'b', 'c'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual('b')
    })

    it('should not perform the wildcard match unless matchMode=2', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP("a?b*", A2:E2, A2:E2)'],
        ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    it('should not perform the wildcard match unless matchMode=2 (ColumnIndex)', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP("a?b*", A2:E2, A2:E2)'],
        ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
    })

    describe('when lookupArray is a single-cell range', () => {
      it('returns single cell, when returnArray is also a single-cell range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(1, B1:B1, C1:C1)', 1, 'a'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual('a')
      })

      it('returns a vertical range, when returnArray is a vertical range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(1, B1:B1, A3:A4)', 1],
          [],
          ['b'],
          ['c']
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual('b')
        expect(engine.getCellValue(adr('A2'))).toEqual('c')
      })

      it('returns a horizontal range, when returnArray is a horizontal range', () => {
        const engine = HyperFormula.buildFromArray([
          [1, 'b', 'c'],
          ['=XLOOKUP(1, A1:A1, B1:C1)'],
        ])

        expect(engine.getCellValue(adr('A2'))).toEqual('b')
        expect(engine.getCellValue(adr('B2'))).toEqual('c')
      })
    })

    it('finds an empty cell', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP("", B1:D1, B2:D2)', 1, 2, ''],
        ['', 'a', 'b', 'c']
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual('c')
    })
  })

  describe('with BinarySearch column search strategy, when provided with searchMode = ', () => {
    it('1, finds the first match in unsorted horizontal range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:E2, A3:E3, "NotFound", 0, 1)'],
        [2, 1, 3, 1, 4],
        [1, 2, 3, 4, 5],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('1, finds the first match in unsorted vertical range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:A6, B2:B6, "NotFound", 0, 1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('1, returns "NotFound" if there is no match', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(5, A2:A6, B2:B6, "NotFound", 0, 1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('-1, finds the last match in unsorted horizontal range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:E2, A3:E3, "NotFound", 0, -1)'],
        [2, 1, 3, 1, 4],
        [1, 2, 3, 4, 5],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('-1, finds the last match in unsorted vertical range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:A6, B2:B6, "NotFound", 0, -1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('-1, returns "NotFound" if there is no match', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(5, A2:A6, B2:B6, "NotFound", 0, -1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('2, finds the value in horizontal range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:E2, A2:E2, "NotFound", 0, 2)'],
        [1, 2, 2, 5, 5],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('2, finds the value in vertical range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:A6, A2:A6, "NotFound", 0, 2)'],
        [1],
        [2],
        [2],
        [5],
        [5],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('2, returns "NotFound" if there is no match in a range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(3, A2:A6, A2:A6, "NotFound", 0, 2)'],
        [1],
        [2],
        [2],
        [5],
        [5],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('-2, finds the value in horizontal range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:E2, A2:E2, "NotFound", 0, -2)'],
        [5, 2, 2, 1, 1],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('-2, finds the value in vertical range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:A6, A2:A6, "NotFound", 0, -2)'],
        [5],
        [2],
        [2],
        [1],
        [1],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('-2, returns "NotFound" if there is no match in a range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(3, A2:A6, A2:A6, "NotFound", 0, -2)'],
        [5],
        [2],
        [2],
        [1],
        [1],
      ], { useColumnIndex: false })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })
  })

  describe('with ColumnIndex column search strategy, when provided with searchMode = ', () => {
    it('1, finds the first match in unsorted horizontal range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:E2, A3:E3, "NotFound", 0, 1)'],
        [2, 1, 3, 1, 4],
        [1, 2, 3, 4, 5],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('1, finds the first match in unsorted vertical range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:A6, B2:B6, "NotFound", 0, 1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('1, returns "NotFound" if there is no match', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(5, A2:A6, B2:B6, "NotFound", 0, 1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('-1, finds the last match in unsorted horizontal range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:E2, A3:E3, "NotFound", 0, -1)'],
        [2, 1, 3, 1, 4],
        [1, 2, 3, 4, 5],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('-1, finds the last match in unsorted vertical range', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(1, A2:A6, B2:B6, "NotFound", 0, -1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('-1, returns "NotFound" if there is no match', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(5, A2:A6, B2:B6, "NotFound", 0, -1)'],
        [2, 1],
        [1, 2], 
        [3, 3],
        [1, 4],
        [4, 5]
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('2, finds the value in horizontal range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:E2, A2:E2, "NotFound", 0, 2)'],
        [1, 2, 2, 5, 5],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('2, finds the value in vertical range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:A6, A2:A6, "NotFound", 0, 2)'],
        [1],
        [2],
        [2],
        [5],
        [5],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('2, returns "NotFound" if there is no match in a range sorted ascending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(3, A2:A6, A2:A6, "NotFound", 0, 2)'],
        [1],
        [2],
        [2],
        [5],
        [5],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })

    it('-2, finds the value in horizontal range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:E2, A2:E2, "NotFound", 0, -2)'],
        [5, 2, 2, 1, 1],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('-2, finds the value in vertical range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(2, A2:A6, A2:A6, "NotFound", 0, -2)'],
        [5],
        [2],
        [2],
        [1],
        [1],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('-2, returns "NotFound" if there is no match in a range sorted descending', () => {
      const engine = HyperFormula.buildFromArray([
        ['=XLOOKUP(3, A2:A6, A2:A6, "NotFound", 0, -2)'],
        [5],
        [2],
        [2],
        [1],
        [1],
      ], { useColumnIndex: true })

      expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
    })
  })

  describe('with BinarySearch column search strategy, when provided with matchMode = ', () => {
    describe('-1 (looking for a lower bound)', () => {
      describe('in array ordered ascending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 42, 50, 51],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns a lower bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 40, 50, 51],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(40)
        })

        it('returns a lower bound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 3, 4, 5],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(5)
        })

        it('returns NotFound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [43, 44, 45, 46, 47],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })
      })

      describe('in array ordered descending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [55, 54, 42, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns a lower bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [55, 54, 40, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(40)
        })

        it('returns a lower bound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [5, 4, 3, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(5)
        })

        it('returns NotFound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [100, 90, 80, 70, 60],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })
      })

      it('returns a lower bound if there is no match in unsorted horizontal range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:E2, A3:E3, "NotFound", -1, 1)'],
          [2, 1, 4, 2, 5],
          [1, 2, 3, 4, 5],
        ], { useColumnIndex: false })

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })

      it('returns a lower bound if there is no match in unsorted vertical range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:A6, B2:B6, "NotFound", -1, 1)'],
          [2, 1],
          [1, 2],
          [4, 3],
          [2, 4],
          [5, 5]
        ], { useColumnIndex: false })

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })
    })

    describe('1 (looking for a upper bound', () => {
      describe('in array ordered ascending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 42, 50, 51],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns an upper bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 44, 50, 51],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(44)
        })

        it('returns NotFound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 3, 4, 5],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })

        it('returns an upper bound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [43, 44, 45, 46, 47],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(43)
        })
      })

      describe('in array ordered descending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [55, 54, 42, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns an upper bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [55, 54, 44, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(44)
        })

        it('returns NotFound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [5, 4, 3, 2, 1],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })

        it('returns an upper bound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [100, 90, 80, 70, 60],
          ], { useColumnIndex: false })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(60)
        })
      })

      it('returns an upper bound if there is no match in unsorted horizontal range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:E2, A3:E3, "NotFound", 1, 1)'],
          [2, 1, 4, 2, 5],
          [1, 2, 3, 4, 5],
        ], { useColumnIndex: false })

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns an upper bound if there is no match in unsorted vertical range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:A6, B2:B6, "NotFound", 1, 1)'],
          [2, 1],
          [1, 2],
          [4, 3],
          [2, 4],
          [5, 5]
        ], { useColumnIndex: false })

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })
    })

    describe('2 (wildcard match)', () => {
      describe('for a horizontal range', () => {
        it('when searchMode = 1, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, 1)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = 2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, 2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, -2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -1, returns the last matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, -1)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a2b222')
        })

        it('when there are no matching items, returns NotFound (all searchModes)', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, 1)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, -1)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, 2)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, -2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A2'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A3'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A4'))).toEqual('NotFound')
        })
      })

      describe('for a vertical range', () => {
        it('when searchMode = 1, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, 1)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = 2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, 2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, -2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -1, returns the last matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, -1)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('a2b222')
        })

        it('when there are no matching items, returns NotFound (all searchModes)', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, 1)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, -1)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, 2)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, -2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: false })
  
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A2'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A3'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A4'))).toEqual('NotFound')
        })
      })
    })
  })

  describe('with ColumnIndex column search strategy, when provided with matchMode = ', () => {
    describe('-1 (looking for a lower bound', () => {
      describe('in array ordered ascending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 42, 50, 51],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns a lower bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 40, 50, 51],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(40)
        })

        it('returns a lower bound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [1, 2, 3, 4, 5],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(5)
        })

        it('returns NotFound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, 2)'],
            [43, 44, 45, 46, 47],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })
      })

      describe('in array ordered descending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [55, 54, 42, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns a lower bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [55, 54, 40, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(40)
        })

        it('returns a lower bound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [5, 4, 3, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(5)
        })

        it('returns NotFound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", -1, -2)'],
            [100, 90, 80, 70, 60],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })
      })

      it('returns a lower bound if there is no match in unsorted horizontal range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:E2, A3:E3, "NotFound", -1, 1)'],
          [2, 1, 4, 2, 5],
          [1, 2, 3, 4, 5],
        ], { useColumnIndex: true })

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })

      it('returns a lower bound if there is no match in unsorted vertical range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:A6, B2:B6, "NotFound", -1, 1)'],
          [2, 1],
          [1, 2],
          [4, 3],
          [2, 4],
          [5, 5]
        ], { useColumnIndex: true })

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })
    })

    describe('1 (looking for a upper bound', () => {
      describe('in array ordered ascending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 42, 50, 51],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns an upper bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 44, 50, 51],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(44)
        })

        it('returns NotFound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [1, 2, 3, 4, 5],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })

        it('returns an upper bound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, 2)'],
            [43, 44, 45, 46, 47],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(43)
        })
      })

      describe('in array ordered descending', () => {
        it('returns exact match if exists', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [55, 54, 42, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(42)
        })

        it('returns an upper bound when there is no exact match', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [55, 54, 44, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(44)
        })

        it('returns NotFound when all elements are smaller than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [5, 4, 3, 2, 1],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
        })

        it('returns an upper bound when all elements are greater than the key', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP(42, A2:E2, A2:E2, "NotFound", 1, -2)'],
            [100, 90, 80, 70, 60],
          ], { useColumnIndex: true })
    
          expect(engine.getCellValue(adr('A1'))).toEqual(60)
        })
      })

      it('returns an upper bound if there is no match in unsorted horizontal range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:E2, A3:E3, "NotFound", 1, 1)'],
          [2, 1, 4, 2, 5],
          [1, 2, 3, 4, 5],
        ], { useColumnIndex: true })

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns an upper bound if there is no match in unsorted vertical range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=XLOOKUP(3, A2:A6, B2:B6, "NotFound", 1, 1)'],
          [2, 1],
          [1, 2],
          [4, 3],
          [2, 4],
          [5, 5]
        ], { useColumnIndex: true })

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })
    })

    describe('2 (wildcard match)', () => {
      describe('for a horizontal range', () => {
        it('when searchMode = 1, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, 1)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = 2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, 2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, -2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -1, returns the last matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:E2, A2:E2, "NotFound", 2, -1)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a2b222')
        })

        it('when there are no matching items, returns NotFound (all searchModes)', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, 1)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, -1)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, 2)'],
            ['=XLOOKUP("t?b*", A5:E5, A5:E5, "NotFound", 2, -2)'],
            ['a', 'axxb', 'a1b111', 'a2b222', 'x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A2'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A3'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A4'))).toEqual('NotFound')
        })
      })

      describe('for a vertical range', () => {
        it('when searchMode = 1, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, 1)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = 2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, 2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -2, returns the first matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, -2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a1b111')
        })

        it('when searchMode = -1, returns the last matching item', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("a?b*", A2:A6, A2:A6, "NotFound", 2, -1)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('a2b222')
        })

        it('when there are no matching items, returns NotFound (all searchModes)', () => {
          const engine = HyperFormula.buildFromArray([
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, 1)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, -1)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, 2)'],
            ['=XLOOKUP("t?b*", A5:A9, A5:A9, "NotFound", 2, -2)'],
            ['a'],
            ['axxb'],
            ['a1b111'],
            ['a2b222'],
            ['x'],
          ], { useColumnIndex: true })

          expect(engine.getCellValue(adr('A1'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A2'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A3'))).toEqual('NotFound')
          expect(engine.getCellValue(adr('A4'))).toEqual('NotFound')
        })
      })
    })
  })

  describe('acts similar to Microsoft Excel', () => {
  /**
   * Examples from
   * https://support.microsoft.com/en-us/office/xlookup-function-b7fd680e-6d10-43e6-84f9-88eae8bf5929
   */

    it('should find value in simple column range (official example 1)', () => {
      const engine = HyperFormula.buildFromArray([
        ['China', 'CN'],
        ['India', 'IN'],
        ['United States', 'US'],
        ['Indonesia', 'ID'],
        ['France', 'FR'],
        ['=XLOOKUP("Indonesia", A1:A5, B1:B5)'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('ID')
    })

    it('should find row range in table (official example 2)', () => {
      const engine = HyperFormula.buildFromArray([
        ['8389', 'Dianne Pugh', 'Finance'],
        ['4390', 'Ned Lanning', 'Marketing'],
        ['8604', 'Margo Hendrix', 'Sales'],
        ['8389', 'Dianne Pugh', 'Finance'],
        ['4937', 'Earlene McCarty', 'Accounting'],
        ['=XLOOKUP(A1, A2:A5, B2:C5)'],
      ])

      expect(engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A6'), 2, 1))).toEqual([['Dianne Pugh', 'Finance']])
    })

    it('should find column range in table (official example 2, transposed)', () => {
      const engine = HyperFormula.buildFromArray([
        ['8389', '4390', '8604', '8389', '4937'],
        ['Dianne Pugh', 'Ned Lanning', 'Margo Hendrix', 'Dianne Pugh', 'Earlene McCarty'],
        ['Finance', 'Marketing', 'Sales', 'Finance', 'Accounting'],
        ['=XLOOKUP(A1, B1:E1, B2:E3)'],
        []
      ])

      expect(engine.getRangeValues(AbsoluteCellRange.spanFrom(adr('A4'), 1, 2))).toEqual([['Dianne Pugh'], ['Finance']])
    })

    it('should find use if_not_found argument if not found (official example 3)', () => {
      const engine = HyperFormula.buildFromArray([
        ['1234', 'Dianne Pugh', 'Finance'],
        ['4390', 'Ned Lanning', 'Marketing'],
        ['8604', 'Margo Hendrix', 'Sales'],
        ['8389', 'Dianne Pugh', 'Finance'],
        ['4937', 'Earlene McCarty', 'Accounting'],
        ['=XLOOKUP(A1, A2:A5, B2:B5, "ID not found")'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('ID not found')
    })

    it('example 4', () => {
      const engine = HyperFormula.buildFromArray([
        ['10', 'a'],
        ['20', 'b'],
        ['30', 'c'],
        ['40', 'd'],
        ['50', 'e'],
        ['=XLOOKUP(25, A1:A5, B1:B5, 0, 1, 1)'],
      ])

      expect(engine.getCellValue(adr('A6'))).toEqual('c')
    })

    it('nested xlookup function to perform both a vertical and horizontal match (official example 5)', () => {
      const engine = HyperFormula.buildFromArray([
        ['Quarter', 'Gross profit', 'Net profit', 'Profit %'],
        ['Qtr1', '=XLOOKUP(B1, $A4:$A12, XLOOKUP($A2, $B3:$F3, $B4:$F12))', '19342', '29.3'],
        ['Income statement', 'Qtr1', 'Qtr2', 'Qtr3', 'Qtr4', 'Total'],
        ['Total sales', '50000', '78200', '89500', '91200', '308950'],
        ['Cost of sales', '25000', '42050', '59450', '60450', '186950'],
        ['Gross profit', '25000', '36150', '30050', '30800', '122000'],
        ['Depreciation', '899', '791', '202', '412', '2304'],
        ['Interest', '513', '853', '150', '956', '2472'],
        ['Earnings before tax', '23588', '34506', '29698', '29432', '117224'],
        ['Tax', '4246', '6211', '5346', '5298', '21100'],
        ['Net profit', '19342', '28295', '24352', '24134', '96124'],
        ['Profit %', '29.3', '27.8', '23.4', '27.6', '26.9'],
      ])

      expect(engine.getCellValue(adr('B2'))).toEqual(25000)
    })
  })
})
