/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterValue, SimpleRangeValue} from '../InterpreterValue'
import {corrcoeff, covariance, geomean} from './3rdparty/jstat/jstat'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class StatisticalAggregationPlugin extends  FunctionPlugin {
  public static implementedFunctions = {
    'AVEDEV': {
      method: 'avedev',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'DEVSQ': {
      method: 'devsq',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'GEOMEAN': {
      method: 'geomean',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'HARMEAN': {
      method: 'harmean',
      parameters: [
        {argumentType: ArgumentTypes.ANY},
      ],
      repeatLastArgs: 1
    },
    'CORREL': {
      method: 'correl',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'PEARSON': {
      method: 'correl',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'RSQ': {
      method: 'rsq',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'COVARIANCE.P': {
      method: 'covariancep',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'COVARIANCE.S': {
      method: 'covariances',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
    'COVAR': {
      method: 'covariancep',
      parameters: [
        {argumentType: ArgumentTypes.RANGE},
        {argumentType: ArgumentTypes.RANGE},
      ],
    },
  }

  public avedev(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('AVEDEV'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.DIV_BY_ZERO)
        }
        const avg = (coerced.reduce((a, b) => a+b, 0))/coerced.length
        return coerced.reduce((a, b) => a + Math.abs(b-avg), 0)/coerced.length
      })
  }

  public devsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('DEVSQ'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return 0
        }
        const avg = (coerced.reduce((a, b) => a+b, 0))/coerced.length
        return coerced.reduce((a, b) => a + Math.pow(b-avg, 2), 0)
      })
  }

  public geomean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('GEOMEAN'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        for(const val of coerced) {
          if(val <= 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
        }
        return geomean(coerced)
      })
  }

  public harmean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('HARMEAN'),
      (...args: InterpreterValue[]) => {
        const coerced = this.interpreter.arithmeticHelper.coerceNumbersExactRanges(args)
        if(coerced instanceof CellError) {
          return coerced
        }
        if(coerced.length===0) {
          return new CellError(ErrorType.NUM, ErrorMessage.OneValue)
        }
        for(const val of coerced) {
          if(val <= 0) {
            return new CellError(ErrorType.NUM, ErrorMessage.ValueSmall)
          }
        }
        return coerced.length/(coerced.reduce((a, b) => a+1/b, 0))
      })
  }

  public correl(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CORREL'), (dataX: SimpleRangeValue, dataY: SimpleRangeValue) => {
      if (dataX.numberOfElements() !== dataY.numberOfElements()) {
        return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
      }

      if (dataX.numberOfElements() <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues)
      }
      const ret = parseTwoArrays(dataX, dataY)
      if(ret instanceof CellError) {
        return ret
      }
      return corrcoeff(ret[0], ret[1])
    })
  }

  public rsq(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('RSQ'), (dataX: SimpleRangeValue, dataY: SimpleRangeValue) => {
      if (dataX.numberOfElements() !== dataY.numberOfElements()) {
        return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
      }

      if (dataX.numberOfElements() <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues)
      }
      const ret = parseTwoArrays(dataX, dataY)
      if(ret instanceof CellError) {
        return ret
      }
      return Math.pow(corrcoeff(ret[0], ret[1]),2)
    })
  }

  public covariancep(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COVARIANCE.P'), (dataX: SimpleRangeValue, dataY: SimpleRangeValue) => {
      if (dataX.numberOfElements() !== dataY.numberOfElements()) {
        return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
      }

      if (dataX.numberOfElements() <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues)
      }
      const ret = parseTwoArrays(dataX, dataY)
      if(ret instanceof CellError) {
        return ret
      }
      if(ret[0].length === 1) {
        return 0
      }
      return covariance(ret[0], ret[1])*(ret[0].length-1)/ret[0].length
    })
  }

  public covariances(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('COVARIANCE.S'), (dataX: SimpleRangeValue, dataY: SimpleRangeValue) => {
      if (dataX.numberOfElements() !== dataY.numberOfElements()) {
        return new CellError(ErrorType.NA, ErrorMessage.EqualLength)
      }

      if (dataX.numberOfElements() <= 1) {
        return new CellError(ErrorType.DIV_BY_ZERO, ErrorMessage.TwoValues)
      }
      const ret = parseTwoArrays(dataX, dataY)
      if(ret instanceof CellError) {
        return ret
      }
      return covariance(ret[0], ret[1])
    })
  }
}


function parseTwoArrays(dataX: SimpleRangeValue, dataY: SimpleRangeValue): CellError | [number[], number[]] {
  const xit = dataX.iterateValuesFromTopLeftCorner()
  const yit = dataY.iterateValuesFromTopLeftCorner()
  let x, y
  const arrX = []
  const arrY = []
  while (x = xit.next(), y = yit.next(), !x.done && !y.done) {
    const xval = x.value
    const yval = y.value
    if (xval instanceof CellError) {
      return xval
    } else if (yval instanceof CellError) {
      return yval
    } else if (typeof xval === 'number' && typeof yval === 'number') {
      arrX.push(xval)
      arrY.push(yval)
    }
  }
  return [arrX, arrY]
}
