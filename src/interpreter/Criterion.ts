/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {InternalCellValue} from '../Cell'
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
  value: number | string,
}
export const buildCriterion = (operator: CriterionType, value: number | string) => ({ operator, value })

export class CriterionPackage {

  public static fromCellValue(raw: InternalCellValue, arithmeticHelper: ArithmeticHelper): Maybe<CriterionPackage> {
    if (typeof raw !== 'string') {
      return undefined
    }

    const criterion = parseCriterion(raw)
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

export const parseCriterion = (criterion: InternalCellValue): Maybe<Criterion> => {
  if (typeof criterion === 'number') {
    return buildCriterion(CriterionType.EQUAL, criterion)
  } else if (typeof criterion === 'string') {
    const regexResult = ANY_CRITERION_REGEX.exec(criterion)

    if (regexResult) {
      const value = Number(regexResult[2])
      if (regexResult[1] === '=' && regexResult[2] === '') {
        return buildCriterion(CriterionType.EQUAL, '')
      } else if (isNaN(value)) {
        switch (regexResult[1]) {
          case '=': return buildCriterion(CriterionType.EQUAL, regexResult[2])
          case '<>': return buildCriterion(CriterionType.NOT_EQUAL, regexResult[2])
        }
      } else {
        switch (regexResult[1]) {
          case '>': return buildCriterion(CriterionType.GREATER_THAN, value)
          case '>=': return buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, value)
          case '<': return buildCriterion(CriterionType.LESS_THAN, value)
          case '<=': return buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, value)
          case '<>': return buildCriterion(CriterionType.NOT_EQUAL, value)
          case '=': return buildCriterion(CriterionType.EQUAL, value)
          default: return undefined
        }
      }
    } else {
      return buildCriterion(CriterionType.EQUAL, criterion)
    }
  }

  return undefined
}

export type CriterionLambda = (cellValue: InternalCellValue) => Maybe<boolean>
export const buildCriterionLambda = (criterion: Criterion, arithmeticHelper: ArithmeticHelper): CriterionLambda => {
  switch (criterion.operator) {
    case CriterionType.GREATER_THAN: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value as number) > 0
        } else {
          return undefined
        }
      }
    }
    case CriterionType.GREATER_THAN_OR_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value as number) >= 0
        } else {
          return undefined
        }
      }
    }
    case CriterionType.LESS_THAN: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value as number) < 0
        } else {
          return undefined
        }
      }
    }
    case CriterionType.LESS_THAN_OR_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value as number) <= 0
        } else {
          return undefined
        }
      }
    }
    case CriterionType.EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number' && typeof criterion.value === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value) === 0
        } else if(typeof cellValue === 'string' && typeof criterion.value === 'string') {
          return arithmeticHelper.stringCmp(cellValue, criterion.value) === 0
        } else {
          return undefined
        }
      }
    }
    case CriterionType.NOT_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number' && typeof criterion.value === 'number') {
          return arithmeticHelper.floatCmp(cellValue, criterion.value) !== 0
        } else if(typeof cellValue === 'string' && typeof criterion.value === 'string') {
          return arithmeticHelper.stringCmp(cellValue, criterion.value) !== 0
        } else {
          return undefined
        }
      }
    }
  }
}
