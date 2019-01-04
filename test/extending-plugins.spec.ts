import {Config} from '../src/Config'
import {Interpreter} from '../src/interpreter/Interpreter'
import {IAddressMapping} from '../src/IAddressMapping'
import {RangeMapping} from '../src/RangeMapping'
import {Graph} from '../src/Graph'
import {Vertex} from '../src/Vertex'
import {HandsOnEngine} from '../src'
import {CellValue, SimpleCellAddress} from '../src/Cell'
import {Ast, ProcedureAst} from '../src/parser/Ast'

class FooPlugin {
  private readonly interpreter: Interpreter
  private readonly addressMapping: IAddressMapping
  private readonly rangeMapping: RangeMapping
  private readonly graph: Graph<Vertex>

  public static implementedFunctions = {
    'foo': {
      'EN': 'foo',
      'PL': 'fu',
    }
  }

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.addressMapping = interpreter.addressMapping
    this.rangeMapping = interpreter.rangeMapping
    this.graph = interpreter.graph
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  public foo(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return 42
  }
}

describe('Plugins', () => {
  it('Extending with a plugin', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=foo()'],
    ], new Config({functionPlugins: [FooPlugin]}))

    expect(engine.getCellValue('A1')).toBe(42)
  })

  it('using translation', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['=fu()'],
    ], new Config({functionPlugins: [FooPlugin], language: 'PL'}))

    expect(engine.getCellValue('A1')).toBe(42)
  })
})
