/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalNoErrorCellValue, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {divide} from '../ArithmeticHelper'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class SimpleArithmerticPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'HF.ADD': {
      method: 'add',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.CONCAT' : {
      method: 'concat',
      parameters: [
        { argumentType: ArgumentTypes.STRING },
        { argumentType: ArgumentTypes.STRING },
      ],
    },
    'HF.DIVIDE': {
      method: 'divide',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.EQ': {
      method: 'eq',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.GT': {
      method: 'gt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.GTE': {
      method: 'gte',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.LT': {
      method: 'lt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.LTE': {
      method: 'lte',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.MINUS': {
      method: 'minus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.MULTIPLY': {
      method: 'multiply',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.NE': {
      method: 'ne',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'HF.POW': {
      method: 'pow',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.UMINUS': {
      method: 'uminus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.UNARY_PERCENT': {
      method: 'unary_percent',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'HF.UPLUS': {
      method: 'uplus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public add(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.ADD'),
      (a: number, b: number) => this.interpreter.arithmeticHelper.addWithEpsilon(a, b)
      )
  }

  public concat(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.CONCAT'),
      (a: string, b: string) => a.concat(b)
    )
  }

  public divide(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.DIVIDE'),
      divide
    )
  }

  public eq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.EQ'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) === 0
      )
    )
  }

  public gt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.GT'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) > 0
      )
    )
  }

  public gte(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.GTE'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) >= 0
      )
    )
  }

  public lt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.LT'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) < 0
      )
    )
  }

  public lte(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.LTE'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) <= 0
      )
    )
  }

  public minus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.MINUS'),
      (a: number, b: number) => this.interpreter.arithmeticHelper.subtract(a, b)
    )
  }

  public multiply(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.MULTIPLY'),
      (a: number, b: number) => a*b
    )
  }

  public ne(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.NE'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) !== 0
      )
    )
  }

  public pow(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.POW'), Math.pow)
  }

  public uminus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UMINUS'),
      (a => -a)
    )
  }

  //eslint-disable-next-line @typescript-eslint/camelcase
  public unary_percent(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UNARY_PERCENT'),
      (a => a/100)
    )
  }

  public uplus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HF.UPLUS'),
      (a => a)
    )
  }
}
