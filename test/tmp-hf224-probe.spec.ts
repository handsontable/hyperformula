import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'

function build(formulas: string[][], arrays = false) {
  return HyperFormula.buildFromArray(formulas, {licenseKey: 'gpl-v3', useArrayArithmetic: arrays})
}

describe('probe', () => {
  it('probe', () => {
    const e = build([
      ['1', '2', '=INDEX(A1:B2,1.9,1)'],
      ['3', '4', '=BITAND(1.5,1)'],
      ['=BITAND(-1,1)', '=BITLSHIFT(1,100)', '=INDEX(A1:B2,,2)'],
      ['=INDEX(A1:B2,1,)', '=INDEX(A1:B2,1)', '=INDEX(1/0,1,1)'],
      ['=INDEX(A1:B2,1/0,1)', '=INDEX(42,1,1)', '=INDEX(A1,1,1)'],
      ['=INDEX(A1:B2)', '=INDEX(A1:B2,1,1,1)', '=INDEX(A1:B2,"2",1)'],
      ['=INDEX(A1:B2,TRUE(),1)', '=INDEX(A1:B2,"abc",1)', '=INDEX(A1:B2,0,0)'],
      ['=INDEX(A1:B2,3,1)', '=INDEX(A1:B2,-1,1)', '=SUM(INDEX(A1:B2,1,0))'],
      ['=INDEX(A1:B2,,)', '=INDEX()', '=SUM(INDEX(A1:B2,B1,0))'],
    ])
    const out: string[] = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 3; c++) {
        const f = e.getCellFormula({sheet: 0, col: c, row: r})
        if (f === undefined) continue
        const v = e.getCellValue({sheet: 0, col: c, row: r})
        out.push(`${f} => ${JSON.stringify(v)} ${v instanceof Object ? (v as any).value + ' | ' + (v as any).message : ''}`)
      }
    }
    console.info(out.join('\n'))
    expect(true).toBe(true)
  })

  it('probe arrays mode / vectorization', () => {
    const e = build([
      ['1', '2', '=INDEX(A1:B2,A1:A2,0)'],
      ['3', '4', '=INDEX(A1:B2,1,0)'],
    ], true)
    const out: string[] = []
    try {
      out.push('C1 ' + JSON.stringify(e.getCellValue({sheet: 0, col: 2, row: 0})))
    } catch (err) {
      out.push('C1 THREW ' + (err as Error).message)
    }
    out.push('C2 ' + JSON.stringify(e.getSheetValues(0)))
    console.info(out.join('\n'))
    expect(true).toBe(true)
  })
})
