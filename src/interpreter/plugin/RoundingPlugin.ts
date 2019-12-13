import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'
import {SimpleRangeValue} from '../InterpreterValue'
import {coerceScalarToNumber} from '../coerce'

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
    int_func: {
      translationKey: 'INT',
    },
    even: {
      translationKey: 'EVEN',
    },
    odd: {
      translationKey: 'ODD',
    }
  }

  public roundup(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonArgumentsHandling(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.ceil(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.ceil(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public rounddown(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonArgumentsHandling(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.floor(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.floor(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public round(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.commonArgumentsHandling(ast, formulaAddress, (numberToRound: number, places: number): number => {
      const placesMultiplier = Math.pow(10, places)
      if (numberToRound < 0) {
        return -Math.round(-numberToRound * placesMultiplier) / placesMultiplier
      } else {
        return Math.round(numberToRound * placesMultiplier) / placesMultiplier
      }
    })
  }

  public trunc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.rounddown(ast, formulaAddress)
  }

  public int_func(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    } else {
      const numberToRound = this.evaluateAst(ast.args[0], formulaAddress)
      if (numberToRound instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      const coercedNumberToRound = coerceScalarToNumber(numberToRound)
      if (coercedNumberToRound instanceof CellError) {
        return coercedNumberToRound
      } else {
        if (coercedNumberToRound < 0) {
          return -Math.floor(-coercedNumberToRound)
        } else {
          return Math.floor(coercedNumberToRound)
        }
      }
    }
  }

  public even(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    } else {
      const numberToRound = this.evaluateAst(ast.args[0], formulaAddress)
      if (numberToRound instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      const coercedNumberToRound = coerceScalarToNumber(numberToRound)
      if (coercedNumberToRound instanceof CellError) {
        return coercedNumberToRound
      } else {
        if (coercedNumberToRound < 0) {
          return -findNextEvenNumber(-coercedNumberToRound)
        } else {
          return findNextEvenNumber(coercedNumberToRound)
        }
      }
    }
  }

  public odd(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length !== 1) {
      return new CellError(ErrorType.NA)
    } else {
      const numberToRound = this.evaluateAst(ast.args[0], formulaAddress)
      if (numberToRound instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE)
      }

      const coercedNumberToRound = coerceScalarToNumber(numberToRound)
      if (coercedNumberToRound instanceof CellError) {
        return coercedNumberToRound
      } else {
        if (coercedNumberToRound < 0) {
          return -findNextOddNumber(-coercedNumberToRound)
        } else {
          return findNextOddNumber(coercedNumberToRound)
        }
      }
    }
  }

  private commonArgumentsHandling(ast: ProcedureAst, formulaAddress: SimpleCellAddress, roundingFunction: RoundingFunction): CellValue {
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
        coercedPlaces = coerceScalarToNumber(places)
      } else {
        coercedPlaces = 0
      }

      const coercedNumberToRound = coerceScalarToNumber(numberToRound)
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
