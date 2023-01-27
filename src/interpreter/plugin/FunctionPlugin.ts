/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize, ArraySizePredictor} from '../../ArraySize'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {Config} from '../../Config'
import {DateTimeHelper} from '../../DateTimeHelper'
import {DependencyGraph} from '../../DependencyGraph'
import {ErrorMessage} from '../../error-message'
import {SearchStrategy} from '../../Lookup/SearchStrategy'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {Serialization} from '../../Serialization'
import {
  ArithmeticHelper,
  coerceRangeToScalar,
  coerceScalarToBoolean,
  coerceScalarToString,
  coerceToRange,
  complex
} from '../ArithmeticHelper'
import {Interpreter} from '../Interpreter'
import {InterpreterState} from '../InterpreterState'
import {
  ExtendedNumber,
  FormatInfo,
  getRawValue,
  InternalScalarValue,
  InterpreterValue,
  isExtendedNumber,
  NumberType,
  RawNoErrorScalarValue,
  RawScalarValue
} from '../InterpreterValue'
import {SimpleRangeValue} from '../../SimpleRangeValue'

export interface ImplementedFunctions {
  [formulaId: string]: FunctionMetadata,
}

export interface FunctionMetadata {
  /**
   * Internal and engine.
   */
  parameters?: FunctionArgument[],

  /**
   * Internal.
   *
   * For functions with a variable number of arguments: sets how many last arguments can be repeated indefinitely.
   */
  repeatLastArgs?: number,

  /**
   * Internal.
   *
   * If set to `true`, ranges in the function's arguments are inlined to (possibly multiple) scalar arguments.
   */
  expandRanges?: boolean,

  /**
   * Internal.
   *
   * Return number value is packed into this subtype.
   */
  returnNumberType?: NumberType,

  /**
   * Engine.
   */
  method: string,

  /**
   * Engine.
   */
  arraySizeMethod?: string,

  /**
   * Engine.
   *
   * If set to `true`, the function is volatile.
   */
  isVolatile?: boolean,

  /**
   * Engine.
   *
   * If set to `true`, the function gets recalculated with each sheet shape change
   * (e.g. when adding/removing rows or columns).
   */
  isDependentOnSheetStructureChange?: boolean,

  /**
   * Engine.
   *
   * If set to `true`, the function treats reference or range arguments as arguments that don't create dependency.
   *
   * Other arguments are properly evaluated.
   */
  doesNotNeedArgumentsToBeComputed?: boolean,

  /**
   * Engine.
   *
   * If set to `true`, the function enables the array arithmetic mode in its arguments and nested expressions.
   */
  arrayFunction?: boolean,

  /**
   * Internal.
   *
   * If set to `true`, prevents the function from ever being vectorized.
   *
   * Some functions do not allow vectorization: array-output, and special functions.
   */
  vectorizationForbidden?: boolean,
}

export interface FunctionPluginDefinition {
  implementedFunctions: ImplementedFunctions,
  aliases?: { [formulaId: string]: string },

  new(interpreter: Interpreter): FunctionPlugin,
}

export enum FunctionArgumentType {

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
  argumentType: FunctionArgumentType,

  /**
   * If set to `true`, arguments need to be passed with full type information.
   * (e.g. for numbers: `Date` or `DateTime` or `Time` or `Currency` or `Percentage`)
   */
  passSubtype?: boolean,

  /**
   * If an argument is missing, its value defaults to `defaultValue`.
   */
  defaultValue?: InternalScalarValue | RawScalarValue,

  /**
   * If set to `true`:
   * if an argument is missing, and no `defaultValue` is set, the argument is `undefined` (instead of throwing an error).
   *
   * This is logically equivalent to setting `defaultValue` to `undefined`.
   */
  optionalArg?: boolean,

  /**
   * If set, numerical arguments need to be greater than or equal to `minValue`.
   */
  minValue?: number,

  /**
   * If set, numerical arguments need to be less than or equal to `maxValue`.
   */
  maxValue?: number,

  /**
   * If set, numerical arguments need to be less than `lessThan`.
   */
  lessThan?: number,

  /**
   * If set, numerical arguments need to be greater than `greaterThan`.
   */
  greaterThan?: number,
}

export type PluginFunctionType = (ast: ProcedureAst, state: InterpreterState) => InterpreterValue

export type PluginArraySizeFunctionType = (ast: ProcedureAst, state: InterpreterState) => ArraySize

export type FunctionPluginTypecheck<T> = {
  [K in keyof T]: T[K] extends PluginFunctionType | PluginArraySizeFunctionType ? T[K] : never
}

/**
 * Abstract class representing interpreter function plugin.
 * Plugin may contain multiple functions. Each function should be of type {@link PluginFunctionType} and needs to be
 * included in {@link implementedFunctions}
 */
export abstract class FunctionPlugin implements FunctionPluginTypecheck<FunctionPlugin> {
  /**
   * Dictionary containing functions implemented by specific plugin, along with function name translations.
   */
  public static implementedFunctions: ImplementedFunctions
  public static aliases?: { [formulaId: string]: string }
  protected readonly interpreter: Interpreter
  protected readonly dependencyGraph: DependencyGraph
  protected readonly columnSearch: SearchStrategy
  protected readonly config: Config
  protected readonly serialization: Serialization
  protected readonly arraySizePredictor: ArraySizePredictor
  protected readonly dateTimeHelper: DateTimeHelper
  protected readonly arithmeticHelper: ArithmeticHelper

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.dependencyGraph = interpreter.dependencyGraph
    this.columnSearch = interpreter.columnSearch
    this.config = interpreter.config
    this.serialization = interpreter.serialization
    this.arraySizePredictor = interpreter.arraySizePredictor
    this.dateTimeHelper = interpreter.dateTimeHelper
    this.arithmeticHelper = interpreter.arithmeticHelper
  }

  protected evaluateAst(ast: Ast, state: InterpreterState): InterpreterValue {
    return this.interpreter.evaluateAst(ast, state)
  }

  protected arraySizeForAst(ast: Ast, state: InterpreterState): ArraySize {
    return this.arraySizePredictor.checkArraySizeForAst(ast, state)
  }

  protected listOfScalarValues(asts: Ast[], state: InterpreterState): [InternalScalarValue, boolean][] {
    const ret: [InternalScalarValue, boolean][] = []
    for (const argAst of asts) {
      const value = this.evaluateAst(argAst, state)
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

  protected coerceScalarToNumberOrError = (arg: InternalScalarValue): ExtendedNumber | CellError => this.arithmeticHelper.coerceScalarToNumberOrError(arg)

  protected coerceToType(arg: InterpreterValue, coercedType: FunctionArgument, state: InterpreterState): Maybe<InterpreterValue | complex | RawNoErrorScalarValue> {
    let ret
    if (arg instanceof SimpleRangeValue) {
      switch (coercedType.argumentType) {
        case FunctionArgumentType.RANGE:
        case FunctionArgumentType.ANY:
          ret = arg
          break
        default: {
          const coerce = coerceRangeToScalar(arg, state)
          if (coerce === undefined) {
            return undefined
          }
          arg = coerce
        }
      }
    }
    if (!(arg instanceof SimpleRangeValue)) {
      switch (coercedType.argumentType) {
        case FunctionArgumentType.INTEGER:
        case FunctionArgumentType.NUMBER:
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
          if (coercedType.argumentType === FunctionArgumentType.INTEGER && !Number.isInteger(value)) {
            return new CellError(ErrorType.NUM, ErrorMessage.IntegerExpected)
          }
          ret = coerced
          break
        case FunctionArgumentType.STRING:
          ret = coerceScalarToString(arg)
          break
        case FunctionArgumentType.BOOLEAN:
          ret = coerceScalarToBoolean(arg)
          break
        case FunctionArgumentType.SCALAR:
        case FunctionArgumentType.NOERROR:
        case FunctionArgumentType.ANY:
          ret = arg
          break
        case FunctionArgumentType.RANGE:
          if (arg instanceof CellError) {
            return arg
          }
          ret = coerceToRange(arg)
          break
        case FunctionArgumentType.COMPLEX:
          return this.arithmeticHelper.coerceScalarToComplex(getRawValue(arg))
      }
    }
    if (coercedType.passSubtype || ret === undefined) {
      return ret
    } else {
      return getRawValue(ret)
    }
  }

  /**
   * A method that should wrap the implementation logic for every built-in function and custom function. It:
   * - evaluates the function arguments
   * - validates the number of function arguments
   * - performs function vectorization if necessary
   * - performs argument broadcasting if necessary
   * - automatic coersions
   */
  protected runFunction = (
    args: Ast[],
    state: InterpreterState,
    metadata: FunctionMetadata,
    functionImplementation: (...arg: any) => InterpreterValue,
  ) => {
    const evaluatedArguments: [InterpreterValue, boolean][] = this.evaluateArguments(args, state, metadata)
    const argumentValues = evaluatedArguments.map(([value, _]) => value)
    const argumentIgnorableFlags = evaluatedArguments.map(([_, ignorable]) => ignorable)
    const argumentMetadata = this.buildMetadataForEachArgumentValue(argumentValues.length, metadata)
    const isVectorizationOn = state.arraysFlag && !metadata.vectorizationForbidden

    if (!this.isNumberOfArgumentValuesValid(argumentMetadata, argumentValues.length)) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }

    const [ maxHeight, maxWidth ] = isVectorizationOn ? this.calculateSizeOfVectorizedResultArray(argumentValues, argumentMetadata) : [ 1, 1 ]

    if (maxHeight === 1 && maxWidth === 1) {
      const vectorizedArguments = this.vectorizeAndBroadcastArgumentsIfNecessary(isVectorizationOn, argumentValues, argumentMetadata, 0, 0)
      return this.processSingleCell(state, vectorizedArguments, argumentMetadata, argumentIgnorableFlags, functionImplementation, metadata.returnNumberType)
    }

    const resultArray: InternalScalarValue[][] = [ ...Array(maxHeight).keys() ].map(row =>
      [ ...Array(maxWidth).keys() ].map(col => {
        const vectorizedArguments = this.vectorizeAndBroadcastArgumentsIfNecessary(isVectorizationOn, argumentValues, argumentMetadata, row, col)
        const result = this.processSingleCell(state, vectorizedArguments, argumentMetadata, argumentIgnorableFlags, functionImplementation, metadata.returnNumberType)

        if (result instanceof SimpleRangeValue) {
          throw 'Function returning array cannot be vectorized.' // TODO: test it
        }

        return result
      })
    )

    return SimpleRangeValue.onlyValues(resultArray)
  }

  private processSingleCell(
    state: InterpreterState,
    vectorizedArguments: Maybe<InterpreterValue>[],
    argumentMetadata: FunctionArgument[],
    argumentIgnorableFlags: boolean[],
    functionImplementation: (...arg: any) => InterpreterValue,
    returnNumberType: NumberType | undefined,
  ): InternalScalarValue | SimpleRangeValue {
    const coercedArguments: Maybe<InterpreterValue | complex | RawNoErrorScalarValue>[] = []

    // COERCION
    for (let i = 0; i < argumentMetadata.length; i++) {
      const argumentValue = vectorizedArguments[i]
      const arg = argumentValue ?? argumentMetadata[i]?.defaultValue
      if (arg === undefined) {
        coercedArguments.push(undefined)
      } else {
        // we coerce non-default values only
        const coercedArg = argumentValue !== undefined ? this.coerceToType(arg, argumentMetadata[i], state) : arg
        if (coercedArg !== undefined) {
          if (coercedArg instanceof CellError && argumentMetadata[i].argumentType !== FunctionArgumentType.SCALAR) {
            return coercedArg
          }
          coercedArguments.push(coercedArg)
        } else if (!argumentIgnorableFlags[i]) {
          return new CellError(ErrorType.VALUE, ErrorMessage.WrongType)
        }
      }
    }

    const functionCalculationResult = functionImplementation(...coercedArguments)
    return this.returnNumberWrapper(functionCalculationResult, returnNumberType)
  }

  private vectorizeAndBroadcastArgumentsIfNecessary(isVectorizationOn: boolean, argumentValues: InterpreterValue[], argumentMetadata: FunctionArgument[], row: number, col: number): Maybe<InterpreterValue>[] {
    return argumentValues.map((value, i) =>
      isVectorizationOn && this.isRangePassedAsAScalarArgument(value, argumentMetadata[i])
        ? this.vectorizeAndBroadcastRangeArgument(value, row, col)
        : value
    )
  }

  private vectorizeAndBroadcastRangeArgument(argumentValue: SimpleRangeValue, rowNum: number, colNum: number): Maybe<InterpreterValue> {
    const targetRowNum = argumentValue.height() === 1 ? 0 : rowNum
    const targetColNum = argumentValue.width() === 1 ? 0 : colNum

    return argumentValue.data[targetRowNum]?.[targetColNum]
  }

  protected evaluateArguments(args: Ast[], state: InterpreterState, metadata: FunctionMetadata): [InterpreterValue, boolean][] {
    return metadata.expandRanges ? this.listOfScalarValues(args, state) : args.map((ast) => [this.evaluateAst(ast, state), false])
  }

  protected buildMetadataForEachArgumentValue(numberOfArgumentValuesPassed: number, metadata: FunctionMetadata): FunctionArgument[] {
    const argumentsMetadata: FunctionArgument[] = metadata.parameters ? [ ...metadata.parameters ] : []
    const isRepeatLastArgsValid = metadata.repeatLastArgs !== undefined && Number.isInteger(metadata.repeatLastArgs) && metadata.repeatLastArgs > 0

    if (isRepeatLastArgsValid) {
      while (numberOfArgumentValuesPassed > argumentsMetadata.length) {
        argumentsMetadata.push(...argumentsMetadata.slice(argumentsMetadata.length - metadata.repeatLastArgs!))
      }
    }

    return argumentsMetadata
  }

  protected isNumberOfArgumentValuesValid(argumentsMetadata: FunctionArgument[], numberOfArgumentValuesPassed: number): boolean {
    if (numberOfArgumentValuesPassed > argumentsMetadata.length) {
      return false
    }

    if (numberOfArgumentValuesPassed < argumentsMetadata.length) {
      const metadataForMissingArguments = argumentsMetadata.slice(numberOfArgumentValuesPassed)
      const areMissingArgumentsOptional = metadataForMissingArguments.every(argMetadata => argMetadata?.optionalArg || argMetadata?.defaultValue !== undefined)
      return areMissingArgumentsOptional
    }

    return true
  }

  protected calculateSizeOfVectorizedResultArray(argumentValues: InterpreterValue[], argumentMetadata: FunctionArgument[]): [ number, number ] {
    const argumentsThatRequireVectorization = argumentValues
      .filter((value, i) => this.isRangePassedAsAScalarArgument(value, argumentMetadata[i])) as SimpleRangeValue[]

    const height = Math.max(1, ...argumentsThatRequireVectorization.map(val => val.height()))
    const width = Math.max(1, ...argumentsThatRequireVectorization.map(val => val.width()))

    return [ height, width ]
  }

  protected isRangePassedAsAScalarArgument(argumentValue: Maybe<InterpreterValue>, argumentMetadata: Maybe<FunctionArgument>): argumentValue is SimpleRangeValue {
    if (argumentValue == null || argumentMetadata == null) {
      return false
    }

    return argumentValue instanceof SimpleRangeValue
      && ![ FunctionArgumentType.RANGE, FunctionArgumentType.ANY ].includes(argumentMetadata.argumentType)
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    state: InterpreterState,
    metadata: FunctionMetadata,
    noArgCallback: () => InternalScalarValue,
    referenceCallback: (reference: SimpleCellAddress) => InternalScalarValue,
    nonReferenceCallback: (...arg: any) => InternalScalarValue = () => new CellError(ErrorType.NA, ErrorMessage.CellRefExpected)
  ) => {
    if (args.length === 0) {
      return this.returnNumberWrapper(noArgCallback(), metadata.returnNumberType)
    } else if (args.length > 1) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    let arg = args[0]

    while (arg.type === AstNodeType.PARENTHESIS) {
      arg = arg.expression
    }

    let cellReference: Maybe<SimpleCellAddress>

    if (arg.type === AstNodeType.CELL_REFERENCE) {
      cellReference = arg.reference.toSimpleCellAddress(state.formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, state.formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF, ErrorMessage.CellRefExpected)
      }
    }

    if (cellReference !== undefined) {
      return this.returnNumberWrapper(referenceCallback(cellReference), metadata.returnNumberType)
    }

    return this.runFunction(args, state, metadata, nonReferenceCallback)
  }

  protected metadata(name: string): FunctionMetadata {
    const params = (this.constructor as FunctionPluginDefinition).implementedFunctions[name]
    if (params !== undefined) {
      return params
    }
    throw new Error(`No metadata for function ${name}.`)
  }

  private returnNumberWrapper<T>(val: T | ExtendedNumber, type?: NumberType, format?: FormatInfo): T | ExtendedNumber {
    if (type !== undefined && isExtendedNumber(val)) {
      return this.arithmeticHelper.ExtendedNumberFactory(getRawValue(val), {type, format})
    } else {
      return val
    }
  }
}

