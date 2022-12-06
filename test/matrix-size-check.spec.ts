import {ArraySize, ArraySizePredictor} from '../src/ArraySize'
import {Config} from '../src/Config'
import {FunctionRegistry} from '../src/interpreter/FunctionRegistry'
import {Interpreter} from '../src/interpreter/Interpreter'
import {buildEmptyParserWithCaching} from './parser/common'
import {adr} from './testUtils'
import {DependencyGraph} from '../src/DependencyGraph'
import {ColumnSearchStrategy} from '../src/Lookup/SearchStrategy'
import {Statistics} from '../src/statistics'
import {ArithmeticHelper} from '../src/interpreter/ArithmeticHelper'
import {NamedExpressions} from '../src/NamedExpressions'
import {Serialization} from '../src/Serialization'
import {DateTimeHelper} from '../src/DateTimeHelper'

describe('Matrix size check tests', () => {
  const config = new Config()
  const functionRegistry = new FunctionRegistry(config)
  const arraySizePredictor = new ArraySizePredictor(config, functionRegistry)

  new Interpreter(
    config,
    undefined as unknown as DependencyGraph,
    undefined as unknown as ColumnSearchStrategy,
    undefined as unknown as Statistics,
    undefined as unknown as ArithmeticHelper,
    functionRegistry,
    undefined as unknown as NamedExpressions,
    undefined as unknown as Serialization,
    arraySizePredictor,
    undefined as unknown as DateTimeHelper
  )

  it('check', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(A1:B3,C1:E2)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(3, 3))
  })

  it('even for wrong size, we need to estimate', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(A1:B3,C1:E3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(3, 3))
  })

  it('check recursive', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E2), A1:B3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(2, 3))
  })

  it('wrong size estimation', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=mmult(mmult(A1:B3,C1:E3), A1:B3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(2, 3))
  })

  it('check maxpool', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=maxpool(A1:I9,3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(3, 3))
  })

  it('check with noninteger args', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=maxpool(A1:I9,B3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(9, 9))
  })

  it('check transpose with cell reference', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=transpose(A2)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(1, 1))
  })

  it('check scalar', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=1234', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(1, 1, false))
  })

  it('check cell reference', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(1, 1, true))
  })

  it('check binary array arithmetic #1', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1:D3+A1:C4', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(ArraySize.error())
  })

  it('check binary array arithmetic #2', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=ARRAYFORMULA(A1:D3+A1:C4)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(4, 4))
  })

  it('check unary array arithmetic #1', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=-A1:B3', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(ArraySize.error())
  })

  it('check unary array arithmetic #2', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=ARRAYFORMULA(-A1:B3)', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(2, 3))
  })

  it('check matrix parsing #1', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('={1,2,3;4,5,6}', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(3, 2))
  })

  it('check matrix parsing #2', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('={{1;2},{3;4}}', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(2, 2))
  })

  it('check matrix parsing #3', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('={1,{2,3},4;{5;6},{7,8;9,10},{11;12};13,{14,15},16}', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(4, 4))
  })
})

describe('Matrix size check tests, with different config', () => {
  const config = new Config({useArrayArithmetic: true})
  const functionRegistry = new FunctionRegistry(config)
  const arraySizePredictor = new ArraySizePredictor(config, functionRegistry)

  new Interpreter(
    config,
    undefined as unknown as DependencyGraph,
    undefined as unknown as ColumnSearchStrategy,
    undefined as unknown as Statistics,
    undefined as unknown as ArithmeticHelper,
    functionRegistry,
    undefined as unknown as NamedExpressions,
    undefined as unknown as Serialization,
    arraySizePredictor,
    undefined as unknown as DateTimeHelper
  )

  it('check binary array arithmetic', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=A1:D3+A1:C4', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(4, 4))
  })

  it('check unary array arithmetic', () => {
    const parser = buildEmptyParserWithCaching(config)
    const ast = parser.parse('=-A1:B3', adr('A1')).ast

    const size = arraySizePredictor.checkArraySize(ast, adr('A1'))
    expect(size).toEqual(new ArraySize(2, 3))
  })
})
