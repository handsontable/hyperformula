import {CellError, Config} from '../src'
import {ErrorType} from '../src/Cell'
import {SheetMapping} from '../src/DependencyGraph'
import {enGB} from '../src/i18n'
import {checkMatrixSize, MatrixSize} from '../src/Matrix'
import {CellAddress, ParserWithCaching} from '../src/parser'
import './testConfig.ts'
import {adr} from './testUtils'

describe('Matrix size check tests', () => {
  it('check', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check simple wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new CellError(ErrorType.VALUE))
  })

  it('check recurisve', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(2, 3))
  })

  it('check recursive wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new CellError(ErrorType.VALUE))
  })

  it('check maxpool', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=maxpool(A1:I9,3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check transpose with cell reference', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=transpose(A2)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(1, 1))
  })
})
