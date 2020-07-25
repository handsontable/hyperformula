/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import assert from 'assert'
import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ColumnSearchStrategy} from '../../ColumnSearch/ColumnSearchStrategy'
import {Config} from '../../Config'
import {DependencyGraph} from '../../DependencyGraph'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToBoolean, coerceScalarToString} from '../ArithmeticHelper'
import {Interpreter} from '../Interpreter'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'

export interface ImplementedFunctions {
  [formulaId: string]: FunctionMetadata,
}

export interface FunctionMetadata {
  method: string,
  parameters?: FunctionArgumentDefinition[],
  repeatedArg?: boolean,
  expandRanges?: boolean,
  isVolatile?: boolean,
  isDependentOnSheetStructureChange?: boolean,
  doesNotNeedArgumentsToBeComputed?: boolean,
}

export interface FunctionPluginDefinition {
  new(interpreter: Interpreter): FunctionPlugin,

  implementedFunctions: ImplementedFunctions,
}

export type ArgumentTypes = 'string' | 'number' | 'boolean' | 'scalar' | 'noerror' | 'range'

export interface FunctionArgumentDefinition {
  argumentType: string,
  defaultValue?: InternalScalarValue,
  softCoerce?: boolean,
  minValue?: number,
  maxValue?: number,
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

  public coerceToType(arg: InterpreterValue, coercedType: FunctionArgumentDefinition): Maybe<InterpreterValue> {
    if(arg instanceof SimpleRangeValue) {
      if(coercedType.argumentType === 'range') {
        return arg
      } else {
        return undefined
      }
    } else {
      switch (coercedType.argumentType as ArgumentTypes) {
        case 'number':
          const value = this.coerceScalarToNumberOrError(arg)
          if (typeof value === 'number' && coercedType.maxValue !== undefined && coercedType.minValue !== undefined && (value < coercedType.minValue || value > coercedType.maxValue)) {
            return new CellError(ErrorType.NUM)
          }
          return value
        case 'string':
          return coerceScalarToString(arg)
        case 'boolean':
          return coerceScalarToBoolean(arg)
        case 'scalar':
          return arg
        case 'noerror':
          return arg
        case 'range':
          return undefined
      }
    }
  }

  protected runFunction = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    functionDefinition: FunctionMetadata,
    fn: (...arg: any) => InternalScalarValue
  ) => {
    const argumentDefinitions: FunctionArgumentDefinition[] = functionDefinition.parameters!
    assert(argumentDefinitions !== undefined)
    let scalarValues: InterpreterValue[]
    if(functionDefinition.expandRanges) {
      scalarValues = [...this.iterateOverScalarValues(args, formulaAddress)]
    } else {
      scalarValues = args.map((ast) => this.evaluateAst(ast, formulaAddress))
    }
    const coercedArguments: Maybe<InterpreterValue>[] = []

    let argCoerceFailure: Maybe<CellError> = undefined
    let j = 0
    let i = 0
    while(i<scalarValues.length || j<argumentDefinitions.length) {
      if(j===argumentDefinitions.length) {
        if(functionDefinition.repeatedArg) {
          j--
        } else {
          return new CellError(ErrorType.NA)
        }
      }
      const arg = scalarValues[i] ?? argumentDefinitions[j]?.defaultValue
      if(arg === undefined) {
        return new CellError(ErrorType.NA)
      }
      const coercedArg = this.coerceToType(arg, argumentDefinitions[j])
      if(coercedArg === undefined && !argumentDefinitions[j].softCoerce) {
        argCoerceFailure = argCoerceFailure ?? (new CellError(ErrorType.VALUE))
      }
      if (coercedArg instanceof CellError && argumentDefinitions[j].argumentType !== 'scalar') {
        argCoerceFailure = argCoerceFailure ?? coercedArg
      }
      coercedArguments.push(coercedArg)
      j++
      i++
    }

    return argCoerceFailure ?? fn(...coercedArguments)
  }

  protected evaluateArgOrDefault = (formulaAddress: SimpleCellAddress, argAst?: Ast, defaultValue?: InternalScalarValue): InterpreterValue => {
    if (argAst !== undefined) {
      return this.evaluateAst(argAst, formulaAddress)
    }
    return defaultValue ?? new CellError(ErrorType.NA)
  }
}
