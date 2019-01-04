import {CellValue, SimpleCellAddress} from '../../Cell'
import {Config} from '../../Config'
import {Graph} from '../../Graph'
import {IAddressMapping} from '../../IAddressMapping'
import {Ast, ProcedureAst} from '../../parser/Ast'
import {RangeMapping} from '../../RangeMapping'
import {Vertex} from '../../Vertex'
import {Interpreter} from '../Interpreter'

interface IImplementedFunctions {
  [functionName: string]: {
    [language: string]: string,
  }
}

export type PluginFunctionType = (ast: ProcedureAst, formulaAddress: SimpleCellAddress) => CellValue

export abstract class FunctionPlugin {

  public static implementedFunctions: IImplementedFunctions
  protected readonly interpreter: Interpreter
  protected readonly addressMapping: IAddressMapping
  protected readonly rangeMapping: RangeMapping
  protected readonly graph: Graph<Vertex>
  protected readonly config: Config

  protected constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.addressMapping = interpreter.addressMapping
    this.rangeMapping = interpreter.rangeMapping
    this.graph = interpreter.graph
    this.config = interpreter.config
  }

  protected evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }
}
