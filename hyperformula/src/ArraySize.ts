/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {InterpreterState} from './interpreter/InterpreterState'
import {FunctionArgument, FunctionArgumentType, FunctionMetadata} from './interpreter'
import {FunctionCallLicenseGate} from './license/FunctionCallLicenseGate'
import {Maybe} from './Maybe'
import {Ast, AstNodeType, ProcedureAst} from './parser'

export class ArraySize {
  constructor(
    public width: number,
    public height: number,
    public isRef: boolean = false,
  ) {}

  public static error() {
    return new ArraySize(1, 1, true)
  }

  public static scalar() {
    return new ArraySize(1, 1, false)
  }

  isScalar(): boolean {
    return (this.width === 1 && this.height === 1) || this.isRef
  }
}

function arraySizeForBinaryOp(leftArraySize: ArraySize, rightArraySize: ArraySize): ArraySize {
  return new ArraySize(Math.max(leftArraySize.width, rightArraySize.width), Math.max(leftArraySize.height, rightArraySize.height))
}

function arraySizeForUnaryOp(arraySize: ArraySize): ArraySize {
  return new ArraySize(arraySize.width, arraySize.height)
}

export class ArraySizePredictor {
  private readonly functionCallLicenseGate: FunctionCallLicenseGate

  constructor(
    private config: Config,
    private functionRegistry: FunctionRegistry,
  ) {
    this.functionCallLicenseGate = new FunctionCallLicenseGate(config, functionRegistry)
  }

  public checkArraySize(ast: Ast, formulaAddress: SimpleCellAddress): ArraySize {
    return this.checkArraySizeForAst(ast, {formulaAddress, arraysFlag: this.config.useArrayArithmetic})
  }

  public checkArraySizeForAst(ast: Ast, state: InterpreterState): ArraySize {
    switch (ast.type) {
      case AstNodeType.FUNCTION_CALL: {
        return this.checkArraySizeForFunction(ast, state)
      }
      case AstNodeType.COLUMN_RANGE:
      case AstNodeType.ROW_RANGE:
      case AstNodeType.CELL_RANGE: {
        const range = AbsoluteCellRange.fromAstOrUndef(ast, state.formulaAddress)
        if (range === undefined) {
          return ArraySize.error()
        } else {
          return new ArraySize(range.width(), range.height(), true)
        }
      }
      case AstNodeType.ARRAY: {
        const heights = []
        const widths = []
        for (const row of ast.args) {
          const sizes = row.map(ast => this.checkArraySizeForAst(ast, state))
          const h = Math.min(...sizes.map(size => size.height))
          const w = sizes.reduce((total, size) => total + size.width, 0)
          heights.push(h)
          widths.push(w)
        }
        const height = heights.reduce((total, h) => total + h, 0)
        const width = Math.min(...widths)
        return new ArraySize(width, height)
      }
      case AstNodeType.STRING:
      case AstNodeType.NUMBER:
        return ArraySize.scalar()
      case AstNodeType.CELL_REFERENCE:
        return new ArraySize(1, 1, true)
      case AstNodeType.DIV_OP:
      case AstNodeType.CONCATENATE_OP:
      case AstNodeType.EQUALS_OP:
      case AstNodeType.GREATER_THAN_OP:
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
      case AstNodeType.LESS_THAN_OP:
      case AstNodeType.LESS_THAN_OR_EQUAL_OP:
      case AstNodeType.MINUS_OP:
      case AstNodeType.NOT_EQUAL_OP:
      case AstNodeType.PLUS_OP:
      case AstNodeType.POWER_OP:
      case AstNodeType.TIMES_OP: {
        const left = this.checkArraySizeForAst(ast.left, state)
        const right = this.checkArraySizeForAst(ast.right, state)
        if (!state.arraysFlag && (left.height > 1 || left.width > 1 || right.height > 1 || right.width > 1)) {
          return ArraySize.error()
        }
        return arraySizeForBinaryOp(left, right)
      }
      case AstNodeType.MINUS_UNARY_OP:
      case AstNodeType.PLUS_UNARY_OP:
      case AstNodeType.PERCENT_OP: {
        const val = this.checkArraySizeForAst(ast.value, state)
        if (!state.arraysFlag && (val.height > 1 || val.width > 1)) {
          return ArraySize.error()
        }
        return arraySizeForUnaryOp(val)
      }
      case AstNodeType.PARENTHESIS: {
        return this.checkArraySizeForAst(ast.expression, state)
      }
      case AstNodeType.EMPTY:
        return ArraySize.error()
      default:
        return ArraySize.error()
    }
  }

  /**
   * Says whether the size predicted for `ast` by {@link checkArraySizeForAst} is the size of its value, so that a result
   * area can be reserved from it. It is not when the size is computed from a named expression, which is sized as one cell
   * while its value can be a range of any size and can be redefined after the formula is placed, or from a function call
   * whose own size method returns `ArraySize.error()`, such as `SEQUENCE(A1)`, whose result size depends on cell values.
   * Arguments that do not determine the size of a call, such as the ranges `SUM` adds up, are not checked.
   *
   * @param ast - the AST whose size is predicted
   * @param state - the state its size is predicted in
   */
  public isSizeKnownBeforeEvaluation(ast: Ast, state: InterpreterState): boolean {
    switch (ast.type) {
      case AstNodeType.NAMED_EXPRESSION:
        return false
      case AstNodeType.FUNCTION_CALL:
        return this.isFunctionSizeKnownBeforeEvaluation(ast, state)
      case AstNodeType.ARRAY:
        return ast.args.every(row => row.every(arg => this.isSizeKnownBeforeEvaluation(arg, state)))
      case AstNodeType.DIV_OP:
      case AstNodeType.CONCATENATE_OP:
      case AstNodeType.EQUALS_OP:
      case AstNodeType.GREATER_THAN_OP:
      case AstNodeType.GREATER_THAN_OR_EQUAL_OP:
      case AstNodeType.LESS_THAN_OP:
      case AstNodeType.LESS_THAN_OR_EQUAL_OP:
      case AstNodeType.MINUS_OP:
      case AstNodeType.NOT_EQUAL_OP:
      case AstNodeType.PLUS_OP:
      case AstNodeType.POWER_OP:
      case AstNodeType.TIMES_OP:
        return this.isSizeKnownBeforeEvaluation(ast.left, state) && this.isSizeKnownBeforeEvaluation(ast.right, state)
      case AstNodeType.MINUS_UNARY_OP:
      case AstNodeType.PLUS_UNARY_OP:
      case AstNodeType.PERCENT_OP:
        return this.isSizeKnownBeforeEvaluation(ast.value, state)
      case AstNodeType.PARENTHESIS:
        return this.isSizeKnownBeforeEvaluation(ast.expression, state)
      default:
        return true
    }
  }

  /**
   * Returns the definition of each argument of a call with `numberOfArguments` arguments, repeating the last
   * `repeatLastArgs` parameters, or undefined when that many arguments do not fit the parameters.
   */
  private static argumentDefinitions(metadata: FunctionMetadata, numberOfArguments: number): Maybe<FunctionArgument[]> {
    const argumentDefinitions = [...(metadata.parameters ?? [])]

    if (
      metadata.repeatLastArgs !== undefined
      && argumentDefinitions.length < numberOfArguments
      && (numberOfArguments - argumentDefinitions.length) % metadata.repeatLastArgs !== 0
    ) {
      return undefined
    }

    while (argumentDefinitions.length < numberOfArguments) {
      if (metadata.repeatLastArgs === undefined) {
        return undefined
      }

      argumentDefinitions.push(...argumentDefinitions.slice(argumentDefinitions.length - metadata.repeatLastArgs))
    }

    return argumentDefinitions
  }

  /**
   * Says whether the size predicted for a function call is the size of its value, following the branches of
   * {@link checkArraySizeForFunction}: a call sized by its own size method depends on that method and on every
   * argument, a call sized from its arguments depends on the arguments that are neither RANGE nor ANY, and any
   * other call is one cell.
   */
  private isFunctionSizeKnownBeforeEvaluation(ast: ProcedureAst, state: InterpreterState): boolean {
    if (this.functionCallLicenseGate.stopsCall(ast.procedureName)) {
      return true
    }

    const metadata = this.functionRegistry.getMetadata(ast.procedureName)
    const argumentState = new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))

    if (this.functionRegistry.getArraySizeFunction(ast.procedureName) !== undefined) {
      const size = this.checkArraySizeForFunction(ast, state)
      const isSizedAsError = size.isRef && size.width === 1 && size.height === 1
      return !isSizedAsError && ast.args.every(arg => this.isSizeKnownBeforeEvaluation(arg, argumentState))
    }

    if (
      metadata === undefined
      || metadata.expandRanges
      || !state.arraysFlag
      || metadata.vectorizationForbidden
      || metadata.parameters === undefined
    ) {
      return true
    }

    const argumentDefinitions = ArraySizePredictor.argumentDefinitions(metadata, ast.args.length)
    if (argumentDefinitions === undefined) {
      return true
    }

    return ast.args.every((arg, i) =>
      argumentDefinitions[i].argumentType === FunctionArgumentType.RANGE
      || argumentDefinitions[i].argumentType === FunctionArgumentType.ANY
      || this.isSizeKnownBeforeEvaluation(arg, argumentState))
  }

  private checkArraySizeForFunction(ast: ProcedureAst, state: InterpreterState): ArraySize {
    // A call the license stops evaluates to a single #LIC! error. Sized as one cell, it reserves
    // no spill range, so a non-empty cell below it cannot turn that error into #SPILL!.
    if (this.functionCallLicenseGate.stopsCall(ast.procedureName)) {
      return ArraySize.scalar()
    }

    const pluginArraySizeFunction = this.functionRegistry.getArraySizeFunction(ast.procedureName)

    if (pluginArraySizeFunction !== undefined) {
      return pluginArraySizeFunction(ast, state)
    }

    const metadata = this.functionRegistry.getMetadata(ast.procedureName)

    if (
      metadata === undefined
      || metadata.expandRanges
      || !state.arraysFlag
      || metadata.vectorizationForbidden
      || metadata.parameters === undefined
    ) {
      return new ArraySize(1, 1)
    }

    const subChecks = ast.args.map((arg) => this.checkArraySizeForAst(arg, new InterpreterState(state.formulaAddress, state.arraysFlag || (metadata?.enableArrayArithmeticForArguments ?? false))))
    const argumentDefinitions = ArraySizePredictor.argumentDefinitions(metadata, subChecks.length)

    if (argumentDefinitions === undefined) {
      return ArraySize.error()
    }

    let maxWidth = 1
    let maxHeight = 1

    for (let i = 0; i < subChecks.length; i++) {
      if (argumentDefinitions[i].argumentType !== FunctionArgumentType.RANGE && argumentDefinitions[i].argumentType !== FunctionArgumentType.ANY) {
        maxHeight = Math.max(maxHeight, subChecks[i].height)
        maxWidth = Math.max(maxWidth, subChecks[i].width)
      }
    }

    return new ArraySize(maxWidth, maxHeight)
  }
}
