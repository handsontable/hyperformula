/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {AstNodeType, ProcedureAst} from '../../parser'
import {SimpleRangeValue} from '../InterpreterValue'
import {FunctionPlugin} from './FunctionPlugin'

type RoundingFunction = (numberToRound: number, places: number) => number

export function findNextOddNumber(arg: number): number {
  const ceiled = Math.ceil(arg)
  return (ceiled % 2 === 1) ? ceiled : ceiled + 1
}

export function findNextEvenNumber(arg: number): number {
  const ceiled = Math.ceil(arg)
  return (ceiled % 2 === 0) ? ceiled : ceiled + 1
}

export class RoundingPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ROUNDUP': {
      method: 'roundup',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0},
      ],
    },
    'ROUNDDOWN': {
      method: 'rounddown',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0},
      ],
    },
    'ROUND': {
      method: 'round',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0},
      ],
    },
    'TRUNC': {
      method: 'trunc',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 0},
      ],
    },
    'INT': {
      method: 'intFunc',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'EVEN': {
      method: 'even',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'ODD': {
      method: 'odd',
      parameters: [
        { argumentType: 'number' }
      ],
    },
    'CEILING': {
      method: 'ceiling',
      parameters: [
        { argumentType: 'number' },
        { argumentType: 'number', defaultValue: 1 },
        { argumentType: 'number', defaultValue: 0 },
      ],
    },
  }

  public roundup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.ROUNDDOWN, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.ceil(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.ceil(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public rounddown(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.ROUNDDOWN, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.floor(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.floor(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public round(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.ROUND, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.round(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.round(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public trunc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.rounddown(ast, formulaAddress)
  }

  public intFunc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.INT, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -Math.floor(-coercedNumberToRound)
      } else {
        return Math.floor(coercedNumberToRound)
      }
    })
  }

  public even(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.EVEN, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextEvenNumber(-coercedNumberToRound)
      } else {
        return findNextEvenNumber(coercedNumberToRound)
      }
    })
  }

  public odd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.ODD, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextOddNumber(-coercedNumberToRound)
      } else {
        return findNextOddNumber(coercedNumberToRound)
      }
    })
  }

  public ceiling(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, RoundingPlugin.implementedFunctions.CEILING,(value: number, significance: number, mode: number) => {
      if (significance === 0 || value === 0) {
        return 0
      }

      if ((value > 0) !== (significance > 0) && ast.args.length > 1) {
        return new CellError(ErrorType.NUM)
      }

      if (mode === 0) {
        significance = Math.abs(significance)
      }

      return Math.ceil(value / significance) * significance
    })
  }
}
