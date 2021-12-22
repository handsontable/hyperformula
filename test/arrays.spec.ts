import {ErrorType, HyperFormula} from '../src'
import {ArraySize} from '../src/ArraySize'
import {ArrayVertex, ValueCellVertex} from '../src/DependencyGraph'
import {ErrorMessage} from '../src/error-message'
import {adr, detailedError, detailedErrorWithOrigin, expectVerticesOfTypes, noSpace} from './testUtils'

describe('without arrayformula, with useArrayArithmetic flag', () => {
  it('unary op, scalar ret', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=SUM(-A1:C1)']], {useArrayArithmetic: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('unary op, array ret', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=-A1:C1']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [-1, -2, -3]])
  })

  it('binary op, scalar ret', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=SUM(2*A1:C1+A2:C2)']], {useArrayArithmetic: true})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('binary op, array ret', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=2*A1:C1+A2:C2']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [4, 5, 6], [6, 9, 12]])
  })

  it('binary op, array ret, concat', () => {
    const [engine] = HyperFormula.buildFromArray([['a', 'b', 'c'], ['d', 'e', 'f'], ['=A1:C1&A2:C2']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([['a', 'b', 'c'], ['d', 'e', 'f'], ['ad', 'be', 'cf']])
  })

  it('index', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=INDEX(2*A1:C1+3,1,1)']], {useArrayArithmetic: true})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('binary op + index', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=INDEX(A1:C2+A1:B3,1,1)', '=INDEX(A1:C2+A1:B3,1,2)', '=INDEX(A1:C2+A1:B3,1,3)'],
      ['=INDEX(A1:C2+A1:B3,2,1)', '=INDEX(A1:C2+A1:B3,2,2)', '=INDEX(A1:C2+A1:B3,2,3)'],
      ['=INDEX(A1:C2+A1:B3,3,1)', '=INDEX(A1:C2+A1:B3,3,2)', '=INDEX(A1:C2+A1:B3,3,3)'],
    ], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 4, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C4')],
        [8, 10, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C5')],
        [detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!B6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C6')]])
  })

  it('match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(10,2*A2:E2)'],
      [1, 2, 3, 4, 5],
    ], {useArrayArithmetic: true})
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
})

describe('without arrayformula, without useArrayArithmetic flag', () => {
  it('unary op', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [undefined, undefined, undefined, '=SUM(-A1:C1)']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('D2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('binary op', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], [undefined, undefined, undefined, '=SUM(2*A1:C1+A2:C2)']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('D3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('index', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [undefined, undefined, undefined, '=INDEX(2*A1:C1+3,1,1)']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('D2'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('binary op + index', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=INDEX(A1:C2+A1:B3,1,1)', '=INDEX(A1:C2+A1:B3,1,2)', '=INDEX(A1:C2+A1:B3,1,3)'],
      ['=INDEX(A1:C2+A1:B3,2,1)', '=INDEX(A1:C2+A1:B3,2,2)', '=INDEX(A1:C2+A1:B3,2,3)'],
      ['=INDEX(A1:C2+A1:B3,3,1)', '=INDEX(A1:C2+A1:B3,3,2)', '=INDEX(A1:C2+A1:B3,3,3)'],
    ], {useArrayArithmetic: false})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A4', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B4', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C4', ErrorMessage.ScalarExpected)],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A5', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B5', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C5', ErrorMessage.ScalarExpected)],
        [detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!A6', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!B6', ErrorMessage.ScalarExpected), detailedErrorWithOrigin(ErrorType.VALUE, 'Sheet1!C6', ErrorMessage.ScalarExpected)]
      ])
  })

  it('match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=MATCH(10,2*B1:F1)', 1, 2, 3, 4, 5],
    ], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })
})

describe('with arrayformula, without useArrayArithmetic flag', () => {
  it('unary op', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=ARRAYFORMULA(SUM(-A1:C1))']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('unary op #2', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=SUM(ARRAYFORMULA(-A1:C1))']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(-6)
  })

  it('binary op', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=ARRAYFORMULA(SUM(2*A1:C1+A2:C2))']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('binary op #2', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], [4, 5, 6], ['=SUM(ARRAYFORMULA(2*A1:C1+A2:C2))']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A3'))).toEqual(27)
  })

  it('index', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=ARRAYFORMULA(INDEX(2*A1:C1+3,1,1))']], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A2'))).toEqual(5)
  })

  it('binary op + index', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,1,3))'],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,2,3))'],
      ['=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,1))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,2))', '=ARRAYFORMULA(INDEX(A1:C2+A1:B3,3,3))'],
    ], {useArrayArithmetic: false})
    expect(engine.getSheetValues(0)).toEqual(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [2, 4, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C4')],
        [8, 10, detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C5')],
        [detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!A6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!B6'), detailedErrorWithOrigin(ErrorType.NA, 'Sheet1!C6')]])
  })

  it('match', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=ARRAYFORMULA(MATCH(10,2*A2:E2))'],
      [1, 2, 3, 4, 5],
    ], {useArrayArithmetic: false})
    expect(engine.getCellValue(adr('A1'))).toEqual(5)
  })
})

describe('coercion of array to scalar', () => {
  it('actual range', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 2, 3, '=SIN(A1:C1)']])
    expect(engine.getCellValue(adr('D1'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.WrongType))
  })

  it('ad-hoc array + function #1', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 2, 3], ['=SIN(ARRAYFORMULA(2*A1:C1))']])
    expect(engine.getCellValue(adr('A2'))).toEqual(0)
  })

  it('ad-hoc array + function #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=SIN({0,2,3})']])
    expect(engine.getCellValue(adr('A1'))).toEqual(0)
  })

  it('ad-hoc array + binary op #1', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=ARRAYFORMULA(2*A1:C1)+ARRAYFORMULA(2*A1:C1)']])
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [4]])
  })

  it('ad-hoc array + binary op #2', () => {
    const [engine] = HyperFormula.buildFromArray([['={1,2,3}+{1,2,3}']])
    expect(engine.getSheetValues(0)).toEqual([[2]])
  })

  it('ad-hoc array + unary op #1', () => {
    const [engine] = HyperFormula.buildFromArray([[1, 2, 3], ['=-ARRAYFORMULA(2*A1:C1)']])
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3], [-2]])
  })

  it('ad-hoc array + unary op #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=-{1,2,3}']])
    expect(engine.getSheetValues(0)).toEqual([[-1]])
  })
})

describe('range interpolation', () => {
  it('with function', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 1, 2], ['=EXP(A1:C1)']])
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
  })

  it('with binary op', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 1, 2], [undefined, '=A1:C1+A1:C1']])
    expect(engine.getCellValue(adr('B2'))).toEqual(2)
  })

  it('with unary op', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 1, 2], [undefined, '=-A1:C1']])
    expect(engine.getCellValue(adr('B2'))).toEqual(-1)
  })

  it('columns', () => {
    const [engine] = HyperFormula.buildFromArray([[0], [1, '=-A1:A3'], [2]])
    expect(engine.getCellValue(adr('B2'))).toEqual(-1)
  })

  it('too many rows', () => {
    const [engine] = HyperFormula.buildFromArray([[0, 1, 2], [4, 5, 6], [undefined, '=-A1:C2']])
    expect(engine.getCellValue(adr('B3'))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })

  it('different sheets', () => {
    const [engine] = HyperFormula.buildFromSheets({Sheet1: [[0, 1, 2]], Sheet2: [['=-Sheet1!A1:C1']]})
    expect(engine.getCellValue(adr('A1', 1))).toEqualError(detailedError(ErrorType.VALUE, ErrorMessage.ScalarExpected))
  })
})

describe('array parsing', () => {
  it('simple array', () => {
    const [engine] = HyperFormula.buildFromArray([['={1,2;3,4}']])
    expect(engine.getSheetValues(0)).toEqual([[1, 2], [3, 4]])
  })

  it('nested arrays', () => {
    const [engine] = HyperFormula.buildFromArray([['={1,{2,3},4;{5;6},{7,8;9,10},{11;12};13,{14,15},16}']])
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3, 4], [5, 7, 8, 11], [6, 9, 10, 12], [13, 14, 15, 16]])
  })

  it('size mismatch', () => {
    const [engine] = HyperFormula.buildFromArray([['={1,2;3}']])
    expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.REF, ErrorMessage.SizeMismatch))
  })

  it('nested with ops', () => {
    const [engine] = HyperFormula.buildFromArray([['=ARRAYFORMULA({1,{2,3}+{0,0},4;{5;6},2*{7,8;9,10},-{11;12};13,{14,15},16})']])
    expect(engine.getSheetValues(0)).toEqual([[1, 2, 3, 4], [5, 14, 16, -11], [6, 18, 20, -12], [13, 14, 15, 16]])
  })
})

describe('vectorization', () => {
  it('1 arg function row', () => {
    const [engine] = HyperFormula.buildFromArray([['=ABS({-2,-1,1,2})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[2, 1, 1, 2]])
  })

  it('1 arg function column', () => {
    const [engine] = HyperFormula.buildFromArray([['=ABS({2;-2})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[2], [2]])
  })

  it('1 arg function square', () => {
    const [engine] = HyperFormula.buildFromArray([['=ABS({1,2;-1,-2})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2], [1, 2]])
  })

  it('1 arg function no flag - should cast to scalar', () => {
    const [engine] = HyperFormula.buildFromArray([['=ABS({-2,-1,1,2})']], {useArrayArithmetic: false})
    expect(engine.getSheetValues(0)).toEqual([[2]])
  })

  it('multi arg function', () => {
    const [engine] = HyperFormula.buildFromArray([['=DATE({1,2},1,1)']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[367, 732]])
  })

  it('multi arg function #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=DATE({1,2},{1,2},{1,2})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[367, 764]])
  })

  it('multi arg function #3', () => {
    const [engine] = HyperFormula.buildFromArray([['=DATE({1,2},{1;2},{1})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[367, 732], [398, 763]])
  })

  it('multi arg function #4', () => {
    const [engine] = HyperFormula.buildFromArray([['=DATE({1,2},{1,2,3},{1})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[367, 763, detailedError(ErrorType.VALUE, ErrorMessage.InvalidDate)]])
  })

  it('mixed types', () => {
    const [engine] = HyperFormula.buildFromArray([['=ZTEST({1,2,1},{2;3})']], {useArrayArithmetic: true})
    const val = engine.getSheetValues(0)
    expect(val.length).toEqual(2)
    expect(val[0].length).toEqual(1)
    expect(val[1].length).toEqual(1)
  })

  it('no vectorization here #1', () => {
    const [engine] = HyperFormula.buildFromArray([['=SUM({1,2,1},{2;3})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[9]])
  })

  it('no vectorization here #2', () => {
    const [engine] = HyperFormula.buildFromArray([['=AND({TRUE(),FALSE()},{TRUE();FALSE()})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[false]])
  })

  it('vectorize with defaults', () => {
    const [engine] = HyperFormula.buildFromArray([['=IF({TRUE(),FALSE()},{1;2;3}, {2;3})']], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[1, 2], [2, 3], [3, false]])
  })

  it('should work with switch', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=SWITCH({1,2,3},1,2,3,4,5)']
    ], {useArrayArithmetic: true})
    expect(engine.getSheetValues(0)).toEqual([[2, 5, 4]])
  })
})

describe('build from array', () => {
  it('should create engine with array', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 2, '=-A1:B2'],
      [3, 4],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [1, 2, -1, -2],
      [3, 4, -3, -4],
    ])
  })

  it('should be enough to specify only corner of an array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)'],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex],
      [ArrayVertex, ArrayVertex],
    ])
  })

  it('should be separate arrays', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)'],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex, undefined],
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [undefined, ArrayVertex, ArrayVertex],
    ])
    expect(engine.arrayMapping.arrayMapping.size).toEqual(4)
    expect(engine.getSheetValues(0))
  })

  it('should REF last array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E2)', '=TRANSPOSE(D1:E2)', null, 1, 2],
      ['=TRANSPOSE(D1:E2)', null, null, 1, 2],
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [ArrayVertex, ArrayVertex, ArrayVertex],
      [undefined, undefined],
    ])
    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 1, 1, 1, 2],
      [noSpace(), 2, 2, 1, 2],
    ])
    expect(engine.arrayMapping.arrayMapping.size).toEqual(3)
    expect(engine.getSheetValues(0))
  })

  it('array should work with different types of data', () => {
    const [engine] = HyperFormula.buildFromArray([
      [1, 'foo', '=TRANSPOSE(A1:B2)'],
      [true, '=SUM(A1)'],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [1, 'foo', 1, true],
      [true, 1, 'foo', 1],
    ])
  })

  it('should make REF array if no space', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C1:D2', 2],
      [3, 4],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([
      [noSpace(), 2],
      [3, 4],
    ])
  })

  it('should not shrink array if empty vertex', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [null, null]
    ], {useArrayArithmetic: true})

    expectVerticesOfTypes(engine, [
      [ArrayVertex, ArrayVertex],
      [ArrayVertex, ArrayVertex],
    ])

  })

  it('should shrink to one vertex if there is more content colliding with array', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [1, null]
    ], {useArrayArithmetic: true})

    expect(engine.arrayMapping.getArrayByCorner(adr('A1'))?.array.size).toEqual(ArraySize.error())
    expectVerticesOfTypes(engine, [
      [ArrayVertex, undefined],
      [ValueCellVertex, undefined],
    ])
  })

  it('DependencyGraph changes should be empty after building fresh engine', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=-C1:D2', null],
      [1, null]
    ], {useArrayArithmetic: true})

    expect(engine.dependencyGraph.getAndClearContentChanges().isEmpty()).toEqual(true)
  })
})

describe('column ranges', () => {
  it('arithmetic should work for column range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=2*(B:B)', 1],
      [null, 2],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([[2, 1], [4, 2]])
  })

  it('arithmetic should work for row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=2*(2:2)', null],
      [1, 2],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([[2, 4], [1, 2]])
  })

  it('arithmetic for shifted column range -- error', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, 1],
      ['=2*(B:B)', 2],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('A2'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
  })

  it('arithmetic should work for row range', () => {
    const [engine] = HyperFormula.buildFromArray([
      ['=2*(2:2)', null],
      [1, 2],
    ], {useArrayArithmetic: true})

    expect(engine.getSheetValues(0)).toEqual([[2, 4], [1, 2]])
  })

  it('arithmetic for shifted row range -- error', () => {
    const [engine] = HyperFormula.buildFromArray([
      [null, '=2*(2:2)'],
      [1, 2],
    ], {useArrayArithmetic: true})

    expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.SPILL, ErrorMessage.NoSpaceForArrayResult))
  })

  it('sumproduct test', () => {
    const [engine] = HyperFormula.buildFromArray([
        [1, 1, 3, '=SUMPRODUCT((A:A=1)*(B:B=1), C:C)'],
        [1, 2, 3],
        [3, 1, 3],
      ], {useArrayArithmetic: true}
    )

    expect(engine.getCellValue(adr('D1'))).toEqual(3)
  })

})
