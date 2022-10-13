import {ErrorType, HyperFormula} from '../../src'
import {DependencyGraph} from '../../src/DependencyGraph'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError, resetSpy} from '../testUtils'

describe('Function MATCH', () => {
  it('validates number of arguments', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(1)'],
      ['=MATCH(1, B1:B3, 0, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('validates that 1st argument is number, string or boolean', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(C2:C3, B1:B1)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('2nd argument can be a scalar', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(42, 42)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(1)
  })

  it('validates that 3rd argument is number', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(0, B1:B1, "a")'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
  })

  it('validates that 3rd argument is in [-1, 0, 1]', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(0, B1:B1, -2)'],
      ['=MATCH(0, B1:B1, 0.5)'],
      ['=MATCH(0, B1:B1, 100)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.BadMode))
  })

  it('should propagate errors properly', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(1/0, B1:B1)'],
      ['=MATCH(1, B1:B1, 1/0)'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  it('when MatchType is empty defaults to 1 (returns lower bound)', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(113, A2:A5)'],
      ['100'],
      ['110'],
      ['120'],
      ['130'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(2)
  })

  describe('when MatchType = 0', () => {
    describe('when search range is vertical', () => {
      it('works when the result is in the first cell', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:A5, 0)'],
          ['103'],
          ['200'],
          ['200'],
          ['200'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })

      it('works when the result is in the last cell', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:A5, 0)'],
          ['200'],
          ['200'],
          ['200'],
          ['103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(102, A6:A9, 0)'],
          [''],
          [''],
          [''],
          [''],
          ['100'],
          ['101'],
          ['102'],
          ['103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns the first matching result', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:A5, 0)'],
          ['200'],
          ['103'],
          ['103'],
          ['200'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A3:A6, 0)'],
          ['103', '103'],
          ['200', '103'],
          ['200', '103'],
          ['200', '103'],
          ['200', '103'],
          ['103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    describe('when search range is horizontal', () => {
      it('works when the result is in first cell', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:D2, 0)'],
          ['103', '200', '200', '200'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
      })

      it('works when the result is in the last cell', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:D2, 0)'],
          ['200', '200', '200', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(102, E2:H2, 0)'],
          ['', '', '', '', '100', '101', '102', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns the first matching result', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A2:D2, 0)'],
          ['200', '103', '103', '200'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, B2:E2, 0)'],
          ['103', '200', '200', '200', '200', '103'],
          ['103', '103', '103', '103', '103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    it('uses indexOf', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = spyOn(DependencyGraph.prototype as any, 'computeListOfValuesInRange')
      resetSpy(spy)

      const engine = HyperFormula.buildFromArray([
        ['=MATCH(400, A2:A5, 0)'],
        ['100'],
        ['200'],
        ['300'],
        ['400'],
        ['500'],
      ])

      expect(spy).toHaveBeenCalled()
      expect(engine.getCellValue(adr('A1'))).toEqual(4)
    })

    it('works for strings, is not case sensitive', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("A", A2:A5, 0)'],
        ['a'],
        ['A'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(1)
    })

    it('works for strings, is not case sensitive even if config defines case sensitivity', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("A", A2:A5, 0)'],
        ['a'],
        ['A'],
      ], { caseSensitive: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(1)
    })

    it('works with dates', () => {
      const engine = HyperFormula.buildFromArray(
        [
          ['01/04/2012', '01/01/2012', '=MATCH(B1, A1:A4, 0)'],
          ['01/01/2012', '01/02/2012', '=MATCH(B2, A1:A4, 0)'],
          ['01/02/2012'],
          ['01/03/2012'],
        ]
      )
      expect(engine.getCellValue(adr('C1'))).toEqual(2)
      expect(engine.getCellValue(adr('C2'))).toEqual(3)
    })
  })

  describe('when MatchType = 1', () => {
    describe('when search range is vertical', () => {
      it('returns the lower bound if the range is sorted ascending', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A2:A5, 1)'],
          ['100'],
          ['110'],
          ['120'],
          ['130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the exact match if present in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(120, A2:A5, 1)'],
          ['100'],
          ['110'],
          ['120'],
          ['130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns the last match if there are duplicates in the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(110, A2:A5, 1)'],
          ['110'],
          ['110'],
          ['110'],
          ['110'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the last value if all are smaller than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1000, A2:A5, 1)'],
          ['100'],
          ['110'],
          ['120'],
          ['130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns an error if all are greater than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A2:A5, 1)'],
          ['200'],
          ['210'],
          ['220'],
          ['230'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A6:A9, 1)'],
          [''],
          [''],
          [''],
          [''],
          ['100'],
          ['110'],
          ['120'],
          ['130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A3:A6, 1)'],
          ['103', '103'],
          ['200', '103'],
          ['200', '103'],
          ['200', '103'],
          ['200', '103'],
          ['103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    describe('when search range is horizontal', () => {
      it('returns the lower bound if the range is sorted ascending', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A2:D2, 1)'],
          ['100', '110', '120', '130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the exact match if present in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(120, A2:D2, 1)'],
          ['100', '110', '120', '130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
      })

      it('returns the last match if there are duplicates in the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(110, A2:D2, 1)'],
          ['110', '110', '110', '110'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the last value if all are smaller than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1000, A2:D2, 1)'],
          ['100', '110', '120', '130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns an error if all are greater than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1, A2:D2, 1)'],
          ['100', '110', '120', '130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(112, E2:H2, 1)'],
          ['', '', '', '', '100', '110', '120', '130'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, B2:E2, 1)'],
          ['103', '200', '200', '200', '200', '103'],
          ['103', '103', '103', '103', '103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    it('works for strings, is not case sensitive', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("C", A2:A5, 1)'],
        ['a'],
        ['b'],
        ['d'],
        ['e'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('works for strings, is not case sensitive even if config defines case sensitivity', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("C", A2:A5, 1)'],
        ['a'],
        ['b'],
        ['d'],
        ['e'],
      ], { caseSensitive: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('works with dates', () => {
      const engine = HyperFormula.buildFromArray(
        [
          ['01/01/2012', '01/02/2012', '=MATCH(B1, A1:A4, 1)'],
          ['01/02/2012', '10/02/2012', '=MATCH(B2, A1:A4, 1)'],
          ['01/03/2012'],
          ['01/04/2012'],
        ]
      )
      expect(engine.getCellValue(adr('C1'))).toEqual(2)
      expect(engine.getCellValue(adr('C2'))).toEqual(2)
    })

    it('uses binary search', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = spyOn(DependencyGraph.prototype as any, 'computeListOfValuesInRange')
      resetSpy(spy)

      const engine = HyperFormula.buildFromArray([
        ['=MATCH(113, A2:A5, 1)'],
        ['100'],
        ['110'],
        ['120'],
        ['130'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('when MatchType = -1', () => {
    describe('when search range is vertical', () => {
      it('returns the upper bound if the range is sorted descending', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A2:A5, -1)'],
          ['130'],
          ['120'],
          ['110'],
          ['100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the exact match if present in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(120, A2:A5, -1)'],
          ['130'],
          ['120'],
          ['110'],
          ['100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the last match if there are duplicates in the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(110, A2:A5, -1)'],
          ['110'],
          ['110'],
          ['110'],
          ['110'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the last value if all are greater than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1, A2:A5, -1)'],
          ['130'],
          ['120'],
          ['110'],
          ['100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns an error if all are smaller than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1000, A2:A5, -1)'],
          ['130'],
          ['120'],
          ['110'],
          ['100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A6:A9, -1)'],
          [''],
          [''],
          [''],
          [''],
          ['130'],
          ['120'],
          ['110'],
          ['100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, A3:A6, -1)'],
          ['103', '103'],
          ['100', '103'],
          ['100', '103'],
          ['100', '103'],
          ['100', '103'],
          ['103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    describe('when search range is horizontal', () => {
      it('returns the lower bound if the range is sorted ascending', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(113, A2:D2, -1)'],
          ['130', '120', '110', '100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the exact match if present in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(120, A2:D2, -1)'],
          ['130', '120', '110', '100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('returns the last match if there are duplicates in the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(110, A2:D2, -1)'],
          ['110', '110', '110', '110'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns the last value if all are greater than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1, A2:D2, -1)'],
          ['130', '120', '110', '100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(4)
      })

      it('returns an error if all are smaller than the search value', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(1000, A2:D2, -1)'],
          ['130', '120', '110', '100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })

      it('returns the relative position in the range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(112, E2:H2, -1)'],
          ['', '', '', '', '130', '120', '110', '100'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(2)
      })

      it('doesn\'t return result from outside the search range', () => {
        const engine = HyperFormula.buildFromArray([
          ['=MATCH(103, B2:E2, -1)'],
          ['103', '100', '100', '100', '100', '103'],
          ['103', '103', '103', '103', '103', '103'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.ValueNotFound))
      })
    })

    it('works for strings, is not case sensitive', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("C", A2:A5, -1)'],
        ['e'],
        ['d'],
        ['b'],
        ['a'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('works for strings, is not case sensitive even if config defines case sensitivity', () => {
      const engine = HyperFormula.buildFromArray([
        ['=MATCH("C", A2:A5, -1)'],
        ['e'],
        ['d'],
        ['b'],
        ['a'],
      ], { caseSensitive: true })

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
    })

    it('works with dates', () => {
      const engine = HyperFormula.buildFromArray(
        [
          ['01/04/2012', '01/02/2012', '=MATCH(B1, A1:A4, -1)'],
          ['01/03/2012', '10/02/2012', '=MATCH(B2, A1:A4, -1)'],
          ['01/02/2012'],
          ['01/01/2012'],
        ]
      )
      expect(engine.getCellValue(adr('C1'))).toEqual(3)
      expect(engine.getCellValue(adr('C2'))).toEqual(2)
    })

    it('uses binary search', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = spyOn(DependencyGraph.prototype as any, 'computeListOfValuesInRange')
      resetSpy(spy)

      const engine = HyperFormula.buildFromArray([
        ['=MATCH(113, A2:A5, -1)'],
        ['130'],
        ['120'],
        ['110'],
        ['100'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqual(2)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  it('should coerce empty arg to 0', () => {
    const engine = HyperFormula.buildFromArray([
      ['-5'],
      ['-2'],
      ['0'],
      ['2'],
      ['5'],
      ['=MATCH(0, A1:A5)'],
      ['=MATCH(, A1:A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(3)
    expect(engine.getCellValue(adr('A7'))).toEqual(3)
  })

  it('should coerce empty arg to zero when useColumnIndex = false', () => {
    const engine = HyperFormula.buildFromArray([
      ['=MATCH(, A2:A4, 0)'],
      [1],
      [3],
      [0],
    ], {useColumnIndex: false})

    expect(engine.getCellValue(adr('A1'))).toEqual(3)
  })

  it('should return NA when range is not a single column or row', () => {
    const engine = HyperFormula.buildFromArray([
      ['0', '1'],
      ['2', '3'],
      ['=MATCH(0, A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.NA))
  })
})
