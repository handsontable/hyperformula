export enum CriterionType {
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
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
  }
  return null
}
