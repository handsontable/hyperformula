/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ColumnSearchStrategy} from '../../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../../Config'
import {DependencyGraph} from '../../DependencyGraph'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToString} from '../ArithmeticHelper'
import {Interpreter} from '../Interpreter'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {Maybe} from '../../Maybe'

export interface ImplementedFunctions {
  [formulaId: string]: FunctionMetadata,
}

export interface FunctionMetadata {
  method: string,
  isVolatile?: boolean,
  isDependentOnSheetStructureChange?: boolean,
  doesNotNeedArgumentsToBeComputed?: boolean,
}

export interface FunctionPluginDefinition {
  new(interpreter: Interpreter): FunctionPlugin,

  implementedFunctions: ImplementedFunctions,
}

export type ArgumentTypes = "string" | "number"

export interface FunctionArgumentDefinition {
  argumentType: string,
  defaultValue?: InternalScalarValue,
}

export type PluginFunctionType = (ast: ProcedureAst, formulaAddress: SimpleCellAddress) => InternalScalarValue

/**
 * Abstract class representing interpreter function plugin.
 * Plugin may contain multiple functions. Each function should be of type {@link PluginFunctionType} and needs to be
 * included in {@link implementedFunctions}
 */
export abstract class FunctionPlugin {
  /**
   * Dictionary containing functions implemented by specific plugin, along with function name translations.
   */
  public static implementedFunctions: ImplementedFunctions
  protected readonly interpreter: Interpreter
  protected readonly dependencyGraph: DependencyGraph
  protected readonly columnSearch: ColumnSearchStrategy
  protected readonly config: Config

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.dependencyGraph = interpreter.dependencyGraph
    this.columnSearch = interpreter.columnSearch
    this.config = interpreter.config
  }

  protected evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  protected* iterateOverScalarValues(asts: Ast[], formulaAddress: SimpleCellAddress): IterableIterator<InternalScalarValue> {
    for (const argAst of asts) {
      const value = this.evaluateAst(argAst, formulaAddress)
      if (value instanceof SimpleRangeValue) {
        for (const scalarValue of value.valuesFromTopLeftCorner()) {
          yield scalarValue
        }
      } else {
        yield value
      }
    }
  }

  protected computeListOfValuesInRange(range: AbsoluteCellRange): InternalScalarValue[] {
    const values: InternalScalarValue[] = []
    for (const cellFromRange of range.addresses(this.dependencyGraph)) {
      const value = this.dependencyGraph.getScalarValue(cellFromRange)
      values.push(value)
    }

    return values
  }

  protected templateWithOneCoercedToNumberArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg: number) => InternalScalarValue): InternalScalarValue {
    return this.coerceArgumentsWithDefaults(ast.args, formulaAddress, [{ argumentType: "number"}], fn)
  }

  protected templateWithOneCoercedToStringArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, fn: (arg: string) => InternalScalarValue): InternalScalarValue {
    return this.coerceArgumentsWithDefaults(ast.args, formulaAddress, [{ argumentType: "string" }], fn)
  }

  protected validateTwoNumericArguments(ast: ProcedureAst, formulaAddress: SimpleCellAddress): [number, number] | CellError {
    if (ast.args.length !== 2) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args.some((ast) => ast.type === AstNodeType.EMPTY)) {
      return new CellError(ErrorType.NUM)
    }
    const left = this.evaluateAst(ast.args[0], formulaAddress)
    if (left instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }
    const coercedLeft = this.coerceScalarToNumberOrError(left)
    if (coercedLeft instanceof CellError) {
      return coercedLeft
    }

    const right = this.evaluateAst(ast.args[1], formulaAddress)
    if (right instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const coercedRight = this.coerceScalarToNumberOrError(right)
    if (coercedRight instanceof CellError) {
      return coercedRight
    }

    return [coercedLeft, coercedRight]
  }

  protected getNumericArgument(ast: ProcedureAst, formulaAddress: SimpleCellAddress, position: number, min?: number, max?: number): number | CellError {
    if (position > ast.args.length - 1) {
      return new CellError(ErrorType.NA)
    }
    if (ast.args[position].type === AstNodeType.EMPTY) {
      return new CellError(ErrorType.NUM)
    }
    const arg = this.evaluateAst(ast.args[position]!, formulaAddress)

    if (arg instanceof SimpleRangeValue) {
      return new CellError(ErrorType.VALUE)
    }

    const value = this.coerceScalarToNumberOrError(arg)
    if (typeof value === 'number' && min !== undefined && max !== undefined && (value < min || value > max)) {
      return new CellError(ErrorType.NUM)
    }

    return value
  }

  public coerceScalarToNumberOrError = (arg: InternalScalarValue): number | CellError => this.interpreter.arithmeticHelper.coerceScalarToNumberOrError(arg)

  public coerceToType(arg: InternalScalarValue, coercedType: ArgumentTypes): InternalScalarValue {
    switch(coercedType) {
      case 'number':
        return this.coerceScalarToNumberOrError(arg)
      case 'string':
        return coerceScalarToString(arg)
    }
  }
  protected coerceArgumentsWithDefaults = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    argumentDefinitions: FunctionArgumentDefinition[],
    fn: (...arg: any) => InternalScalarValue
  ) => {
    if (args.length > argumentDefinitions.length) {
      return new CellError(ErrorType.NA)
    }

    const coercedArguments: InternalScalarValue[] = []
    for (let i = 0; i < argumentDefinitions.length; ++i) {
      const arg = this.evaluateArgOrDefault(formulaAddress, args[i], argumentDefinitions[i].defaultValue)
      if (arg instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }
      const coercedArg = this.coerceToType(arg, argumentDefinitions[i].argumentType as ArgumentTypes)
      if (coercedArg instanceof CellError) {
        return coercedArg
      }
      coercedArguments.push(coercedArg)
    }

    return fn(...coercedArguments)
  }

  protected evaluateArgOrDefault = (formulaAddress: SimpleCellAddress, argAst?: Ast, defaultValue?: InternalScalarValue): InterpreterValue => {
    if (argAst !== undefined) {
      return this.evaluateAst(argAst, formulaAddress)
    }
    return defaultValue || new CellError(ErrorType.NA)
  }
}
