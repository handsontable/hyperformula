import {simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {SheetMapping} from '../src/DependencyGraph'
import {checkMatrixSize, Size} from '../src/Matrix'
import {ParserWithCaching} from '../src/parser'
import {CellAddress} from '../src/parser/CellAddress'
import './testConfig.ts'
import {adr} from "./testUtils";

describe('Matrix size check tests', () => {
  it('check', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, adr('A1')) as Size
    expect(width).toBe(3)
    expect(height).toBe(3)
  })

  it('check simple wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toBe(false)
  })

  it('check recurisve', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, adr('A1')) as Size
    expect(width).toBe(2)
    expect(height).toBe(3)
  })

  it('check recurisve wrong size', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', CellAddress.absolute(0, 0, 0)).ast

    const size = checkMatrixSize(ast, adr('A1'))
    expect(size).toBe(false)
  })

  it('check maxpool', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping().fetch)
    const ast = parser.parse('=maxpool(A1:I9,3)', CellAddress.absolute(0, 0, 0)).ast

    const {width, height} = checkMatrixSize(ast, adr('A1')) as Size
    expect(width).toBe(3)
    expect(height).toBe(3)
  })
})
