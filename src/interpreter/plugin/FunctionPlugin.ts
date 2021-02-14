/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {Config} from '../../Config'
import {DependencyGraph} from '../../DependencyGraph'
import {ErrorMessage} from '../../error-message'
import {SearchStrategy} from '../../Lookup/SearchStrategy'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {Serialization} from '../../Serialization'
import {coerceScalarToBoolean, coerceScalarToString, coerceToRange, complex} from '../ArithmeticHelper'
import {Interpreter} from '../Interpreter'
import {
  ExtendedNumber, FormatInfo,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
  RawNoErrorScalarValue,
  RawScalarValue
} from '../InterpreterValue'
import {SimpleRangeValue} from '../SimpleRangeValue'

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

  /**
   * Return number value is packed into this subtype.
   */
  returnNumberType?: NumberType,
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
   * Argument should be passed with full type information.
   * (e.g. Date/DateTime/Time/Currency/Percentage for numbers)
   */
  passSubtype?: boolean,

  /**
   * If argument is missing, its value defaults to this.
   */
  defaultValue?: InternalScalarValue | RawScalarValue,

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

  public coerceScalarToNumberOrError = (arg: InternalScalarValue): ExtendedNumber | CellError => this.interpreter.arithmeticHelper.coerceScalarToNumberOrError(arg)

  public coerceToType(arg: InterpreterValue, coercedType: FunctionArgument): Maybe<InterpreterValue | complex | RawNoErrorScalarValue> {
    let ret
    if (arg instanceof SimpleRangeValue) {
      switch(coercedType.argumentType) {
        case ArgumentTypes.RANGE:
        case ArgumentTypes.ANY:
          ret = arg
          break
        default:
          return undefined
      }
    } else {
      switch (coercedType.argumentType) {
        case ArgumentTypes.INTEGER:
        case ArgumentTypes.NUMBER:
          // eslint-disable-next-line no-case-declarations
          const coerced = this.coerceScalarToNumberOrError(arg)
          if (!isExtendedNumber(coerced)) {
            ret = coerced
            break
          }
          // eslint-disable-next-line no-case-declarations
          const value = getRawValue(coerced)
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
          ret = coerced
          break
        case ArgumentTypes.STRING:
          ret = coerceScalarToString(arg)
          break
        case ArgumentTypes.BOOLEAN:
          ret = coerceScalarToBoolean(arg)
          break
        case ArgumentTypes.SCALAR:
        case ArgumentTypes.NOERROR:
        case ArgumentTypes.ANY:
          ret = arg
          break
        case ArgumentTypes.RANGE:
          if (arg instanceof CellError) {
            return arg
          }
          ret = coerceToRange(getRawValue(arg))
          break
        case ArgumentTypes.COMPLEX:
          return this.interpreter.arithmeticHelper.coerceScalarToComplex(getRawValue(arg))
      }
    }
    if(coercedType.passSubtype || ret === undefined) {
      return ret
    } else {
      return getRawValue(ret)
    }
  }

  protected runFunction = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    functionDefinition: FunctionArguments,
    fn: (...arg: any) => InternalScalarValue
  ) => {
    return this.runFunctionTemplate(args, formulaAddress, functionDefinition, fn)
  }

  protected runMatrixFunction = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    functionDefinition: FunctionArguments,
    fn: (...arg: any) => InterpreterValue
  ) => {
    return this.runFunctionTemplate(args, formulaAddress, functionDefinition, fn)
  }

  private runFunctionTemplate = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    functionDefinition: FunctionArguments,
    fn: (...arg: any) => any
  ) => {
    const argumentDefinitions: FunctionArgument[] = functionDefinition.parameters!
    let scalarValues: [InterpreterValue, boolean][]

    if (functionDefinition.expandRanges) {
      scalarValues = this.listOfScalarValues(args, formulaAddress)
    } else {
      scalarValues = args.map((ast) => [this.evaluateAst(ast, formulaAddress), false])
    }

    const coercedArguments: Maybe<InterpreterValue | complex | RawNoErrorScalarValue>[] = []

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

    return argCoerceFailure ?? this.returnNumberWrapper(fn(...coercedArguments), functionDefinition.returnNumberType)
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    formulaAddress: SimpleCellAddress,
    argumentDefinitions: FunctionArguments,
    noArgCallback: () => InternalScalarValue | RawScalarValue,
    referenceCallback: (reference: SimpleCellAddress) => InternalScalarValue,
    nonReferenceCallback: (...arg: any) => InternalScalarValue = () => new CellError(ErrorType.NA, ErrorMessage.CellRefExpected)
  ) => {
    if (args.length === 0) {
      return this.returnNumberWrapper(noArgCallback(), argumentDefinitions.returnNumberType)
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
      return this.returnNumberWrapper(referenceCallback(cellReference), argumentDefinitions.returnNumberType)
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

  private returnNumberWrapper(val: InternalScalarValue, type?: NumberType, format?: FormatInfo): InternalScalarValue {
    if(type !== undefined && isExtendedNumber(val)) {
      return this.interpreter.arithmeticHelper.ExtendedNumberFactory(getRawValue(val), {type, format})
    } else {
      return val
    }
  }
}

