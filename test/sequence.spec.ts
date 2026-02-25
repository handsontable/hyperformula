/**
 * Comprehensive tests for SEQUENCE function.
 * Each test maps 1:1 to a row in the Excel validation workbook (SEQUENCE_validation_v3.xlsx).
 */
import {CellError, ErrorType} from '../src/Cell'
import {ErrorMessage} from '../src/error-message'
import {HyperFormula} from '../src'
import {adr} from './testUtils'

const LICENSE = {licenseKey: 'gpl-v3'}

// ── GROUP 1: Core Sanity ────────────────────────────────────────────────────

describe('SEQUENCE — GROUP 1: Core Sanity', () => {
  it('#1 single element SEQUENCE(1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    hf.destroy()
  })

  it('#2 4-row column vector SEQUENCE(4)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(4)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)
    expect(hf.getCellValue(adr('A4'))).toBe(4)
    hf.destroy()
  })

  it('#3 2×3 default start/step SEQUENCE(2,3)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(2,3)']], LICENSE)
    // Row 1: 1, 2, 3
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('B1'))).toBe(2)
    expect(hf.getCellValue(adr('C1'))).toBe(3)
    // Row 2: 4, 5, 6
    expect(hf.getCellValue(adr('A2'))).toBe(4)
    expect(hf.getCellValue(adr('B2'))).toBe(5)
    expect(hf.getCellValue(adr('C2'))).toBe(6)
    hf.destroy()
  })

  it('#4 4×1 start=10 step=10 SEQUENCE(4,1,10,10)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(4,1,10,10)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(10)
    expect(hf.getCellValue(adr('A2'))).toBe(20)
    expect(hf.getCellValue(adr('A3'))).toBe(30)
    expect(hf.getCellValue(adr('A4'))).toBe(40)
    hf.destroy()
  })

  it('#5 3×3 start=0 step=1 SEQUENCE(3,3,0,1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,3,0,1)']], LICENSE)
    // Row 1: 0, 1, 2
    expect(hf.getCellValue(adr('A1'))).toBe(0)
    expect(hf.getCellValue(adr('B1'))).toBe(1)
    expect(hf.getCellValue(adr('C1'))).toBe(2)
    // Row 2: 3, 4, 5
    expect(hf.getCellValue(adr('A2'))).toBe(3)
    expect(hf.getCellValue(adr('B2'))).toBe(4)
    expect(hf.getCellValue(adr('C2'))).toBe(5)
    // Row 3: 6, 7, 8
    expect(hf.getCellValue(adr('A3'))).toBe(6)
    expect(hf.getCellValue(adr('B3'))).toBe(7)
    expect(hf.getCellValue(adr('C3'))).toBe(8)
    hf.destroy()
  })

  it('#6 1×5 row vector SEQUENCE(1,5)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1,5)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('B1'))).toBe(2)
    expect(hf.getCellValue(adr('C1'))).toBe(3)
    expect(hf.getCellValue(adr('D1'))).toBe(4)
    expect(hf.getCellValue(adr('E1'))).toBe(5)
    hf.destroy()
  })

  it('#7 SEQUENCE(4,1) — MS docs example', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(4,1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)
    expect(hf.getCellValue(adr('A4'))).toBe(4)
    hf.destroy()
  })
})

// ── GROUP 2: Optional Parameter Omission ────────────────────────────────────

describe('SEQUENCE — GROUP 2: Optional Parameter Omission', () => {
  it('#8 cols omitted → defaults to 1 SEQUENCE(3)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)
    // No value to the right
    expect(hf.getCellValue(adr('B1'))).toBeNull()
    hf.destroy()
  })

  it('#9 empty start arg coerces to 0 in HyperFormula SEQUENCE(3,2,,)', () => {
    // Excel treats empty arg as default (1); HyperFormula's NUMBER type coerces empty to 0
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,2,,)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(0) // start=0, step=0 → constant 0
    expect(hf.getCellValue(adr('B1'))).toBe(0)
    expect(hf.getCellValue(adr('A2'))).toBe(0)
    expect(hf.getCellValue(adr('B3'))).toBe(0)
    hf.destroy()
  })

  it('#10 empty step arg coerces to 0 in HyperFormula SEQUENCE(3,2,5,)', () => {
    // Excel treats empty arg as default (1); HyperFormula's NUMBER type coerces empty to 0
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,2,5,)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(5) // start=5, step=0 → constant 5
    expect(hf.getCellValue(adr('B1'))).toBe(5)
    expect(hf.getCellValue(adr('A3'))).toBe(5)
    hf.destroy()
  })

  it('#11 explicit defaults SEQUENCE(3,2,1,1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,2,1,1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('B1'))).toBe(2)
    expect(hf.getCellValue(adr('A2'))).toBe(3)
    expect(hf.getCellValue(adr('B2'))).toBe(4)
    expect(hf.getCellValue(adr('A3'))).toBe(5)
    expect(hf.getCellValue(adr('B3'))).toBe(6)
    hf.destroy()
  })
})

// ── GROUP 3: Negative & Fractional Step ─────────────────────────────────────

describe('SEQUENCE — GROUP 3: Negative & Fractional Step', () => {
  it('#12 negative step counts down SEQUENCE(4,1,10,-2)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(4,1,10,-2)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(10)
    expect(hf.getCellValue(adr('A2'))).toBe(8)
    expect(hf.getCellValue(adr('A3'))).toBe(6)
    expect(hf.getCellValue(adr('A4'))).toBe(4)
    hf.destroy()
  })

  it('#13 step=0 produces constant array SEQUENCE(3,1,5,0)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,1,5,0)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(5)
    expect(hf.getCellValue(adr('A2'))).toBe(5)
    expect(hf.getCellValue(adr('A3'))).toBe(5)
    hf.destroy()
  })

  it('#14 fractional step 0.5 SEQUENCE(3,1,0,0.5)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,1,0,0.5)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(0)
    expect(hf.getCellValue(adr('A2'))).toBe(0.5)
    expect(hf.getCellValue(adr('A3'))).toBe(1)
    hf.destroy()
  })

  it('#15 negative start SEQUENCE(3,1,-5,2)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(3,1,-5,2)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(-5)
    expect(hf.getCellValue(adr('A2'))).toBe(-3)
    expect(hf.getCellValue(adr('A3'))).toBe(-1)
    hf.destroy()
  })
})

// ── GROUP 4: Edge Cases — rows & cols ────────────────────────────────────────

describe('SEQUENCE — GROUP 4: Edge Cases on rows & cols', () => {
  it('#16 rows=1 cols=1 SEQUENCE(1,1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1,1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    hf.destroy()
  })

  it('#17 rows=0 → NUM error', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(0)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toMatchObject({type: ErrorType.NUM})
    hf.destroy()
  })

  it('#18 cols=0 → NUM error', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1,0)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toMatchObject({type: ErrorType.NUM})
    hf.destroy()
  })

  it('#19 rows=-1 → NUM error', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(-1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toMatchObject({type: ErrorType.NUM})
    hf.destroy()
  })

  it('#20 rows=1.9 truncates to 1 SEQUENCE(1.9)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1.9)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBeNull()
    hf.destroy()
  })

  it('#21 rows=1.1 truncates to 1 SEQUENCE(1.1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1.1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBeNull()
    hf.destroy()
  })

  it('#22 cols=2.7 truncates to 2 SEQUENCE(2,2.7)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(2,2.7)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('B1'))).toBe(2)
    expect(hf.getCellValue(adr('C1'))).toBeNull()
    expect(hf.getCellValue(adr('A2'))).toBe(3)
    expect(hf.getCellValue(adr('B2'))).toBe(4)
    hf.destroy()
  })
})

// ── GROUP 5: Type Coercion on Arguments ──────────────────────────────────────

describe('SEQUENCE — GROUP 5: Type Coercion on Arguments', () => {
  it('#23 rows as string "3" — HyperFormula returns VALUE (no string→number coercion)', () => {
    // Excel coerces "3" to 3; HyperFormula's NUMBER param type does not coerce string literals
    const hf = HyperFormula.buildFromArray([['=SEQUENCE("3")']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toMatchObject({type: ErrorType.VALUE})
    hf.destroy()
  })

  it('#24 rows=TRUE() coerces to 1', () => {
    // In HyperFormula, bare TRUE is a named expression; TRUE() is the boolean function
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(TRUE())']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBeNull()
    hf.destroy()
  })

  it('#25 error in argument propagates SEQUENCE(1/0)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(1/0)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toMatchObject({type: ErrorType.DIV_BY_ZERO})
    hf.destroy()
  })
})

// ── GROUP 6: Large Sequences ─────────────────────────────────────────────────

describe('SEQUENCE — GROUP 6: Large Sequences', () => {
  it('#26 10×10 = 100 elements SEQUENCE(10,10)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(10,10)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)   // TL
    expect(hf.getCellValue(adr('J1'))).toBe(10)  // TR
    expect(hf.getCellValue(adr('A10'))).toBe(91) // BL
    expect(hf.getCellValue(adr('J10'))).toBe(100)// BR
    hf.destroy()
  })

  it('#27 100×1 column SEQUENCE(100,1)', () => {
    const hf = HyperFormula.buildFromArray([['=SEQUENCE(100,1)']], LICENSE)
    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A50'))).toBe(50)
    expect(hf.getCellValue(adr('A100'))).toBe(100)
    hf.destroy()
  })
})
