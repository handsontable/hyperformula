import {ErrorType, HyperFormula} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('SUM', () => {
  it('SUM without args', () => {
    const engine = HyperFormula.buildFromArray([['=SUM()']])

    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
  })

  it('SUM with args', () => {
    const engine = HyperFormula.buildFromArray([['=SUM(1, B1)', '3.14']])

    expect(engine.getCellValue(adr('A1'))).toBeCloseTo(4.14)
  })

  it('SUM with range args', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '5'],
      ['3', '4', '=SUM(A1:B2)']
    ])
    expect(engine.getCellValue(adr('C2'))).toEqual(10)
  })

  it('SUM with column range args', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2', '5'],
      ['3', '4', '=SUM(A:B)']
    ])
    expect(engine.getCellValue(adr('C2'))).toEqual(10)
  })

  it('SUM with using previously cached value', () => {
    const engine = HyperFormula.buildFromArray([
      ['3', '=SUM(A1:A1)'],
      ['4', '=SUM(A1:A2)'],
    ])
    expect(engine.getCellValue(adr('B2'))).toEqual(7)
  })

  it('doesnt do coercions', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['foo'],
      ['=TRUE()'],
      ['=CONCATENATE("1","0")'],
      ['=SUM(A1:A5)'],
      ['=SUM(A3)'],
      ['=SUM(A4)'],
      ['=SUM(A5)'],
    ])

    expect(engine.getCellValue(adr('A6'))).toEqual(3)
    expect(engine.getCellValue(adr('A7'))).toEqual(0)
    expect(engine.getCellValue(adr('A8'))).toEqual(0)
    expect(engine.getCellValue(adr('A9'))).toEqual(0)
  })

  it('works when precision (default setting)', () => {
    const engine = HyperFormula.buildFromArray([
      ['1.00000000000005', '-1'],
      ['=SUM(A1:B1)']
    ])

    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('explicitly called does coercions', () => {
    const engine = HyperFormula.buildFromArray([
      ['=SUM(2,TRUE())'],
      ['=SUM(2,"foo",TRUE())'],
      ['=SUM(TRUE())'],
      ['=SUM("10")']
    ])
    expect(engine.getCellValue(adr('A1'))).toEqual(3)
    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.NumberCoercion))
    expect(engine.getCellValue(adr('A3'))).toEqual(1)
    expect(engine.getCellValue(adr('A4'))).toEqual(10)
  })

  it('doesnt take value from range if it does not store cached value for that function', () => {
    const engine = HyperFormula.buildFromArray([
      ['1'],
      ['2'],
      ['=MAX(A1:A2)'],
      ['=SUM(A1:A3)'],
    ])
    expect(engine.getCellValue(adr('A4'))).toEqual(5)
  })

  it('range only with empty value', () => {
    const engine = HyperFormula.buildFromArray([['', '=SUM(A1:A1)']])
    expect(engine.getCellValue(adr('B1'))).toEqual(0)
  })

  it('range only with some empty values', () => {
    const engine = HyperFormula.buildFromArray([['42', '', '13', '=SUM(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqual(55)
  })

  it('over a range value', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['=SUM(MMULT(A1:B2, A1:B2))'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqual(54)
  })

  it('propagates errors', () => {
    const engine = HyperFormula.buildFromArray([
      ['1', '=4/0'],
      ['=FOOBAR()', '4'],
      ['=SUM(A1:B2)'],
    ])

    expect(engine.getCellValue(adr('A3'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
  })

  describe('works with reversed ranges', () => {
    it('simple case', () => {
      const engine = HyperFormula.buildFromArray([
        ['1', '2'],
        ['3', '4'],
        ['=SUM(A1:B2)'],
        ['=SUM(A2:B1)'],
        ['=SUM(B1:A2)'],
        ['=SUM(B2:A1)'],
      ])

      expect(engine.getCellValue(adr('A3'))).toEqual(10)
      expect(engine.getCellValue(adr('A4'))).toEqual(10)
      expect(engine.getCellValue(adr('A5'))).toEqual(10)
      expect(engine.getCellValue(adr('A6'))).toEqual(10)
    })

    describe('that has the same R1C1 representation (may cause cache clash)', () => {
      it('relative addressing', () => {
        const engine = HyperFormula.buildFromArray([
          ['=SUM(B2:B1)', 1], // R[1]C[1]:R[0]C[1]
          ['=SUM(B3:B2)', 2], // R[1]C[1]:R[0]C[1]
          ['', 3],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
        expect(engine.getCellValue(adr('A2'))).toEqual(5)
      })

      it('1st row absolute', () => {
        const engine = HyperFormula.buildFromArray([
          ['=SUM(B2:B1)', 1], // R[1]C[1]:R[0]C[1]
          ['=SUM(B$2:B2)', 2], // R1C[1]:R[0]C[1]
          ['', 3],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
        expect(engine.getCellValue(adr('A2'))).toEqual(2)
      })

      it('2nd row absolute', () => {
        const engine = HyperFormula.buildFromArray([
          ['=SUM(B2:B1)', 1], // R[1]C[1]:R[0]C[1]
          ['=SUM(B3:B$1)', 2], // R[1]C[1]:R0C[1]
          ['', 3],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(3)
        expect(engine.getCellValue(adr('A2'))).toEqual(6)
      })

      it('both rows absolute', () => {
        const engine = HyperFormula.buildFromArray([
          ['', 0],
          ['=SUM(B3:B2)', 1], // R[1]C[1]:R[0]C[1]
          ['=SUM(B$2:B$1)', 2], // R1C[1]:R0C[1]
          ['', 3],
        ])

        expect(engine.getCellValue(adr('A2'))).toEqual(3)
        expect(engine.getCellValue(adr('A3'))).toEqual(1)
      })
    })

  it('when one of the ranges is a single value', () => {
    const engine = HyperFormula.buildFromArray([
      [1, '=SUM(A1:A$1)'],
      [2, '=SUM(A2:A$1)'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(3)
  })
})
})

