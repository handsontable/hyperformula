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
    'ADD': {
      method: 'add',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'CONCAT' : {
      method: 'concat',
      parameters: [
        { argumentType: ArgumentTypes.STRING },
        { argumentType: ArgumentTypes.STRING },
      ],
    },
    'DIVIDE': {
      method: 'divide',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'EQ': {
      method: 'eq',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'GT': {
      method: 'gt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'GEQ': {
      method: 'geq',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'LT': {
      method: 'lt',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'LEQ': {
      method: 'leq',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'MINUS': {
      method: 'minus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'MULTIPLY': {
      method: 'multiply',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'NE': {
      method: 'ne',
      parameters: [
        { argumentType: ArgumentTypes.NOERROR },
        { argumentType: ArgumentTypes.NOERROR },
      ]
    },
    'POW': {
      method: 'pow',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'UMINUS': {
      method: 'uminus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'UNARY_PERCENT': {
      method: 'unary_percent',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'UPLUS': {
      method: 'uplus',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public add(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ADD'),
      (a: number, b: number) => this.interpreter.arithmeticHelper.addWithEpsilon(a, b)
      )
  }

  public concat(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CONCAT'),
      (a: string, b: string) => a.concat(b)
    )
  }

  public divide(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DIVIDE'),
      divide
    )
  }

  public eq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EQ'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) === 0
      )
    )
  }

  public gt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GT'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) > 0
      )
    )
  }

  public geq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GEQ'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) >= 0
      )
    )
  }

  public lt(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LT'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) < 0
      )
    )
  }

  public leq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LEQ'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) <= 0
      )
    )
  }

  public minus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MINUS'),
      (a: number, b: number) => this.interpreter.arithmeticHelper.subtract(a, b)
    )
  }

  public multiply(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MULTIPLY'),
      (a: number, b: number) => a*b
    )
  }

  public ne(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('NE'),
      (a: InternalNoErrorCellValue, b: InternalNoErrorCellValue) => (
        this.interpreter.arithmeticHelper.compare(a, b) !== 0
      )
    )
  }

  public pow(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('POW'), Math.pow)
  }

  public uminus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('UMINUS'),
      (a => -a)
    )
  }

  //eslint-disable-next-line @typescript-eslint/camelcase
  public unary_percent(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('UNARY_PERCENT'),
      (a => a/100)
    )
  }

  public uplus(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('UPLUS'),
      (a => a)
    )
  }
}
