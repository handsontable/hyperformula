import {Ast} from "../parser/Ast";
import {cellError, CellValue, ErrorType, isCellError, SimpleCellAddress} from "../Cell";
import {Interpreter} from "./Interpreter";
import {IAddressMapping} from "../IAddressMapping";
import {RangeMapping} from "../RangeMapping";
import {Graph} from "../Graph";
import {Vertex} from "../Vertex";

export class TextModule {
  private readonly interpreter: Interpreter
  private readonly addressMapping: IAddressMapping
  private readonly rangeMapping: RangeMapping
  private readonly graph: Graph<Vertex>

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.addressMapping = interpreter.addressMapping
    this.rangeMapping = interpreter.rangeMapping
    this.graph = interpreter.graph
  }

  public evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): CellValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  /**
   * Concatenate values of arguments.
   *
   * @param args
   * @param formulaAddress
   */
  public concatenate(args: Ast[], formulaAddress: SimpleCellAddress): CellValue {
    return args.reduce((acc: CellValue, arg: Ast) => {
      const argResult = this.evaluateAst(arg, formulaAddress)
      if (isCellError(acc)) {
        return acc
      } else if (isCellError(argResult)) {
        return argResult
      } else {
        return (acc as string).concat(argResult.toString())
      }
    }, '')
  }

  public split(args: Ast[], formulaAddress: SimpleCellAddress): CellValue {
    const stringArg = args[0]
    const indexArg = args[1]

    const stringToSplit = this.evaluateAst(stringArg, formulaAddress)
    if (typeof stringToSplit !== 'string') {
      return cellError(ErrorType.VALUE)
    }
    const indexToUse = this.evaluateAst(indexArg, formulaAddress)
    if (typeof indexToUse !== 'number') {
      return cellError(ErrorType.VALUE)
    }

    const splittedString = stringToSplit.split(' ')

    if (indexToUse > splittedString.length || indexToUse < 0) {
      return cellError(ErrorType.VALUE)
    }

    return splittedString[indexToUse]
  }
}