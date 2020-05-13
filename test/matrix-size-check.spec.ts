import {CellError} from '../src'
import {ErrorType, simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {SheetMapping} from '../src/DependencyGraph'
import {buildTranslationPackage, enGB} from '../src/i18n'
import {checkMatrixSize, MatrixSize} from '../src/Matrix'
import {ParserWithCaching} from '../src/parser'
import {adr} from './testUtils'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {buildEmptyParserWithCaching} from './parser/common'


describe('Matrix size check tests', () => {

  it('check', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check simple wrong size', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new CellError(ErrorType.VALUE))
  })

  it('check recurisve', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(2, 3))
  })

  it('check recursive wrong size', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new CellError(ErrorType.VALUE))
  })

  it('check maxpool', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=maxpool(A1:I9,3)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check transpose with cell reference', () => {
    const parser = buildEmptyParserWithCaching(new Config())
    const ast = parser.parse('=transpose(A2)', simpleCellAddress(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(1, 1))
  })
})
