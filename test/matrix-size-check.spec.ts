import {simpleCellAddress} from '../src/Cell'
import {Config} from '../src/Config'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {Interpreter} from '../src/interpreter/Interpreter'
import {MatrixSize, MatrixSizePredictor} from '../src/MatrixSize'
import {buildEmptyParserWithCaching} from './parser/common'
import {adr} from './testUtils'

describe('Matrix size check tests', () => {
  const config = new Config()
  const functionRegistry = new FunctionRegistry(config)
  // eslint-disable-next-line
  // @ts-ignore
  const interpreter = new Interpreter(undefined, undefined, config, undefined, undefined, undefined, functionRegistry, undefined)
  const matrixSizePredictor = new MatrixSizePredictor(config, functionRegistry)
  it('check', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check simple wrong size', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(undefined)
  })

  it('check recursive', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(2, 3))
  })

  it('check recursive wrong size', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(undefined)
  })

  it('check maxpool', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=maxpool(A1:I9,3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(3, 3))
  })

  it('check with noninteger args', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=maxpool(A1:I9,B3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(9, 9))
  })

  it('check transpose with cell reference', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=transpose(A2)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(1, 1))
  })

  it('check scalar', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=1234', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(1, 1))
  })

  it('check cell reference', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(1, 1, true))
  })

  it('check binary array arithmetic #1', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1:D3+A1:C4', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(undefined)
  })

  it('check binary array arithmetic #2', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=ARRAYFORMULA(A1:D3+A1:C4)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(4, 4))
  })

  it('check unary array arithmetic #1', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=-A1:B3', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(undefined)
  })

  it('check unary array arithmetic #2', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=ARRAYFORMULA(-A1:B3)', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(2, 3))
  })
})

describe('Matrix size check tests, with different config', () => {
  const config = new Config({useArrayArithmetic: true})
  const functionRegistry = new FunctionRegistry(config)
  // eslint-disable-next-line
  // @ts-ignore
  const interpreter = new Interpreter(undefined, undefined, config, undefined, undefined, undefined, functionRegistry, undefined)
  const matrixSizePredictor = new MatrixSizePredictor(config, functionRegistry)

  it('check binary array arithmetic', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1:D3+A1:C4', simpleCellAddress(0, 0, 0)).ast

    const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
    expect(size).toEqual(new MatrixSize(4, 4))
  })

    it('check unary array arithmetic', () => {
      const parser = buildEmptyParserWithCaching(config)
      const ast = parser.parse('=-A1:B3', simpleCellAddress(0, 0, 0)).ast

      const size = matrixSizePredictor.checkMatrixSize(ast, adr('A1'))
      expect(size).toEqual(new MatrixSize(2, 3))
    })
})
