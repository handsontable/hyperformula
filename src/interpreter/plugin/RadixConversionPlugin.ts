import {FunctionPlugin} from "./FunctionPlugin";
import {ProcedureAst} from "../../parser";
import {CellError, CellValue, ErrorType, SimpleCellAddress} from "../../Cell";
import {coerceScalarToNumber} from "../coerce";
import {SimpleRangeValue} from "../InterpreterValue";
import {padLeft} from "../../format/format";

const NUMBER_OF_BITS = 10

export class RadixConversionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    dec2bin: {
      translationKey: 'DEC2BIN',
    },
    dec2oct: {
      translationKey: 'DEC2OCT',
    },
    dec2hex: {
      translationKey: 'DEC2HEX',
    },
  }

  public dec2bin(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 2)
  }

  public dec2oct(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 8)
  }

  public dec2hex(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.dec2base(ast, formulaAddress, 16)
  }

  private dec2base(ast: ProcedureAst, formulaAddress: SimpleCellAddress, base: number): CellValue {
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

    const min = -Math.pow(base, NUMBER_OF_BITS) / 2
    const max = -min - 1

    const value = this.getNumericArgument(ast, formulaAddress, 0, min, max)
    if (value instanceof CellError) {
      return value
    }

    return decimalToBase(value, base, places)
  }

  private getNumericArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, position: number, min: number, max: number): number | CellError {
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

function decimalToBase(value: number, base: number, places?: number): string | CellError {
  const result = decimalToRadixComplement(value, base)
  if (places === undefined || value < 0) {
    return result
  } else if (result.length > places) {
    return new CellError(ErrorType.NUM)
  } else {
    return padLeft(result, places)
  }
}

function decimalToRadixComplement(value: number, base: number): string {
  let shifted = value
  if (value < 0) {
    shifted += Math.pow(base, NUMBER_OF_BITS)
  }
  return shifted.toString(base).toUpperCase()
}



