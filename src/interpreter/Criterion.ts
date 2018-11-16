export enum CriterionType {
  GREATER_THAN = 'GREATER_THAN',
}
export interface Criterion {
  operator: CriterionType,
  value: number
}
export const buildCriterion = (operator: CriterionType, value: number) => ({ operator, value })

export const parseCriterion = (criterion: string): Criterion | null => {
  if (criterion[0] === '>') {
    return buildCriterion(CriterionType.GREATER_THAN, Number(criterion.slice(1)))
  }
  return null
}
