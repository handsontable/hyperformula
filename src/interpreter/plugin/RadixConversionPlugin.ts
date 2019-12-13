import {FunctionPlugin} from "./FunctionPlugin";
import {ProcedureAst} from "../../parser";
import {CellError, CellValue, ErrorType, SimpleCellAddress} from "../../Cell";
import {coerceScalarToNumber} from "../coerce";
import {SimpleRangeValue} from "../InterpreterValue";
import {padLeft} from "../../format/format";

export class RadixConversionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    dec2bin: {
      translationKey: 'DEC2BIN',
    },
  }

  public dec2bin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    let places
    if (ast.args.length === 2) {
      places = this.getNumericArgument(ast, formulaAddress, 1, 1, 10)
      if (places instanceof CellError) {
        return places
      }
    }

    const value = this.getNumericArgument(ast, formulaAddress, 0, -512, 511)
    if (value instanceof CellError) {
      return value
    }

    let length = 10
    let result  = ""
    while (length--) {
      result += (value >> length) & 1
    }

    result = result.replace(/^0+/, "")

    if (places !== undefined) {
      if (value > 0 && result.length > places) {
        return new CellError(ErrorType.NUM)
      } else {
        return padLeft(result, places)
      }
    } else {
      return result
    }
  }

  private getNumericArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, position: number, min: number, max: number): number | CellError  {
    const arg = this.evaluateAst(ast.args[position], formulaAddress)

    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const value = coerceScalarToNumber(arg)
    if (typeof value === 'number') {
      if (value < min || value > max) {
        return new CellError(ErrorType.NUM)
      }
    }

    return value
  }
}



