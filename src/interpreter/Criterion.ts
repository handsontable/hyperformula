/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {EmptyValue, InternalScalarValue} from '../Cell'
import {Maybe} from '../Maybe'
import {ArithmeticHelper} from './ArithmeticHelper'

export enum CriterionType {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  EQUAL = 'EQUAL',
}
export interface Criterion {
  operator: CriterionType,
  value: number | string | boolean | null,
}
export const buildCriterion = (operator: CriterionType, value: number | string | boolean | null ) => ({ operator, value })

export class CriterionPackage {

  public static fromCellValue(raw: InternalScalarValue, arithmeticHelper: ArithmeticHelper): Maybe<CriterionPackage> {
    if (typeof raw !== 'string') {
      return undefined
    }

    const criterion = parseCriterion(raw, arithmeticHelper)
    if (criterion === undefined) {
      return undefined
    }

    return new CriterionPackage(raw, buildCriterionLambda(criterion, arithmeticHelper))
  }
  constructor(
    public readonly raw: string,
    public readonly lambda: CriterionLambda,
  ) {
  }
}

const ANY_CRITERION_REGEX = /([<>=]+)(.*)/

export const parseCriterion = (criterion: InternalScalarValue, arithmeticHelper: ArithmeticHelper): Maybe<Criterion> => {
  if (typeof criterion === 'number' || typeof criterion === 'boolean') {
    return buildCriterion(CriterionType.EQUAL, criterion)
  } else if (typeof criterion === 'string') {
    const regexResult = ANY_CRITERION_REGEX.exec(criterion)

    let criterionValue
    let criterionType

    if (regexResult) {
      criterionType = StrToCriterionType(regexResult[1])
      criterionValue = regexResult[2]
    } else {
      criterionType = CriterionType.EQUAL
      criterionValue = criterion
    }
    const value = arithmeticHelper.coerceToMaybeNumber(criterionValue)
    const boolvalue = criterionValue.toLowerCase()==='true' ? true : criterionValue.toLowerCase() === 'false' ? false : undefined
    if(criterionType === undefined) {
      return undefined
    }
    if (criterionValue === '') {
      return buildCriterion(criterionType, null)
    } else if (value === undefined) {
      if(criterionType === CriterionType.EQUAL || criterionType === CriterionType.NOT_EQUAL) {
        return buildCriterion(criterionType, boolvalue ?? criterionValue)
      }
    } else {
      return buildCriterion(criterionType, value)
    }
  }
  return undefined
}

function StrToCriterionType(str: string): Maybe<CriterionType> {
  switch (str) {
    case '>': return CriterionType.GREATER_THAN
    case '>=': return CriterionType.GREATER_THAN_OR_EQUAL
    case '<': return CriterionType.LESS_THAN
    case '<=': return CriterionType.LESS_THAN_OR_EQUAL
    case '<>': return CriterionType.NOT_EQUAL
    case '=': return CriterionType.EQUAL
    default: return undefined
  }
}

export type CriterionLambda = (cellValue: InternalScalarValue) => boolean
export const buildCriterionLambda = (criterion: Criterion, arithmeticHelper: ArithmeticHelper): CriterionLambda => {
  switch (criterion.operator) {
    case CriterionType.GREATER_THAN: {
      if(typeof criterion.value === 'number') {
        return (cellValue) =>
          (typeof cellValue === 'number' && arithmeticHelper.floatCmp(cellValue, criterion.value as number) > 0)
      } else {
        return (_cellValue) => false
      }
    }
    case CriterionType.GREATER_THAN_OR_EQUAL: {
      if(typeof criterion.value === 'number') {
        return (cellValue) =>
          (typeof cellValue === 'number' && arithmeticHelper.floatCmp(cellValue, criterion.value as number) >= 0)
      } else {
        return (_cellValue) => false
      }
    }
    case CriterionType.LESS_THAN: {
      if(typeof criterion.value === 'number') {
        return (cellValue) =>
          (typeof cellValue === 'number' && arithmeticHelper.floatCmp(cellValue, criterion.value as number) < 0)
      } else {
        return (_cellValue) => false
      }
    }
    case CriterionType.LESS_THAN_OR_EQUAL: {
      if(typeof criterion.value === 'number') {
        return (cellValue) =>
          (typeof cellValue === 'number' && arithmeticHelper.floatCmp(cellValue, criterion.value as number) <= 0)
      } else {
        return (_cellValue) => false
      }
    }
    case CriterionType.EQUAL: {
      if(typeof criterion.value === 'number') {
        return (cellValue) => {
          if(typeof cellValue === 'number') {
            return arithmeticHelper.floatCmp(cellValue, criterion.value as number) === 0
          } else if(typeof cellValue === 'string') {
            if(cellValue==='') {
              return false
            }
            const val = arithmeticHelper.coerceToMaybeNumber(cellValue)
            if(val === undefined) {
              return false
            }
            return arithmeticHelper.floatCmp(val, criterion.value as number) === 0
          } else {
            return false
          }
        }
      } else if(typeof criterion.value === 'string') {
        return arithmeticHelper.eqMatcherFunction(criterion.value)
      } else if(typeof criterion.value === 'boolean') {
        return (cellValue) => (typeof cellValue === 'boolean' && cellValue === criterion.value)
      } else {
        return (cellValue) => (cellValue === EmptyValue)
      }
    }
    case CriterionType.NOT_EQUAL: {
      if(typeof criterion.value === 'number') {
        return (cellValue) => {
          if(typeof cellValue === 'number') {
            return arithmeticHelper.floatCmp(cellValue, criterion.value as number) !== 0
          } else if(typeof cellValue === 'string') {
            if(cellValue === '') {
              return true
            }
            const val = arithmeticHelper.coerceToMaybeNumber(cellValue)
            if(val === undefined) {
              return true
            }
            return arithmeticHelper.floatCmp(val, criterion.value as number) !== 0
          } else {
            return true
          }
        }
      } else if(typeof criterion.value === 'string') {
        return arithmeticHelper.neqMatcherFunction(criterion.value)
      } else if(typeof criterion.value === 'boolean') {
        return (cellValue) => (typeof cellValue !== 'boolean' || cellValue !== criterion.value)
      } else {
        return (cellValue) => (cellValue !== EmptyValue)
      }
    }
  }
}
