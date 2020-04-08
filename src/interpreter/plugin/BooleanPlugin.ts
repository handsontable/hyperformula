/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalCellValue, NoErrorCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {coerceScalarToBoolean} from '../ArithmeticHelper'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing boolean functions
 */
export class BooleanPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    literalTrue: {
      translationKey: 'TRUE',
    },
    literalFalse: {
      translationKey: 'FALSE',
    },
    conditionalIf: {
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
    switch: {
      translationKey: 'SWITCH',
    },
    iferror: {
      translationKey: 'IFERROR',
    },
    ifna: {
      translationKey: 'IFNA',
    },
    choose: {
      translationKey: 'CHOOSE',
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public literalTrue(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public literalFalse(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
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
  public conditionalIf(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InterpreterValue {
    if (ast.args.length > 3 || ast.args.length < 2) {
      return new CellError(ErrorType.NA)
    }
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
  public and(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    let result: InternalCellValue = true
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
  public or(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1) {
      return new CellError(ErrorType.NA)
    }

    let result: InternalCellValue | null = null
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

  public not(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
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

  public xor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
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

  public switch(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 3) {
      return new CellError(ErrorType.NA)
    }

    const vals: InternalCellValue[] = []
    for(const arg of ast.args) {
      const val: InterpreterValue = this.evaluateAst(arg, formulaAddress)
      if(val instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }
      vals.push(val)
    }
    const n = vals.length
    if(vals[0] instanceof CellError){
      return vals[0]
    }

    let i = 1
    for(;i+1<n;i+=2){
      if(vals[i] instanceof CellError) {
        continue
      }
      if( this.interpreter.arithmeticHelper.compare(vals[0], vals[i] as NoErrorCellValue) === 0 ) {
        return vals[i+1]
      }
    }
    if(i<n) {
      return vals[i]
    } else {
      return new CellError(ErrorType.NA)
    }
  }

  public iferror(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const left: InterpreterValue = this.evaluateAst(ast.args[0], formulaAddress)
    const right: InterpreterValue = this.evaluateAst(ast.args[1], formulaAddress)

    if(left instanceof SimpleRangeValue || right instanceof SimpleRangeValue){
      return new CellError(ErrorType.VALUE)
    }

    if(left instanceof CellError){
      return right
    } else {
      return left
    }
  }

  public ifna(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    const left: InterpreterValue = this.evaluateAst(ast.args[0], formulaAddress)
    const right: InterpreterValue = this.evaluateAst(ast.args[1], formulaAddress)

    if(left instanceof SimpleRangeValue || right instanceof SimpleRangeValue){
      return new CellError(ErrorType.VALUE)
    }

    if(left instanceof CellError && left.type === ErrorType.NA){
      return right
    } else {
      return left
    }
  }

  public choose(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 2) {
      return new CellError(ErrorType.NA)
    }

    const vals: InternalCellValue[] = []
    for(const arg of ast.args) {
      const val: InterpreterValue = this.evaluateAst(arg, formulaAddress)
      if(val instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }
      vals.push(val)
    }

    const n = vals.length

    if(vals[0] instanceof CellError){
      return vals[0]
    }

    const selector = this.interpreter.arithmeticHelper.coerceToMaybeNumber(vals[0])

    if(selector === undefined || selector != Math.round(selector) || selector < 1 || selector >= n) {
      return new CellError(ErrorType.NUM)
    }
    return vals[selector]
  }
}
