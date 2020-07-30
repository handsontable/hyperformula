/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

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
import {Serialization} from '../../Serialization'

export interface ImplementedFunctions {
  [formulaId: string]: FunctionMetadata,
}

export interface FunctionMetadata {
  method: string,
  parameters?: FunctionArgumentsDefinition,
  isVolatile?: boolean,
  isDependentOnSheetStructureChange?: boolean,
  doesNotNeedArgumentsToBeComputed?: boolean,
}

export interface FunctionPluginDefinition {
  new(interpreter: Interpreter): FunctionPlugin,

  implementedFunctions: ImplementedFunctions,
}

export type ArgumentTypes = 'string' | 'number' | 'boolean' | 'scalar' | 'noerror' | 'range' | 'integer'

export interface FunctionArgumentsDefinition {
  list: FunctionArgument[],
  repeatedArg?: boolean,
  expandRanges?: boolean,
}

export interface FunctionArgument {
  argumentType: string,
  defaultValue?: InternalScalarValue,
  optionalArg?: boolean,
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
  protected readonly serialization: Serialization

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.dependencyGraph = interpreter.dependencyGraph
    this.columnSearch = interpreter.columnSearch
    this.config = interpreter.config
    this.serialization = interpreter.serialization
  }

  protected evaluateAst(ast: Ast, formulaAddress: SimpleCellAddress): InterpreterValue {
    return this.interpreter.evaluateAst(ast, formulaAddress)
  }

  protected listOfScalarValues(asts: Ast[], formulaAddress: SimpleCellAddress): [InternalScalarValue, boolean][] {
    const ret: [InternalScalarValue, boolean][] = []
    for (const argAst of asts) {
      const value = this.evaluateAst(argAst, formulaAddress)
      if (value instanceof SimpleRangeValue) {
        for (const scalarValue of value.valuesFromTopLeftCorner()) {
          ret.push([scalarValue, true])
        }
      } else {
        ret.push([value, false])
      }
    }
    return ret
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

  public coerceToType(arg: InterpreterValue, coercedType: FunctionArgument): Maybe<InterpreterValue> {
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
    functionDefinition: FunctionArgumentsDefinition,
    fn: (...arg: any) => InternalScalarValue
  ) => {
    const argumentDefinitions: FunctionArgument[] = functionDefinition.list
    let scalarValues: [InterpreterValue, boolean][]

    if(functionDefinition.expandRanges) {
      scalarValues = this.listOfScalarValues(args, formulaAddress)
    } else {
      scalarValues = args.map((ast) => [this.evaluateAst(ast, formulaAddress), false])
    }

    const coercedArguments: Maybe<InterpreterValue>[] = []

    let argCoerceFailure: Maybe<CellError> = undefined
    if(!functionDefinition.repeatedArg && argumentDefinitions.length < scalarValues.length) {
      return new CellError(ErrorType.NA)
    }
    for(let i=0; i<Math.max(scalarValues.length, argumentDefinitions.length); i++) {
      // i points to where are we in the scalarValues list,
      // j points to where are we in the argumentDefinitions list
      const j = Math.min(i, argumentDefinitions.length-1)
      const [val, ignorable] = scalarValues[i] ?? [undefined, undefined]
      const arg = val ?? argumentDefinitions[j]?.defaultValue
      if(arg === undefined) {
        if(argumentDefinitions[j]?.optionalArg) {
          coercedArguments.push(undefined)
        } else {
          //not enough values passed as arguments, and there was no default value and argument was not optional
          return new CellError(ErrorType.NA)
        }
      } else {
        //we apply coerce only to non-default values
        const coercedArg = val !== undefined ? this.coerceToType(arg, argumentDefinitions[j]) : arg
        if(coercedArg !== undefined) {
          if (coercedArg instanceof CellError && argumentDefinitions[j].argumentType !== 'scalar') {
            //if this is first error encountered, store it
            argCoerceFailure = argCoerceFailure ?? coercedArg
          }
          coercedArguments.push(coercedArg)
        } else if (!ignorable) {
          //if this is first error encountered, store it
          argCoerceFailure = argCoerceFailure ?? (new CellError(ErrorType.VALUE))
        }
      }
    }

    return argCoerceFailure ?? fn(...coercedArguments)
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    argumentDefinitions: FunctionArgumentsDefinition,
    noArgCallback: () => InternalScalarValue,
    referenceCallback: (reference: SimpleCellAddress) => InternalScalarValue,
    nonReferenceCallback: (...arg: any) => InternalScalarValue
  ) => {
    if (args.length === 0) {
      return noArgCallback()
    } else if (args.length > 1) {
      return new CellError(ErrorType.NA)
    }
    const arg = args[0]

    let cellReference: Maybe<SimpleCellAddress>

    if (arg.type === AstNodeType.CELL_REFERENCE) {
      cellReference = arg.reference.toSimpleCellAddress(formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF)
      }
    }

    if (cellReference !== undefined) {
      return referenceCallback(cellReference)
    }

    return this.runFunction(args, formulaAddress, argumentDefinitions, nonReferenceCallback)
  }

  protected parameters(name: string): FunctionArgumentsDefinition {
    const params = (this.constructor as FunctionPluginDefinition).implementedFunctions[name]?.parameters
    if (params !== undefined) {
      return params
    }
    throw new Error('FIXME Should not be undefined')
  }
}
