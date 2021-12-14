/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../../AbsoluteCellRange'
import {ArraySize, ArraySizePredictor} from '../../ArraySize'
import {CellError, ErrorType, SimpleCellAddress} from '../../Cell'
import {CellContent, CellContentParser} from '../../CellContentParser'
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
  AsyncInterpreterValue,
  ExtendedNumber,
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
   * Internal.
   *
   * Infers the return type automatically based on the content.
   */
  inferReturnType?: boolean,

  /**
   * Engine.
   */
  method: string,
  /**
   * Engine.
   *
   * If set to `true`, the function will be checked for an array size.
   */
  arraySizeMethod?: string,
  /**
   * Engine.
   * 
   * If set to `true`, the function will be treated as an async method.
   */
  isAsyncMethod?: boolean,
  /**
   * Engine.
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

  new(interpreter: Interpreter, cellContentParser: CellContentParser): FunctionPlugin,
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
export type AsyncPluginFunctionType = (ast: ProcedureAst, state: InterpreterState) => AsyncInterpreterValue
export type PluginArraySizeFunctionType = (ast: ProcedureAst, state: InterpreterState) => ArraySize

export type FunctionPluginTypecheck<T> = {
  [K in keyof T]: T[K] extends PluginFunctionType | PluginArraySizeFunctionType | AsyncPluginFunctionType ? T[K] : never
}

interface ArgCoercion {
  argCoerceFailure: Maybe<CellError>,
  coercedArguments: Maybe<InterpreterValue | complex | RawNoErrorScalarValue>[],
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
  protected readonly cellContentParser: CellContentParser
  protected readonly dependencyGraph: DependencyGraph
  protected readonly columnSearch: SearchStrategy
  protected readonly config: Config
  protected readonly serialization: Serialization
  protected readonly arraySizePredictor: ArraySizePredictor
  protected readonly dateTimeHelper: DateTimeHelper
  protected readonly arithmeticHelper: ArithmeticHelper

  constructor(interpreter: Interpreter, cellContentParser: CellContentParser) {
    this.interpreter = interpreter
    this.cellContentParser = cellContentParser
    this.dependencyGraph = interpreter.dependencyGraph
    this.columnSearch = interpreter.columnSearch
    this.config = interpreter.config
    this.serialization = interpreter.serialization
    this.arraySizePredictor = interpreter.arraySizePredictor
    this.dateTimeHelper = interpreter.dateTimeHelper
    this.arithmeticHelper = interpreter.arithmeticHelper
  }

  protected evaluateAst(ast: Ast, state: InterpreterState): InterpreterValue {
    return this.interpreter.evaluateAst(ast, state)[0]
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
        case ArgumentTypes.RANGE:
        case ArgumentTypes.ANY:
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
          ret = coerceToRange(arg)
          break
        case ArgumentTypes.COMPLEX:
          return this.arithmeticHelper.coerceScalarToComplex(getRawValue(arg))
      }
    }
    if (coercedType.passSubtype || ret === undefined) {
      return ret
    } else {
      return getRawValue(ret)
    }
  }

  protected runAsyncFunction = async(
    args: Ast[],
    state: InterpreterState,
    metadata: FunctionMetadata,
    fn: (...arg: any) => Promise<InterpreterValue>,
  ) => {
    const coercedArgs = this.getValidatedArgs(args, state, metadata)

    if (coercedArgs instanceof CellError) return coercedArgs

    const { maxWidth, maxHeight, retArr } = coercedArgs

    const valuesArray: InternalScalarValue[][] = []
    const allPromises: Promise<InterpreterValue[]>[] = []
    
    retArr.forEach((row) => {
      const rowPromise = new Promise<InterpreterValue[]>((resolve, reject) => {
        const promises: Promise<InterpreterValue>[] = []

        row.forEach(({ argCoerceFailure, coercedArguments }) => {
          if (argCoerceFailure === undefined) {
            promises.push(fn(...coercedArguments))
          }
        })

        Promise.all(promises).then(resolve).catch(reject)
      })

      allPromises.push(rowPromise)
    })

    const intepreterValues = await Promise.all(allPromises)

    for (const row of intepreterValues) {
      const rowArr: InternalScalarValue[] = []

      for (const value of row) {
        const ret = this.returnNumberWrapper(value, metadata)
    
        if (maxHeight === 1 && maxWidth === 1) {
          return ret
        }

        if (ret instanceof SimpleRangeValue) {
          throw 'Function returning array cannot be vectorized.'
        }

        rowArr.push(ret)
      }
      valuesArray.push(rowArr)
    }

    return SimpleRangeValue.onlyValues(valuesArray)
  }

  protected runFunction = (
    args: Ast[],
    state: InterpreterState,
    metadata: FunctionMetadata,
    fn: (...arg: any) => InterpreterValue,
  ) => {
    const coercedArgs = this.getValidatedArgs(args, state, metadata)

    if (coercedArgs instanceof CellError) return coercedArgs

    const { maxWidth, maxHeight, retArr } = coercedArgs

    const valuesArray: InternalScalarValue[][] = []

    for (const row of retArr) {
      const rowArr: InternalScalarValue[] = []

      for (const { argCoerceFailure, coercedArguments } of row) {
        const ret = argCoerceFailure ?? this.returnNumberWrapper(fn(...coercedArguments), metadata)
    
        if (maxHeight === 1 && maxWidth === 1) {
          return ret
        }

        if (ret instanceof SimpleRangeValue) {
          throw 'Function returning array cannot be vectorized.'
        }

        rowArr.push(ret)
      }
      valuesArray.push(rowArr)
    }

    return SimpleRangeValue.onlyValues(valuesArray)
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
      return this.returnNumberWrapper(noArgCallback(), metadata)
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
      return this.returnNumberWrapper(referenceCallback(cellReference), metadata)
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

  private getValidatedArgs = (
    args: Ast[],
    state: InterpreterState,
    metadata: FunctionMetadata,
  ) => {
    let argumentDefinitions: FunctionArgument[] = metadata.parameters!
    let argValues: [InterpreterValue, boolean][]

    if (metadata.expandRanges) {
      argValues = this.listOfScalarValues(args, state)
    } else {
      argValues = args.map((ast) => [this.evaluateAst(ast, state), false])
    }

    if (metadata.repeatLastArgs === undefined && argumentDefinitions.length < argValues.length) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (metadata.repeatLastArgs !== undefined && argumentDefinitions.length < argValues.length &&
      (argValues.length - argumentDefinitions.length) % metadata.repeatLastArgs !== 0) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    argumentDefinitions = [...argumentDefinitions]
    while (argumentDefinitions.length < argValues.length) {
      argumentDefinitions.push(...argumentDefinitions.slice(argumentDefinitions.length - metadata.repeatLastArgs!))
    }

    let maxWidth = 1
    let maxHeight = 1
    if (!metadata.vectorizationForbidden && state.arraysFlag) {
      for (let i = 0; i < argValues.length; i++) {
        const [val] = argValues[i]
        if (val instanceof SimpleRangeValue && argumentDefinitions[i].argumentType !== ArgumentTypes.RANGE && argumentDefinitions[i].argumentType !== ArgumentTypes.ANY) {
          maxHeight = Math.max(maxHeight, val.height())
          maxWidth = Math.max(maxWidth, val.width())
        }
      }
    }

    for (let i = argValues.length; i < argumentDefinitions.length; i++) {
      if (argumentDefinitions[i]?.defaultValue === undefined) {
        if (!argumentDefinitions[i]?.optionalArg) {
          //not enough values passed as arguments, and there was no default value and argument was not optional
          return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
        }
      }
    }

    const retArr: ArgCoercion[][] = []
    for (let row = 0; row < maxHeight; row++) {
      const rowArr: ArgCoercion[] = []
      for (let col = 0; col < maxWidth; col++) {
        let argCoerceFailure: Maybe<CellError> = undefined
        const coercedArguments: Maybe<InterpreterValue | complex | RawNoErrorScalarValue>[] = []
        for (let i = 0; i < argumentDefinitions.length; i++) {
          // eslint-disable-next-line prefer-const
          let [val, ignorable] = argValues[i] ?? [undefined, undefined]
          if (val instanceof SimpleRangeValue && argumentDefinitions[i].argumentType !== ArgumentTypes.RANGE && argumentDefinitions[i].argumentType !== ArgumentTypes.ANY) {
            if (!metadata.vectorizationForbidden && state.arraysFlag) {
              val = val.data[val.height() !== 1 ? row : 0]?.[val.width() !== 1 ? col : 0]
            }
          }
          const arg = val ?? argumentDefinitions[i]?.defaultValue
          if (arg === undefined) {
            coercedArguments.push(undefined) //we verified in previous loop that this arg is optional
          } else {
            //we apply coerce only to non-default values
            const coercedArg = val !== undefined ? this.coerceToType(arg, argumentDefinitions[i], state) : arg
            if (coercedArg !== undefined) {
              if (coercedArg instanceof CellError && argumentDefinitions[i].argumentType !== ArgumentTypes.SCALAR) {
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

        rowArr.push({
          argCoerceFailure,
          coercedArguments
        })
      }
      retArr.push(rowArr)
    }

    return { maxWidth, maxHeight, retArr}
  }

  private returnNumberWrapper<T>(val: T | ExtendedNumber, metadata: FunctionMetadata): T | InterpreterValue | ExtendedNumber {
    const {inferReturnType, returnNumberType} = metadata
    
    if (returnNumberType !== undefined && isExtendedNumber(val)) {
      return this.arithmeticHelper.ExtendedNumberFactory(getRawValue(val), {type: returnNumberType})
    } else {
      if (inferReturnType) {
        if (val instanceof SimpleRangeValue) {
          const values = val.data.map((arr) => {
            return arr.map((value) => {
              return this.parseReturnVal(value)
            })
          })

          return SimpleRangeValue.onlyValues(values)
        }

        return this.parseReturnVal(val)
      }

      return val
    }
  }

  private parseReturnVal<T>(val: T | ExtendedNumber) {
    if (typeof val === 'string' || 
      typeof val === 'boolean' || 
      typeof val === 'number') {
      const parsedValue = this.cellContentParser.parse(val)
    
      if (parsedValue instanceof CellContent.Formula) {
        return parsedValue.formula
      }

      if (parsedValue instanceof CellContent.Empty) {
        return val
      }
    
      return parsedValue.value
    }

    return val
  }
}

