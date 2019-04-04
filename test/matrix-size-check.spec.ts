import {Config} from '../src/Config'
import './testConfig.ts'
import {ParserWithCaching} from "../src/parser/ParserWithCaching";
import {absoluteCellAddress, simpleCellAddress} from "../src/Cell";
import {EqualsOpAst} from "../src/parser/Ast";
import {checkMatrixSize, MatrixSize} from "../src/Matrix";

describe('Matrix size check tests', () => {
  it('check', () => {
    const parser = new ParserWithCaching(new Config())
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', absoluteCellAddress(0, 0)).ast

    const {width, height} = checkMatrixSize(ast, simpleCellAddress(0, 0)) as MatrixSize
    expect(width).toBe(3)
    expect(height).toBe(3)
  })

  it('check simple wrong size', () => {
    const parser = new ParserWithCaching(new Config())
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', absoluteCellAddress(0, 0)).ast

    const size = checkMatrixSize(ast, simpleCellAddress(0, 0))
    expect(size).toBe(false)
  })

  it('check recurisve', () => {
    const parser = new ParserWithCaching(new Config())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', absoluteCellAddress(0, 0)).ast

    const {width, height} = checkMatrixSize(ast, simpleCellAddress(0, 0)) as MatrixSize
    expect(width).toBe(2)
    expect(height).toBe(3)
  })

  it('check recurisve wrong size', () => {
    const parser = new ParserWithCaching(new Config())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', absoluteCellAddress(0, 0)).ast

    const size = checkMatrixSize(ast, simpleCellAddress(0, 0))
    expect(size).toBe(false)
  })
})
