import {CellError, CellValue, ErrorType, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

export class ErrorFunctionPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    erf: {
      translationKey: 'ERF',
    },
    erfc: {
      translationKey: 'ERFC',
    },
  }

  public erf(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length < 1 || ast.args.length > 2) {
      return new CellError(ErrorType.NA)
    }

    const lowerBound = this.getNumericArgument(ast, formulaAddress, 0)
    if (lowerBound instanceof CellError) {
      return lowerBound
    }

    if (ast.args.length === 2) {
      const upperBound = this.getNumericArgument(ast, formulaAddress, 1)
      if (upperBound instanceof CellError) {
        return upperBound
      }
      return erf2(lowerBound, upperBound)
    }

    return erf(lowerBound)
  }

  public erfc(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    return this.templateWithOneCoercedToNumberArgument(ast, formulaAddress, (arg: number) => {
      return erfc(arg)
    })
  }
}

function erf(x: number): number {
  if (x >= 0) {
    return erfApprox(x)
  } else {
    return -erfApprox(-x)
  }
}

function erfApprox(x: number): number {
  const polyExponent = 16
  const coefficients = [
    0.0705230784,
    0.0422820123,
    0.0092705272,
    0.0001520143,
    0.0002765672,
    0.0000430638,
  ]

  const poly = coefficients.reduce((acc: number, coefficient: number, index: number) => {
    return acc + coefficient * Math.pow(x, index + 1)
  }, 1)

  return 1 - (1 / Math.pow(poly, polyExponent))
}

function erf2(lowerBound: number, upperBound: number): number {
  return erf(upperBound) - erf(lowerBound)
}

function erfc(x: number): number {
  return 1 - erf(x)
}
