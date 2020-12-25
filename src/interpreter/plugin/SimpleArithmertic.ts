/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {InternalScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class SimpleArithmerticPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'HF.ADD': {
      method: 'add',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.CONCAT' : {
      method: 'concat',
      parameters: [
        { argumentType: ArgumentTypes.STRING, passSubtype: true },
        { argumentType: ArgumentTypes.STRING, passSubtype: true },
      ],
    },
    'HF.DIVIDE': {
      method: 'divide',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.EQ': {
      method: 'eq',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.GT': {
      method: 'gt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.GTE': {
      method: 'gte',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.LT': {
      method: 'lt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.LTE': {
      method: 'lte',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.MINUS': {
      method: 'minus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.MULTIPLY': {
      method: 'multiply',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.NE': {
      method: 'ne',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
        { argumentType: ArgumentTypes.NOERROR, passSubtype: true },
      ]
    },
    'HF.POW': {
      method: 'pow',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.UMINUS': {
      method: 'uminus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.UNARY_PERCENT': {
      method: 'upercent',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
    'HF.UPLUS': {
      method: 'uplus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, passSubtype: true },
      ],
    },
  }

  public add(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.ADD'),
      this.interpreter.arithmeticHelper.addWithEpsilon
    )
  }

  public concat(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.CONCAT'),
      this.interpreter.arithmeticHelper.concat
    )
  }

  public divide(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.DIVIDE'),
      this.interpreter.arithmeticHelper.divide
    )
  }

  public eq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.EQ'),
        this.interpreter.arithmeticHelper.eq
    )
  }

  public gt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.GT'),
        this.interpreter.arithmeticHelper.gt
    )
  }

  public gte(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.GTE'),
        this.interpreter.arithmeticHelper.geq
    )
  }

  public lt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.LT'),
        this.interpreter.arithmeticHelper.lt
    )
  }

  public lte(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.LTE'),
        this.interpreter.arithmeticHelper.leq
    )
  }

  public minus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.MINUS'),
      this.interpreter.arithmeticHelper.subtract
    )
  }

  public multiply(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.MULTIPLY'),
      this.interpreter.arithmeticHelper.multiply
    )
  }

  public ne(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.NE'),
      this.interpreter.arithmeticHelper.neq
    )
  }

  public pow(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.POW'),
      this.interpreter.arithmeticHelper.pow
    )
  }

  public uminus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UMINUS'),
      this.interpreter.arithmeticHelper.unaryMinus
    )
  }

  public upercent(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UNARY_PERCENT'),
      this.interpreter.arithmeticHelper.unaryPercent
    )
  }

  public uplus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UPLUS'),
      this.interpreter.arithmeticHelper.unaryPlus
    )
  }
}
