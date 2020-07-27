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
import {Ast, ProcedureAst} from '../../parser'
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

export type ArgumentTypes = 'string' | 'number' | 'boolean' | 'scalar' | 'noerror' | 'range' | 'integer'

export interface FunctionArgumentDefinition {
  argumentType: string,
  defaultValue?: InternalScalarValue,
  softCoerce?: boolean, //failed coerce makes function ignore the arg instead of producing error
  optionalArg?: boolean, //
  minValue?: number,
  maxValue?: number,
  lessThan?: number,
  greaterThan?: number,
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

  protected* iterateOverScalarValues(asts: Ast[], formulaAddress: SimpleCellAddress): IterableIterator<[InternalScalarValue, boolean]> {
    for (const argAst of asts) {
      const value = this.evaluateAst(argAst, formulaAddress)
      if (value instanceof SimpleRangeValue) {
        for (const scalarValue of value.valuesFromTopLeftCorner()) {
          yield [scalarValue, true]
        }
      } else {
        yield [value, false]
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
        case 'integer':
        case 'number':
          // eslint-disable-next-line no-case-declarations
          const value = this.coerceScalarToNumberOrError(arg)
          if(typeof value !== 'number') {
            return value
          }
          if(coercedType.maxValue !== undefined && value > coercedType.maxValue) {
            return new CellError(ErrorType.NUM)
          }
          if (coercedType.minValue !== undefined && value < coercedType.minValue) {
            return new CellError(ErrorType.NUM)
          }
          if(coercedType.lessThan !== undefined && value >= coercedType.lessThan) {
            return new CellError(ErrorType.NUM)
          }
          if (coercedType.greaterThan !== undefined && value <= coercedType.greaterThan) {
            return new CellError(ErrorType.NUM)
          }
          if(coercedType.argumentType === 'integer' && !Number.isInteger(value)) {
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
    let scalarValues: [InterpreterValue, boolean][]
    if(functionDefinition.expandRanges) {
      scalarValues = [...this.iterateOverScalarValues(args, formulaAddress)]
    } else {
      scalarValues = args.map((ast) => [this.evaluateAst(ast, formulaAddress), false])
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
      const [val, ignorable] = scalarValues[i] ?? [undefined, undefined]
      const arg = val ?? argumentDefinitions[j]?.defaultValue
      if(arg === undefined) {
        if(argumentDefinitions[j]?.optionalArg) {
          i++
          j++
          coercedArguments.push(undefined)
          continue
        } else {
          return new CellError(ErrorType.NA)
        }
      }
      const coercedArg = val !== undefined ? this.coerceToType(arg, argumentDefinitions[j]) : arg
      if(coercedArg === undefined) {
        if(!ignorable) {
          argCoerceFailure = argCoerceFailure ?? (new CellError(ErrorType.VALUE))
        }
        i++
        j++
        continue
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
