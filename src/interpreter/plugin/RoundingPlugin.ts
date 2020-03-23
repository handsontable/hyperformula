import {CellError, ErrorType, InternalCellValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
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
    roundup: {
      translationKey: 'ROUNDUP',
    },
    rounddown: {
      translationKey: 'ROUNDDOWN',
    },
    round: {
      translationKey: 'ROUND',
    },
    trunc: {
      translationKey: 'TRUNC',
    },
    intFunc: {
      translationKey: 'INT',
    },
    even: {
      translationKey: 'EVEN',
    },
    odd: {
      translationKey: 'ODD',
    },
    ceiling: {
      translationKey: 'CEILING',
    },
  }

  public roundup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.commonArgumentsHandling2(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.ceil(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.ceil(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public rounddown(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.commonArgumentsHandling2(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.floor(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.floor(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public round(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.commonArgumentsHandling2(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.round(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.round(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public trunc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.rounddown(ast, formulaAddress)
  }

  public intFunc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -Math.floor(-coercedNumberToRound)
      } else {
        return Math.floor(coercedNumberToRound)
      }
    })
  }

  public even(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextEvenNumber(-coercedNumberToRound)
      } else {
        return findNextEvenNumber(coercedNumberToRound)
      }
    })
  }

  public odd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (coercedNumberToRound) => {
      if (coercedNumberToRound < 0) {
        return -findNextOddNumber(-coercedNumberToRound)
      } else {
        return findNextOddNumber(coercedNumberToRound)
      }
    })
  }

  public ceiling(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalCellValue {
    if (ast.args.length < 1 || ast.args.length > 3) {
      return new CellError(ErrorType.NA)
    }

    const value = this.getNumericArgument(ast, formulaAddress, 0)
    if (value instanceof CellError) {
      return value
    }

    let significance: number | CellError = 1
    if (ast.args.length >= 2) {
      significance = this.getNumericArgument(ast, formulaAddress, 1)
      if (significance instanceof CellError) {
        return significance
      }
    }

    let mode: number | CellError = 0
    if (ast.args.length === 3) {
      mode = this.getNumericArgument(ast, formulaAddress, 2)
      if (mode instanceof CellError) {
        return mode
      }
    }

    if (significance === 0 || value === 0) {
      return 0
    }

    if ((value > 0) != (significance > 0) && ast.args.length > 1) {
      return new CellError(ErrorType.NUM)
    }

    if (mode === 0) {
      significance = Math.abs(significance)
    }

    return Math.ceil(value / significance) * significance
  }

  private commonArgumentsHandling2(ast: ProcedureAst, formulaAddress: SimpleCellAddress, roundingFunction: RoundingFunction): InternalCellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    } else {
      const numberToRound = this.evaluateAst(ast.args[0], formulaAddress)
      if (numberToRound instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      let coercedPlaces
      if (ast.args[1]) {
        const places = this.evaluateAst(ast.args[1], formulaAddress)
        if (places instanceof SimpleRangeValue) {
          return new CellError(ErrorType.VALUE)
        }
        coercedPlaces = this.coerceScalarToNumberOrError(places)
      } else {
        coercedPlaces = 0
      }

      const coercedNumberToRound = this.coerceScalarToNumberOrError(numberToRound)
      if (coercedNumberToRound instanceof CellError) {
        return coercedNumberToRound
      } else if (coercedPlaces instanceof CellError) {
        return coercedPlaces
      } else {
        return roundingFunction(coercedNumberToRound, coercedPlaces)
      }
    }
  }
}
