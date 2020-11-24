/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

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
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
    },
    'ROUNDDOWN': {
      method: 'rounddown',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
    },
    'ROUND': {
      method: 'round',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
    },
    'TRUNC': {
      method: 'trunc',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0},
      ],
    },
    'INT': {
      method: 'intFunc',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
    'EVEN': {
      method: 'even',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
    'ODD': {
      method: 'odd',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER }
      ],
    },
    'CEILING.MATH': {
      method: 'ceilingmath',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 1 },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0 },
      ],
    },
    'CEILING': {
      method: 'ceiling',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
    'FLOOR.MATH': {
      method: 'floormath',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 1 },
        { argumentType: ArgumentTypes.NUMBER, defaultValue: 0 },
      ],
    },
    'FLOOR': {
      method: 'floor',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER },
        { argumentType: ArgumentTypes.NUMBER },
      ],
    },
  }

  public roundup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ROUNDDOWN'), (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.ceil(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.ceil(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public rounddown(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ROUNDDOWN'), (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.floor(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.floor(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public round(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ROUND'), (numberToRound: number, places: number): number => {
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('INT'), (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -Math.floor(-coercedNumberToRound)
      } else {
        return Math.floor(coercedNumberToRound)
      }
    })
  }

  public even(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EVEN'), (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextEvenNumber(-coercedNumberToRound)
      } else {
        return findNextEvenNumber(coercedNumberToRound)
      }
    })
  }

  public odd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ODD'), (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextOddNumber(-coercedNumberToRound)
      } else {
        return findNextOddNumber(coercedNumberToRound)
      }
    })
  }

  public ceilingmath(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CEILING.MATH'),
      (value: number, significance: number, mode: number) => {
      if (significance === 0 || value === 0) {
        return 0
      }

      significance = Math.abs(significance)
      if (mode === 1 && value < 0) {
        significance = -significance
      }

      return Math.ceil(value / significance) * significance
    })
  }

  public ceiling(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CEILING'),
      (value: number, significance: number) => {
      if (significance === 0 || value === 0) {
        return 0
      }

      if ((value > 0) && (significance < 0)) {
        return new CellError(ErrorType.NUM, ErrorMessage.DistinctSigns)
      }

      return Math.ceil(value / significance) * significance
    })
  }

  public floormath(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FLOOR.MATH'),
      (value: number, significance: number, mode: number) => {
        if (significance === 0 || value === 0) {
          return 0
        }

        significance = Math.abs(significance)
        if (mode === 1 && value < 0) {
          significance = -significance
        }

        return Math.floor(value / significance) * significance
      })
  }

  public floor(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FLOOR'),
      (value: number, significance: number) => {
        if (significance === 0 || value === 0) {
          return 0
        }

        if ((value > 0) && (significance < 0)) {
          return new CellError(ErrorType.NUM, ErrorMessage.DistinctSigns)
        }

        return Math.floor(value / significance) * significance
      })
  }
}
