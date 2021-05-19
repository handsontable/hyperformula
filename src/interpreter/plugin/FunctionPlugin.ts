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
import {
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

  /**
   * Some function do not allow vectorization: array-output, and special functions.
   */
  vectorizationForbidden?: boolean,
}

export interface FunctionMetadata extends FunctionArguments {
  method: string,
  isVolatile?: boolean,
  isDependentOnSheetStructureChange?: boolean,
  doesNotNeedArgumentsToBeComputed?: boolean,
  arrayFunction?: boolean,
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

export type PluginFunctionType = (ast: ProcedureAst, state: InterpreterState) => InterpreterValue

export type FunctionPluginTypecheck<T> = {
  [K in keyof T]: T[K] extends PluginFunctionType ? T[K] : never
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

  protected evaluateAst(ast: Ast, state: InterpreterState): InterpreterValue {
    return this.interpreter.evaluateAst(ast, state)
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

  protected coerceScalarToNumberOrError = (arg: InternalScalarValue): ExtendedNumber | CellError => this.interpreter.arithmeticHelper.coerceScalarToNumberOrError(arg)

  protected coerceToType(arg: InterpreterValue, coercedType: FunctionArgument, state: InterpreterState): Maybe<InterpreterValue | complex | RawNoErrorScalarValue> {
    let ret
    if (arg instanceof SimpleRangeValue) {
      switch(coercedType.argumentType) {
        case ArgumentTypes.RANGE:
        case ArgumentTypes.ANY:
          ret = arg
          break
        default: {
          const coerce = coerceRangeToScalar(arg, state)
          if(coerce === undefined) {
            return undefined
          }
          arg = coerce
        }
      }
    }
    if(!(arg instanceof SimpleRangeValue)) {
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
    state: InterpreterState,
    functionDefinition: FunctionArguments,
    fn: (...arg: any) => InterpreterValue,
  ) => {
    let argumentDefinitions: FunctionArgument[] = functionDefinition.parameters!
    let argValues: [InterpreterValue, boolean][]

    if (functionDefinition.expandRanges) {
      argValues = this.listOfScalarValues(args, state)
    } else {
      argValues = args.map((ast) => [this.evaluateAst(ast, state), false])
    }


    if (functionDefinition.repeatLastArgs === undefined && argumentDefinitions.length < argValues.length) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    if (functionDefinition.repeatLastArgs !== undefined && argumentDefinitions.length < argValues.length &&
      (argValues.length - argumentDefinitions.length) % functionDefinition.repeatLastArgs !== 0) {
      return new CellError(ErrorType.NA, ErrorMessage.WrongArgNumber)
    }
    argumentDefinitions = [...argumentDefinitions]
    while(argumentDefinitions.length < argValues.length) {
      argumentDefinitions.push(...argumentDefinitions.slice(argumentDefinitions.length-functionDefinition.repeatLastArgs!))
    }

    let maxWidth = 1
    let maxHeight = 1
    if(!functionDefinition.vectorizationForbidden && state.arraysFlag) {
      for(let i=0;i<argValues.length;i++) {
      const [val] = argValues[i]
      if(val instanceof SimpleRangeValue && argumentDefinitions[i].argumentType !== ArgumentTypes.RANGE && argumentDefinitions[i].argumentType !== ArgumentTypes.ANY) {
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

    const retArr: InternalScalarValue[][] = []
    for(let row = 0; row<maxHeight; row++) {
      const rowArr: InternalScalarValue[] = []
      for(let col = 0; col<maxWidth; col++) {
        let argCoerceFailure: Maybe<CellError> = undefined
        const coercedArguments: Maybe<InterpreterValue | complex | RawNoErrorScalarValue>[] = []
        for (let i = 0; i < argumentDefinitions.length; i++) {
          // eslint-disable-next-line prefer-const
          let [val, ignorable] = argValues[i] ?? [undefined, undefined]
          if(val instanceof SimpleRangeValue && argumentDefinitions[i].argumentType !== ArgumentTypes.RANGE && argumentDefinitions[i].argumentType !== ArgumentTypes.ANY) {
            if(!functionDefinition.vectorizationForbidden && state.arraysFlag) {
              val = val.data[val.height()!==1 ? row : 0]?.[val.width()!==1 ? col : 0]
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

        const ret = argCoerceFailure ?? this.returnNumberWrapper(fn(...coercedArguments), functionDefinition.returnNumberType)
        if(maxHeight === 1 && maxWidth === 1) {
          return ret
        }
        if(ret instanceof SimpleRangeValue) {
          throw 'Function returning array cannot be vectorized.'
        }
        rowArr.push(ret)
      }
      retArr.push(rowArr)
    }
    return SimpleRangeValue.onlyValues(retArr)
  }

  protected runFunctionWithReferenceArgument = (
    args: Ast[],
    state: InterpreterState,
    argumentDefinitions: FunctionArguments,
    noArgCallback: () => InternalScalarValue,
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
      cellReference = arg.reference.toSimpleCellAddress(state.formulaAddress)
    } else if (arg.type === AstNodeType.CELL_RANGE || arg.type === AstNodeType.COLUMN_RANGE || arg.type === AstNodeType.ROW_RANGE) {
      try {
        cellReference = AbsoluteCellRange.fromAst(arg, state.formulaAddress).start
      } catch (e) {
        return new CellError(ErrorType.REF, ErrorMessage.CellRefExpected)
      }
    }

    if (cellReference !== undefined) {
      return this.returnNumberWrapper(referenceCallback(cellReference), argumentDefinitions.returnNumberType)
    }

    return this.runFunction(args, state, argumentDefinitions, nonReferenceCallback)
  }

  protected metadata(name: string): FunctionMetadata {
    const params = (this.constructor as FunctionPluginDefinition).implementedFunctions[name]
    if (params !== undefined) {
      return params
    }
    throw new Error(`No metadata for function ${name}.`)
  }

  private returnNumberWrapper<T>(val: T | ExtendedNumber, type?: NumberType, format?: FormatInfo): T | ExtendedNumber {
    if(type !== undefined && isExtendedNumber(val)) {
      return this.interpreter.arithmeticHelper.ExtendedNumberFactory(getRawValue(val), {type, format})
    } else {
      return val
    }
  }
}

