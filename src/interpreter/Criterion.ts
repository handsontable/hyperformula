import {CellValue} from '../Cell'

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
  value: number | string
}
export const buildCriterion = (operator: CriterionType, value: number | string) => ({ operator, value })

const ANY_CRITERION_REGEX = /([<>=]+)(.+)/

export const parseCriterion = (criterion: CellValue): Criterion | null => {
  if (typeof criterion === 'number') {
    return buildCriterion(CriterionType.EQUAL, criterion)
  } else if (typeof criterion === 'string') {
    const regexResult = criterion.match(ANY_CRITERION_REGEX)

    if (regexResult) {
      const value = Number(regexResult[2])
      if (isNaN(value)) {
        switch (regexResult[1]) {
          case '=': return buildCriterion(CriterionType.EQUAL, regexResult[2])
        }
      } else {
        switch (regexResult[1]) {
          case '>': return buildCriterion(CriterionType.GREATER_THAN, value)
          case '>=': return buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, value)
          case '<': return buildCriterion(CriterionType.LESS_THAN, value)
          case '<=': return buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, value)
          case '<>': return buildCriterion(CriterionType.NOT_EQUAL, value)
          case '=': return buildCriterion(CriterionType.EQUAL, value)
          default: return null
        }
      }
    }
  }

  return null
}

export type CriterionLambda = (cellValue: CellValue) => boolean | null
export const buildCriterionLambda = (criterion: Criterion): CriterionLambda => {
  switch (criterion.operator) {
    case CriterionType.GREATER_THAN: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return cellValue > criterion.value
        } else {
          return null
        }
      }
    }
    case CriterionType.GREATER_THAN_OR_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return cellValue >= criterion.value
        } else {
          return null
        }
      }
    }
    case CriterionType.LESS_THAN: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return cellValue < criterion.value
        } else {
          return null
        }
      }
    }
    case CriterionType.LESS_THAN_OR_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return cellValue <= criterion.value
        } else {
          return null
        }
      }
    }
    case CriterionType.EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number' || typeof cellValue === 'string') {
          return cellValue === criterion.value
        } else {
          return null
        }
      }
    }
    case CriterionType.NOT_EQUAL: {
      return (cellValue) => {
        if (typeof cellValue === 'number') {
          return cellValue !== criterion.value
        } else {
          return null
        }
      }
    }
  }
}
