/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {Maybe} from '../../Maybe'
import {Ast, ProcedureAst} from '../../parser'

/**
 * For a call to `IF`, `IFS`, `SWITCH`, `CHOOSE` or `XLOOKUP`, the argument that its last evaluation returned. A
 * call that returned none of its arguments, such as one whose selector is an error or out of range, one where no
 * condition, case or lookup value matched and no fallback was given, one that returned the default value of an
 * omitted argument, or one that built an array cell by cell from different arguments, has no entry. An `XLOOKUP`
 * with an array of lookup values keeps the entry for `if_not_found` when every lookup returned it.
 */
const selectedArguments = new WeakMap<ProcedureAst, Ast>()

/**
 * Returns the argument that the call to `IF`, `IFS`, `SWITCH`, `CHOOSE` or `XLOOKUP` returned when it was last
 * evaluated, so that a function that has just evaluated the call can tell whether its result is the content of a
 * referenced cell.
 *
 * @param {ProcedureAst} ast - a call to one of these functions, evaluated by its built-in plugin
 * @returns {Maybe<Ast>} the returned argument, or `undefined` when the call returned none of its arguments
 */
export function selectedArgument(ast: ProcedureAst): Maybe<Ast> {
  return selectedArguments.get(ast)
}

/**
 * Removes the record of a call, before it is evaluated again or when its result comes from none of its arguments.
 *
 * @param {ProcedureAst} ast - the call
 */
export function forgetSelectedArgument(ast: ProcedureAst): void {
  selectedArguments.delete(ast)
}

/**
 * Records that a call returned its argument at the given position.
 *
 * @param {ProcedureAst} ast - the call
 * @param {number} position - the position of the returned argument in `ast.args`
 */
export function recordSelectedArgument(ast: ProcedureAst, position: number): void {
  const argument = ast.args[position]
  if (argument === undefined) {
    selectedArguments.delete(ast)
  } else {
    selectedArguments.set(ast, argument)
  }
}
