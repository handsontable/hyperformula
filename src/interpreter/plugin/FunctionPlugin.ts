import {Interpreter} from "../Interpreter";
import {IAddressMapping} from "../../IAddressMapping";
import {RangeMapping} from "../../RangeMapping";
import {Graph} from "../../Graph";
import {Vertex} from "../../Vertex";
import {Ast, ProcedureAst} from "../../parser/Ast";
import {CellValue, SimpleCellAddress} from "../../Cell";
import {Config} from "../../Config";

interface IImplementedFunctions {
  [functionName: string]: {
    [language: string]: string,
  }
}

export type PluginFunctionType = (ast: ProcedureAst, formulaAddress: SimpleCellAddress) => CellValue

export abstract class FunctionPlugin {
  protected readonly interpreter: Interpreter
  protected readonly addressMapping: IAddressMapping
  protected readonly rangeMapping: RangeMapping
  protected readonly graph: Graph<Vertex>
  protected readonly config: Config

  public static implementedFunctions: IImplementedFunctions

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