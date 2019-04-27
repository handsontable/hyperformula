import {CellAddress, simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {checkMatrixSize, MatrixSize} from '../src/Matrix'
import {EqualsOpAst} from '../src/parser/Ast'
import {ParserWithCaching} from '../src/parser/ParserWithCaching'
import {SheetMapping} from '../src/SheetMapping'
import './testConfig.ts'

describe('Matrix size check tests', () => {
  it('check', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, simpleCellAddress(0, 0, 0)) as MatrixSize
    expect(width).toBe(3)
    expect(height).toBe(3)
  })

  it('check simple wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, simpleCellAddress(0, 0, 0))
    expect(size).toBe(false)
  })

  it('check recurisve', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, simpleCellAddress(0, 0, 0)) as MatrixSize
    expect(width).toBe(2)
    expect(height).toBe(3)
  })

  it('check recurisve wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, simpleCellAddress(0, 0, 0))
    expect(size).toBe(false)
  })

  it('check maxpool', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping())
    const ast = parser.parse('=maxpool(A1:I9,3)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, simpleCellAddress(0, 0, 0)) as MatrixSize
    expect(width).toBe(3)
    expect(height).toBe(3)
  })
})
