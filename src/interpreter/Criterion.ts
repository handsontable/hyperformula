export enum CriterionType {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
}
export interface Criterion {
  operator: CriterionType,
  value: number
}
export const buildCriterion = (operator: CriterionType, value: number) => ({ operator, value })

export const parseCriterion = (criterion: string): Criterion | null => {
  if (criterion[0] === '>') {
    if (criterion[1] === '=') {
      return buildCriterion(CriterionType.GREATER_THAN_OR_EQUAL, Number(criterion.slice(2)))
    } else {
      return buildCriterion(CriterionType.GREATER_THAN, Number(criterion.slice(1)))
    }
  } else if (criterion[0] === '<') {
    if (criterion[1] === '=') {
      return buildCriterion(CriterionType.LESS_THAN_OR_EQUAL, Number(criterion.slice(2)))
    } else if (criterion[1] === '>') {
      return buildCriterion(CriterionType.NOT_EQUAL, Number(criterion.slice(2)))
    } else {
      return buildCriterion(CriterionType.LESS_THAN, Number(criterion.slice(1)))
    }
  }
  return null
}
