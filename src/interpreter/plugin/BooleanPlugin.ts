import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../coerce'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
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
    xor: {
      translationKey: 'XOR',
    },
    not: {
      translationKey: 'NOT',
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
  public conditional_if(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InterpreterValue {
    const conditionValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (conditionValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const condition = coerceScalarToBoolean(conditionValue)
    if (condition === true) {
      return this.evaluateAst(ast.args[1], formulaAddress)
    } else if (condition === false) {
      if (ast.args[2]) {
        return this.evaluateAst(ast.args[2], formulaAddress)
      } else {
        return false
      }
    } else if (condition instanceof CellError) {
      return condition
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
    let anyReasonableValue = false
    for (const scalarValue of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      const coercedValue = coerceScalarToBoolean(scalarValue)
      if (coercedValue instanceof CellError) {
        return coercedValue
      } else if (coercedValue !== null) {
        result = result && coercedValue
        anyReasonableValue = true
      }
    }
    if (anyReasonableValue) {
      return result
    } else {
      return new CellError(ErrorType.VALUE)
    }
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

    let result: CellValue | null = null
    for (const scalarValue of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      const coercedValue = coerceScalarToBoolean(scalarValue)
      if (coercedValue instanceof CellError) {
        return coercedValue
      } else if (coercedValue !== null) {
        result = result || coercedValue
      }
    }
    if (result === null) {
      return new CellError(ErrorType.VALUE)
    } else {
      return result
    }
  }

  public not(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    }

    const argValue = this.evaluateAst(ast.args[0], formulaAddress)
    if (argValue instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    } else {
      const coercedValue = coerceScalarToBoolean(argValue)
      if (coercedValue instanceof CellError) {
        return coercedValue
      } else {
        return !coercedValue
      }
    }
  }

  public xor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    let truesCount = 0
    let anyFalseValue = false
    for (const scalarValue of this.iterateOverScalarValues(ast.args, formulaAddress)) {
      const coercedValue = coerceScalarToBoolean(scalarValue)
      if (coercedValue instanceof CellError) {
        return coercedValue
      } else if (coercedValue === true) {
        truesCount++
      } else if (coercedValue === false) {
        anyFalseValue = true
      }
    }
    if (anyFalseValue || truesCount > 0) {
      return (truesCount % 2 === 1)
    } else {
      return new CellError(ErrorType.VALUE)
    }
  }
}
