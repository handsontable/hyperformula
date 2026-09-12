/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {SimpleCellAddress} from './Cell'
import {Config} from './Config'
import {DependencyGraph} from './DependencyGraph'
import {FunctionRegistry} from './interpreter/FunctionRegistry'
import {InterpreterState} from './interpreter/InterpreterState'
import {FunctionArgumentType} from './interpreter'
import {InternalNamedExpression} from './NamedExpressions'
import {Ast, AstNodeType, NamedExpressionAst, ProcedureAst} from './parser'

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
  /**
   * Named expressions whose size is currently being predicted.
   *
   * Names may refer to one another, and a cycle of such references would make the prediction
   * recurse until the stack overflows. A name already on this set is treated as unpredictable,
   * which leaves the referring cell a scalar formula and lets the evaluator report the cycle.
   */
  private readonly namedExpressionsBeingPredicted = new Set<InternalNamedExpression>()

  constructor(
    private config: Config,
    private functionRegistry: FunctionRegistry,
    private dependencyGraph: DependencyGraph,
  ) {
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
      case AstNodeType.NAMED_EXPRESSION:
        return this.checkArraySizeForNamedExpression(ast, state)
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
   * Predicts the size of a named expression referred to by a formula.
   *
   * A name stands for an expression, so its size is the size of that expression, the `isRef`
   * flag included: a name bound to a range predicts like the range literal it stands for, and a
   * name bound to an array-returning formula predicts like that formula. Without this, every
   * named expression was predicted as a scalar, the referring cell was never turned into an
   * array vertex, and an array-shaped result reached the exporter, which rejects it as a
   * `#VALUE!` error.
   *
   * The prediction deliberately uses the engine's own array-arithmetic setting instead of the
   * calling state's: the named expression has a cell of its own, and the evaluator always
   * computes that cell with `Config.useArrayArithmetic`, no matter where the name is used.
   * Inheriting the caller's flag would predict a shape the named expression never produces -
   * for example a range-arithmetic name is a scalar error under the default configuration even
   * when the name appears inside an array function.
   */
  private checkArraySizeForNamedExpression(ast: NamedExpressionAst, state: InterpreterState): ArraySize {
    const namedExpression = this.dependencyGraph.namedExpressions.nearestNamedExpression(ast.expressionName, state.formulaAddress.sheet)

    if (namedExpression === undefined || this.namedExpressionsBeingPredicted.has(namedExpression)) {
      return ArraySize.error()
    }

    const expression = this.dependencyGraph.getFormulaAst(namedExpression.address)

    if (expression === undefined) {
      return ArraySize.scalar()
    }

    this.namedExpressionsBeingPredicted.add(namedExpression)

    try {
      const size = this.checkArraySize(expression, namedExpression.address)
      return new ArraySize(size.width, size.height, size.isRef)
    } finally {
      this.namedExpressionsBeingPredicted.delete(namedExpression)
    }
  }

  private checkArraySizeForFunction(ast: ProcedureAst, state: InterpreterState): ArraySize {
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
    const argumentDefinitions = [...metadata.parameters]

    if (
      metadata.repeatLastArgs !== undefined
      && argumentDefinitions.length < subChecks.length
      && (subChecks.length - argumentDefinitions.length) % metadata.repeatLastArgs !== 0
    ) {
      return ArraySize.error()
    }

    while (argumentDefinitions.length < subChecks.length) {
      if (metadata.repeatLastArgs === undefined) {
        return ArraySize.error()
      }

      argumentDefinitions.push(...argumentDefinitions.slice(argumentDefinitions.length - metadata.repeatLastArgs))
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
