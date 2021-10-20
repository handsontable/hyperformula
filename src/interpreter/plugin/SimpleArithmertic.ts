/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {InterpreterValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class SimpleArithmerticPlugin extends FunctionPlugin implements FunctionPluginTypecheck<SimpleArithmerticPlugin> {
  public static implementedFunctions = {
    'HF.ADD': {
      method: 'add',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.CONCAT': {
      method: 'concat',
      parameters: [
        {argumentType: ArgumentTypes.STRING, passSubtype: true},
        {argumentType: ArgumentTypes.STRING, passSubtype: true},
      ],
    },
    'HF.DIVIDE': {
      method: 'divide',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.EQ': {
      method: 'eq',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.GT': {
      method: 'gt',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.GTE': {
      method: 'gte',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.LT': {
      method: 'lt',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.LTE': {
      method: 'lte',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.MINUS': {
      method: 'minus',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.MULTIPLY': {
      method: 'multiply',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.NE': {
      method: 'ne',
      parameters: [
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
        {argumentType: ArgumentTypes.NOERROR, passSubtype: true},
      ]
    },
    'HF.POW': {
      method: 'pow',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.UMINUS': {
      method: 'uminus',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.UNARY_PERCENT': {
      method: 'upercent',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
    'HF.UPLUS': {
      method: 'uplus',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, passSubtype: true},
      ],
    },
  }

  public add(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.ADD'),
      this.arithmeticHelper.addWithEpsilon
    )
  }

  public concat(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.CONCAT'),
      this.arithmeticHelper.concat
    )
  }

  public divide(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.DIVIDE'),
      this.arithmeticHelper.divide
    )
  }

  public eq(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.EQ'),
      this.arithmeticHelper.eq
    )
  }

  public gt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.GT'),
      this.arithmeticHelper.gt
    )
  }

  public gte(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.GTE'),
      this.arithmeticHelper.geq
    )
  }

  public lt(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.LT'),
      this.arithmeticHelper.lt
    )
  }

  public lte(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.LTE'),
      this.arithmeticHelper.leq
    )
  }

  public minus(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.MINUS'),
      this.arithmeticHelper.subtract
    )
  }

  public multiply(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.MULTIPLY'),
      this.arithmeticHelper.multiply
    )
  }

  public ne(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.NE'),
      this.arithmeticHelper.neq
    )
  }

  public pow(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.POW'),
      this.arithmeticHelper.pow
    )
  }

  public uminus(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.UMINUS'),
      this.arithmeticHelper.unaryMinus
    )
  }

  public upercent(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.UNARY_PERCENT'),
      this.arithmeticHelper.unaryPercent
    )
  }

  public uplus(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('HF.UPLUS'),
      this.arithmeticHelper.unaryPlus
    )
  }
}
