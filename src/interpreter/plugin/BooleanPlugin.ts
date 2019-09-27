import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {booleanRepresentation} from '../coerce'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    literal_true: {
      translationKey: 'TRUE',
    },
    literal_false: {
      translationKey: 'FALSE',
    },
    conditional_if: {
      translationKey: 'IF',
    },
    and: {
      translationKey: 'AND',
    },
    or: {
      translationKey: 'OR',
    },
  }

  /**
   * Corresponds to TRUE()
   *
   * Returns the logical true
   *
   * @param ast
   * @param formulaAddress
   */
  public literal_true(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length > 0) {
      return new CellError(ErrorType.NA)
    } else {
      return true
    }
  }

  /**
   * Corresponds to FALSE()
   *
   * Returns the logical false
   *
   * @param ast
   * @param formulaAddress
   */
  public literal_false(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length > 0) {
      return new CellError(ErrorType.NA)
    } else {
      return false
    }
  }

  /**
   * Corresponds to IF(expression, value_if_true, value_if_false)
   *
   * Returns value specified as second argument if expression is true and third argument if expression is false
   *
   * @param ast
   * @param formulaAddress
   */
  public conditional_if(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    const condition = booleanRepresentation(this.evaluateAst(ast.args[0], formulaAddress))
    if (condition === true) {
      return this.evaluateAst(ast.args[1], formulaAddress)
    } else if (condition === false) {
      if (ast.args[2]) {
        return this.evaluateAst(ast.args[2], formulaAddress)
      } else {
        return false
      }
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }

  /**
   * Corresponds to AND(expression1, [expression2, ...])
   *
   * Returns true if all of the provided arguments are logically true, and false if any of it is logically false
   *
   * @param ast
   * @param formulaAddress
   */
  public and(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    let result: CellValue = true
    let index = 0
    while (result === true && index < ast.args.length) {
      const argValue = this.evaluateAst(ast.args[index], formulaAddress)
      result = booleanRepresentation(argValue)
      ++index
    }
    return result
  }

  /**
   * Corresponds to OR(expression1, [expression2, ...])
   *
   * Returns true if any of the provided arguments are logically true, and false otherwise
   *
   * @param ast
   * @param formulaAddress
   */
  public or(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    let result: CellValue = false
    let index = 0
    while (result === false && index < ast.args.length) {
      const argValue = this.evaluateAst(ast.args[index], formulaAddress)
      result = booleanRepresentation(argValue)
      ++index
    }
    return result
  }
}
