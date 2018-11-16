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
  value: number
}
export const buildCriterion = (operator: CriterionType, value: number) => ({ operator, value })

const CRITERION_REGEX = /([<>=]+)(-?\d+\.?\d*)/
export const parseCriterion = (criterion: string): Criterion | null => {
  const regexResult = criterion.match(CRITERION_REGEX)
  if (regexResult) {
    const value = Number(regexResult[2])
    switch (regexResult[1]) {
      case '>': return buildCriterion(CriterionType.GREATER_THAN, value)
      case '>=': return buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, value)
      case '<': return buildCriterion(CriterionType.LESS_THAN, value)
      case '<=': return buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, value)
      case '<>': return buildCriterion(CriterionType.NOT_EQUAL, value)
      case '=': return buildCriterion(CriterionType.EQUAL, value)
      default: return null
    }
  } else {
    return null
  }
}
