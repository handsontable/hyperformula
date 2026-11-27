import {HyperFormula} from '../src'

describe('Array literal with a large element', () => {
  const rows = 40000
  const stacked = Array(4).fill(`A1:A${rows}`).join(',')

  const evaluate = (formula: string) => {
    const data: (number | string)[][] = Array.from({length: rows}, () => [1])
    data[0].push(formula)
    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})
    const value = hf.getCellValue({sheet: 0, col: 1, row: 0})
    hf.destroy()
    return value
  }

  it('should evaluate a literal holding a tall array', () => {
    expect(evaluate(`=SUM({VSTACK(${stacked})})`)).toBe(4 * rows)
  })

  it('should evaluate a literal holding a wide array', () => {
    expect(evaluate(`=SUM({TRANSPOSE(VSTACK(${stacked}))})`)).toBe(4 * rows)
  })

  it('should evaluate a literal with several large elements in a row', () => {
    expect(evaluate(`=SUM({VSTACK(${stacked}), VSTACK(${stacked})})`)).toBe(8 * rows)
  })

  it('should evaluate a literal with several large rows', () => {
    expect(evaluate(`=SUM({TRANSPOSE(VSTACK(${stacked}));TRANSPOSE(VSTACK(${stacked}))})`)).toBe(8 * rows)
  })
})
