/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {Config} from '../../Config'
import {DependencyGraph} from '../../DependencyGraph'
import {ErrorMessage} from '../../error-message'
import {SearchStrategy} from '../../Lookup/SearchStrategy'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {Serialization} from '../../Serialization'
import {coerceScalarToBoolean, coerceScalarToString, coerceToRange} from '../ArithmeticHelper'
import {Interpreter} from '../Interpreter'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'

export interface ImplementedFunctions {
  [formulaId: string]: FunctionMetadata,
}

export interface FunctionArguments {
  parameters?: FunctionArgument[],
  /**
   * Used for functions with variable number of arguments -- tells how many last arguments can be repeated indefinitely.
   */
  repeatLastArgs?: number,

  /**
   * Ranges in arguments are inlined to (possibly multiple) scalar arguments.
   */
  expandRanges?: boolean,
}

export interface FunctionMetadata extends FunctionArguments {
  method: string,
  isVolatile?: boolean,
  isDependentOnSheetStructureChange?: boolean,
  doesNotNeedArgumentsToBeComputed?: boolean,
}

export interface FunctionPluginDefinition {
  new(interpreter: Interpreter): FunctionPlugin,

  implementedFunctions: ImplementedFunctions,
  aliases?: {[formulaId: string]: string},
}

export enum ArgumentTypes {

  /**
   * String type.
   */
  STRING = 'STRING',

  /**
   * Floating point type.
   */
  NUMBER = 'NUMBER',

  /**
   * Boolean type.
   */
  BOOLEAN = 'BOOLEAN',

  /**
   * Any non-range value.
   */
  SCALAR = 'SCALAR',

  /**
   * Any non-range, no-error type.
   */
  NOERROR = 'NOERROR',

  /**
   * Range type.
   */
  RANGE = 'RANGE',

  /**
   * Integer type.
   */
  INTEGER = 'INTEGER',

  /**
   * String representing complex number.
   */
  COMPLEX = 'COMPLEX',

  /**
   * Range or scalar.
   */
  ANY = 'ANY',
}

export interface FunctionArgument {
  argumentType: ArgumentTypes,

  /**
   * If argument is missing, its value defaults to this.
   */
  defaultValue?: InternalScalarValue,

  /**
   * If argument is missing, and no defaultValue provided, undefined is supplied as a value, instead of throwing an error.
   * Logically equivalent to setting defaultValue = undefined.
   */
  optionalArg?: boolean,

  /**
   * Numeric argument needs to be greater-equal than this.
   */
  minValue?: number,

  /**
   * Numeric argument needs to be less-equal than this.
   */
  maxValue?: number,

  /**
   * Numeric argument needs to be less than this.
   */
  lessThan?: number,

  /**
   * Numeric argument needs to be greater than this.
   */
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
  public static aliases?: {[formulaId: string]: string}
  protected readonly interpreter: Interpreter
  protected readonly dependencyGraph: DependencyGraph
  protected readonly columnSearch: SearchStrategy
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

  public coerceScalarToNumberOrError = (arg: InternalScalarValue): number | CellError => this.interpreter.arithmeticHelper.coerceScalarToNumberOrError(arg)

  public coerceToType(arg: InterpreterValue, coercedType: FunctionArgument): Maybe<InterpreterValue> {
    if (arg instanceof SimpleRangeValue) {
      switch(coercedType.argumentType) {
        case ArgumentTypes.RANGE:
        case ArgumentTypes.ANY:
          return arg
        default:
          return undefined
      }
    } else {
      switch (coercedType.argumentType) {
        case ArgumentTypes.INTEGER:
        case ArgumentTypes.NUMBER:
          // eslint-disable-next-line no-case-declarations
          const value = this.coerceScalarToNumberOrError(arg)
          if (typeof value !== 'number') {
            return value
          }
          if (coercedType.maxValue !== undefined && value > coercedType.maxValue) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
          }
          if (coercedType.minValue !== undefined && value < coercedType.minValue) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          if (coercedType.lessThan !== undefined && value >= coercedType.lessThan) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueLarge)
          }
          if (coercedType.greaterThan !== undefined && value <= coercedType.greaterThan) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
          if (coercedType.argumentType === ArgumentTypes.INTEGER && !Number.isInteger(value)) {
            return new CellError(ErrorType.NUM, ErrorMessage.IntegerExpected)
          }
          return value
        case ArgumentTypes.STRING:
          return coerceScalarToString(arg)
        case ArgumentTypes.BOOLEAN:
          return coerceScalarToBoolean(arg)
        case ArgumentTypes.SCALAR:
        case ArgumentTypes.NOERROR:
        case ArgumentTypes.ANY:
          return arg
        case ArgumentTypes.RANGE:
          if (arg instanceof CellError) {
            return arg
          }
          return coerceToRange(arg)
        case ArgumentTypes.COMPLEX:

      }
    }
  }

  protected runFunction = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    functionDefinition: FunctionArguments,
    fn: (...arg: any) => InternalScalarValue
  ) => {
    const argumentDefinitions: FunctionArgument[] = functionDefinition.parameters!
    let scalarValues: [InterpreterValue, boolean][]

    if (functionDefinition.expandRanges) {
      scalarValues = this.listOfScalarValues(args, formulaAddress)
    } else {
      scalarValues = args.map((ast) => [this.evaluateAst(ast, formulaAddress), false])
    }

    const coercedArguments: Maybe<InterpreterValue>[] = []

    let argCoerceFailure: Maybe<CellError> = undefined
    if (functionDefinition.repeatLastArgs === undefined && argumentDefinitions.length < scalarValues.length) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (functionDefinition.repeatLastArgs !== undefined && scalarValues.length > argumentDefinitions.length &&
      (scalarValues.length - argumentDefinitions.length) % functionDefinition.repeatLastArgs !== 0) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    for (let i = 0, j = 0; i < Math.max(scalarValues.length, argumentDefinitions.length); i++, j++) {
      // i points to where are we in the scalarValues list,
      // j points to where are we in the argumentDefinitions list
      if (j === argumentDefinitions.length) {
        j -= functionDefinition.repeatLastArgs!
      }
      const [val, ignorable] = scalarValues[i] ?? [undefined, undefined]
      const arg = val ?? argumentDefinitions[j]?.defaultValue
      if (arg === undefined) {
        if (argumentDefinitions[j]?.optionalArg) {
          coercedArguments.push(undefined)
        } else {
          //not enough values passed as arguments, and there was no default value and argument was not optional
          return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
        }
      } else {
        //we apply coerce only to non-default values
        const coercedArg = val !== undefined ? this.coerceToType(arg, argumentDefinitions[j]) : arg
        if (coercedArg !== undefined) {
          if (coercedArg instanceof CellError && argumentDefinitions[j].argumentType !== ArgumentTypes.SCALAR) {
            //if this is first error encountered, store it
            argCoerceFailure = argCoerceFailure ?? coercedArg
          }
          coercedArguments.push(coercedArg)
        } else if (!ignorable) {
          //if this is first error encountered, store it
          argCoerceFailure = argCoerceFailure ?? (new CellError(ErrorType.VALUE, ErrorMessage.WrongType))
        }
      }
    }

    return argCoerceFailure ?? fn(...coercedArguments)
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    argumentDefinitions: FunctionArguments,
    noArgCallback: () => InternalScalarValue,
    referenceCallback: (reference: SimpleCellAddress) => InternalScalarValue,
    nonReferenceCallback: (...arg: any) => InternalScalarValue = () => new CellError(ErrorType.NA, ErrorMessage.CellRefExpected)
  ) => {
    if (args.length === 0) {
      return noArgCallback()
    } else if (args.length > 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    let arg = args[0]

    while(arg.type === AstNodeType.PARENTHESIS) {
      arg = arg.expression
    }

    let cellReference: Maybe<SimpleCellAddress>

    if (arg.type === AstNodeType.CELL_REFERENCE) {
      cellReference = arg.reference.toSimpleCellAddress(formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF, ErrorMessage.CellRefExpected)
      }
    }

    if (cellReference !== undefined) {
      return referenceCallback(cellReference)
    }

    return this.runFunction(args, formulaAddress, argumentDefinitions, nonReferenceCallback)
  }

  protected metadata(name: string): FunctionMetadata {
    const params = (this.constructor as FunctionPluginDefinition).implementedFunctions[name]
    if (params !== undefined) {
      return params
    }
    throw new Error(`No metadata for function ${name}.`)
  }
}
