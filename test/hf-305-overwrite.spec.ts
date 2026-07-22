import {DetailedCellError, ErrorType, HyperFormula} from '../src'
import {SimpleCellAddress, simpleCellAddress} from '../src/Cell'

const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {
  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!
  const row = Number(result[6]) - 1
  return simpleCellAddress(sheet, colNumber(result[4]), row)
}

const colNumber = (input: string): number => {
  if (input.length === 1) {
    return input.toUpperCase().charCodeAt(0) - 65
  } else {
    return input.split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }
}

describe('HF-305 arrayFunctionResultOverwritesData', () => {
  it('OFF (flag omitted, default): array spilling onto an occupied cell yields #SPILL! and leaves the occupant intact', () => {
    const data = [
      ['=TRANSPOSE(C1:E1)', null, 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})

    const a1 = hf.getCellValue(adr('A1'))
    expect(a1 instanceof DetailedCellError).toBe(true)
    expect((a1 as DetailedCellError).type).toBe(ErrorType.SPILL)
    expect(hf.getCellValue(adr('A2'))).toBe('x')

    hf.destroy()
  })

  it('OFF (explicit false): array spilling onto an occupied cell yields #SPILL! and leaves the occupant intact', () => {
    const data = [
      ['=TRANSPOSE(C1:E1)', null, 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: false})

    const a1 = hf.getCellValue(adr('A1'))
    expect((a1 as DetailedCellError).type).toBe(ErrorType.SPILL)
    expect(hf.getCellValue(adr('A2'))).toBe('x')

    hf.destroy()
  })

  it('OFF: setting an array formula that collides with an occupied cell yields #SPILL! (recalc parity)', () => {
    const data = [
      [null, null, 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: false})

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']])

    const a1 = hf.getCellValue(adr('A1'))
    expect((a1 as DetailedCellError).type).toBe(ErrorType.SPILL)
    expect(hf.getCellValue(adr('A2'))).toBe('x')

    hf.destroy()
  })

  it('ON: setting an array formula that collides with an occupied cell overwrites it and the spill lands', () => {
    const data = [
      [null, null, 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']])

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)

    hf.destroy()
  })

  it('ON: a cell referencing the overwritten occupant reflects the new spilled value (dependent reroute)', () => {
    const data = [
      [null, '=A2', 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']])

    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('B1'))).toBe(2)

    hf.destroy()
  })

  it('OFF: free spill into empty cells still works (no regression)', () => {
    const data = [
      ['=TRANSPOSE(C1:E1)', null, 1, 2, 3],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: false})

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)

    hf.destroy()
  })

  it('ON: free spill into empty cells still works (no regression when the flag is on but there is no collision)', () => {
    const data = [
      ['=TRANSPOSE(C1:E1)', null, 1, 2, 3],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2)
    expect(hf.getCellValue(adr('A3'))).toBe(3)

    hf.destroy()
  })

  // OUT OF SCOPE (documented current behavior): the overwrite primitive lives on the
  // setFormulaToCell / setCellContents path (`exchangeOrAddFormulaVertex`). When an array
  // formula AND a conflicting occupant are declared *inline in the same buildFromArray call*,
  // the occupant is processed after the array and GraphBuilder.shrinkArrayIfNeeded shrinks the
  // array back to its corner, so the inline occupant wins at build time even with the flag ON.
  // Asserting current behavior so a future change to this edge is a conscious decision.
  it('ON (out of scope): an occupant declared inline in the same buildFromArray still wins at build time', () => {
    const data = [
      ['=TRANSPOSE(C1:E1)', null, 1, 2, 3],
      ['x'],
    ]

    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    expect(hf.getCellValue(adr('A2'))).toBe('x')
    expect(hf.getCellValue(adr('A3'))).toBe(null)

    hf.destroy()
  })

  // Array-vs-array collisions ALWAYS keep #SPILL!, even in overwrite mode: the flag clears
  // static occupants but must never clobber another array (matches Excel, and avoids corrupting
  // the pre-existing array). Guarded by DependencyGraph.canOverwriteArrayResult / overwriteWouldHitArray.
  it('ON: array-vs-array collision stays #SPILL! and leaves the pre-existing array intact', () => {
    // First array at B2 spills B2:B4 = 1,2,3 into free space.
    const hf = HyperFormula.buildFromArray([
      [null, null, 1, 2, 3],
      [null, '=TRANSPOSE(C1:E1)'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    expect(hf.getCellValue(adr('B2'))).toBe(1)

    // A second array at B1 would spill B1:B2, hitting the first array's anchor at B2.
    hf.setCellContents(adr('B1'), [['=TRANSPOSE(C1:D1)']])

    const b1 = hf.getCellValue(adr('B1'))
    expect(b1 instanceof DetailedCellError).toBe(true)
    expect((b1 as DetailedCellError).type).toBe(ErrorType.SPILL)
    // the pre-existing array is left untouched (no corruption)
    expect(hf.getCellValue(adr('B2'))).toBe(1)
    expect(hf.getCellValue(adr('B3'))).toBe(2)
    expect(hf.getCellValue(adr('B4'))).toBe(3)

    hf.destroy()
  })

  it('ON: overwrites a formula occupant (recalc path)', () => {
    const hf = HyperFormula.buildFromArray([
      [null, null, 1, 2, 3],
      ['=C1+100'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    expect(hf.getCellValue(adr('A2'))).toBe(101)

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']])

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2) // formula occupant overwritten
    expect(hf.getCellValue(adr('A3'))).toBe(3)

    hf.destroy()
  })

  it('ON: overwrites a 2-D block of occupants (MMULT 2x2)', () => {
    const hf = HyperFormula.buildFromArray([
      [null, null, null, 1, 0, null, 1, 0],
      ['x', 'y', null, 0, 1, null, 0, 1],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    hf.setCellContents(adr('A1'), [['=MMULT(D1:E2,G1:H2)']]) // 2x2 spill A1:B2 over A2='x', B2='y'

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('B1'))).toBe(0)
    expect(hf.getCellValue(adr('A2'))).toBe(0) // occupant 'x' overwritten
    expect(hf.getCellValue(adr('B2'))).toBe(1) // occupant 'y' overwritten

    hf.destroy()
  })

  // The overwrite is destructive on the live sheet, but the cleared occupants are recorded on
  // the undo stack, so undo restores them.
  it('ON: undo of an overwrite restores the overwritten occupant', () => {
    const hf = HyperFormula.buildFromArray([
      [null, null, 1, 2, 3],
      ['x'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']]) // overwrites A2='x'
    expect(hf.getCellValue(adr('A2'))).toBe(2)

    hf.undo()

    expect(hf.getCellValue(adr('A1'))).toBe(null) // formula removed
    expect(hf.getCellValue(adr('A2'))).toBe('x') // overwritten occupant restored

    hf.destroy()
  })

  it('ON: redo after undo re-applies the overwrite', () => {
    const hf = HyperFormula.buildFromArray([
      [null, null, 1, 2, 3],
      ['x'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:E1)']]) // overwrites A2='x'
    hf.undo()
    expect(hf.getCellValue(adr('A2'))).toBe('x') // restored

    hf.redo()

    expect(hf.getCellValue(adr('A1'))).toBe(1)
    expect(hf.getCellValue(adr('A2'))).toBe(2) // overwrite re-applied

    hf.destroy()
  })

  it('ON: undo of a blocked array-vs-array spill leaves the pre-existing array intact', () => {
    // First array at B2 spills B2:B4 = 1,2,3 into free space.
    const hf = HyperFormula.buildFromArray([
      [null, null, 1, 2, 3],
      [null, '=TRANSPOSE(C1:E1)'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    expect(hf.getCellValue(adr('B2'))).toBe(1)

    // A second array at B1 would spill B1:B2, hitting the first array's anchor at B2 -> #SPILL!.
    hf.setCellContents(adr('B1'), [['=TRANSPOSE(C1:D1)']])
    expect((hf.getCellValue(adr('B1')) as DetailedCellError).type).toBe(ErrorType.SPILL)

    hf.undo()

    expect(hf.getCellValue(adr('B1'))).toBe(null) // failed spill removed
    // pre-existing array is untouched by the undo (nothing was overwritten to restore)
    expect(hf.getCellValue(adr('B2'))).toBe(1)
    expect(hf.getCellValue(adr('B3'))).toBe(2)
    expect(hf.getCellValue(adr('B4'))).toBe(3)

    hf.destroy()
  })

  // With useColumnIndex, overwriting a cell must drop its old value from the column index,
  // otherwise VLOOKUP/MATCH could still match an overwritten value (stale index).
  it('ON + useColumnIndex: overwrite drops the stale value from the column index', () => {
    // A1:A3 = 10,20,30; G1:I1 = 100,200,300; K1 = MATCH(20, A1:A3); L1 = MATCH(200, A1:A3)
    const hf = HyperFormula.buildFromArray([
      [10, null, null, null, null, null, 100, 200, 300, null, '=MATCH(20,A1:A3,0)', '=MATCH(200,A1:A3,0)'],
      [20],
      [30],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true, useColumnIndex: true})
    expect(hf.getCellValue(adr('K1'))).toBe(2) // 20 initially at A2

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(G1:I1)']]) // A1:A3 -> 100,200,300

    expect(hf.getCellValue(adr('A2'))).toBe(200)
    const match20 = hf.getCellValue(adr('K1'))
    expect(match20 instanceof DetailedCellError).toBe(true) // 20 is gone -> #N/A (not stale)
    expect((match20 as DetailedCellError).type).toBe(ErrorType.NA)
    expect(hf.getCellValue(adr('L1'))).toBe(2) // 200 now at A2

    hf.destroy()
  })

  // Finding #1 (Bugbot): replacing/expanding an EXISTING array so it overwrites a NEW static cell
  // must snapshot that static cell for undo. Previously overwrittenOccupantAddresses bailed out on
  // ANY array in the spill range — including the array being replaced at the anchor — so nothing
  // was captured and undo lost the static occupant. The anchor's own array is now excluded from
  // the block, so only a genuinely new static occupant (A3) is snapshotted.
  it('ON: undo of an array EXPANDED over a new static cell restores that cell', () => {
    // A1=TRANSPOSE(D1:E1) spills A1:A2 = 10,20 into free space; A3 = 99 (static).
    const hf = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E1)', null, null, 10, 20, 30],
      [null],
      [99],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})
    expect(hf.getCellValue(adr('A2'))).toBe(20)
    expect(hf.getCellValue(adr('A3'))).toBe(99)

    // Expand the array to A1:A3 = 10,20,30, overwriting the static A3 = 99.
    hf.setCellContents(adr('A1'), [['=TRANSPOSE(D1:F1)']])
    expect(hf.getCellValue(adr('A3'))).toBe(30) // 99 overwritten by the expanded spill

    hf.undo()

    expect(hf.getCellValue(adr('A1'))).toBe(10) // original array re-spilled
    expect(hf.getCellValue(adr('A2'))).toBe(20)
    expect(hf.getCellValue(adr('A3'))).toBe(99) // overwritten static cell restored (finding #1)

    hf.destroy()
  })

  // Finding #3 on the array-replace path: expanding an array over a static cell with useColumnIndex
  // must drop the overwritten value from the column index (not just the plain overwrite path).
  it('ON + useColumnIndex: expanding an array over a static cell drops the stale value from the column index', () => {
    // A1=TRANSPOSE(D1:E1) spills A1:A2 = 10,20; A3 = 99; H1 = MATCH(99, A1:A3).
    const hf = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E1)', null, null, 10, 20, 30, null, '=MATCH(99,A1:A3,0)'],
      [null],
      [99],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true, useColumnIndex: true})
    expect(hf.getCellValue(adr('H1'))).toBe(3) // 99 at A3

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(D1:F1)']]) // expand to A1:A3 = 10,20,30

    expect(hf.getCellValue(adr('A3'))).toBe(30)
    const match99 = hf.getCellValue(adr('H1'))
    expect(match99 instanceof DetailedCellError).toBe(true) // 99 gone -> #N/A (not stale)
    expect((match99 as DetailedCellError).type).toBe(ErrorType.NA)

    hf.destroy()
  })

  // Undoing an expand-overwrite must also drop the vacated spill values from the column index —
  // restore goes through restoreCell -> setFormulaToCellFromCache, which now applies the shrink's
  // content changes to the column search (otherwise a lookup could still match a value undo removed).
  it('ON + useColumnIndex: undo of an expand-overwrite drops the vacated value from the column index', () => {
    // A1=TRANSPOSE(D1:E1) spills A1:A2 = 10,20; A3 = 99; K1 = MATCH(30, A1:A3).
    const hf = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E1)', null, null, 10, 20, 30, null, null, null, null, '=MATCH(30,A1:A3,0)'],
      [null],
      [99],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true, useColumnIndex: true})

    hf.setCellContents(adr('A1'), [['=TRANSPOSE(D1:F1)']]) // expand to A1:A3 = 10,20,30 (overwrites 99)
    expect(hf.getCellValue(adr('K1'))).toBe(3) // 30 now at A3

    hf.undo() // back to A1:A2 = 10,20, A3 = 99

    expect(hf.getCellValue(adr('A3'))).toBe(99) // value restored
    const match30 = hf.getCellValue(adr('K1'))
    expect(match30 instanceof DetailedCellError).toBe(true) // 30 vacated -> #N/A (not stale)
    expect((match30 as DetailedCellError).type).toBe(ErrorType.NA)

    hf.destroy()
  })

  // Documents the copy/paste boundary relevant to Bugbot finding #2. Copying an array cell captures
  // its VALUE (getClipboardCell materializes ArrayFormulaVertex cells), NOT the array formula, so a
  // paste writes a plain value that never spills. There is therefore no public copy/paste path that
  // spills an array over occupied cells, and the flag has no effect on paste. Pinned so a future
  // change to copy semantics (preserving array formulas) is a conscious decision that would also
  // need paste-undo of the overwritten occupants.
  it('ON: pasting a copied array anchor writes its value and does NOT overwrite occupants (copy materializes arrays)', () => {
    const hf = HyperFormula.buildFromArray([
      ['=TRANSPOSE(G1:I1)', null, null, 'x', null, null, 100, 200, 300],
      [null, null, null, 'y'],
      [null, null, null, 'z'],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    hf.copy({start: adr('A1'), end: adr('A1')}) // captures the VALUE 100, not =TRANSPOSE(...)
    hf.paste(adr('D1'))

    expect(hf.getCellValue(adr('D1'))).toBe(100) // pasted value, not a spill
    expect(hf.getCellValue(adr('D2'))).toBe('y') // occupant intact (no spill, no overwrite)
    expect(hf.getCellValue(adr('D3'))).toBe('z')

    hf.destroy()
  })

  // Bugbot (PR #1714, round 1): overwriting an occupant recorded its previous value by calling
  // `getCellValue`, which throws for a `ScalarFormulaVertex` that hasn't been computed yet -- the
  // normal state of a sibling cell set earlier in the same batch()/suspendEvaluation() block, since
  // evaluation only runs once the batch is committed. That throw aborted the whole operation before
  // the spill landed (and could even corrupt graph state, since `batch()`'s catch handler calls
  // `resumeEvaluation()` before rethrowing, and that call could itself throw against the half-applied
  // exchange, masking the original error). Fixed by reading the occupant via the non-throwing
  // `valueOrUndef()` accessor every `FormulaVertex` exposes, treating an uncomputed occupant as
  // `EmptyValue`.
  it('ON: array spilling over an occupant formula that is not yet computed (inside batch) does not throw', () => {
    const hf = HyperFormula.buildFromArray([
      [0, 1, 10],
      [null, null, 20],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true})

    expect(() => {
      hf.batch(() => {
        // B1 becomes a formula whose value is not computed yet (batch suspends evaluation).
        hf.setCellContents(adr('B1'), '=A1+1')
        // A1's spill claims B1 while it is still uncomputed.
        hf.setCellContents(adr('A1'), [['=TRANSPOSE(C1:C2)']])
      })
    }).not.toThrow()

    expect(hf.getCellValue(adr('A1'))).toBe(10)
    expect(hf.getCellValue(adr('B1'))).toBe(20)

    hf.destroy()
  })

  // Bugbot (PR #1714, round 1): `setFormulaToCellFromCache` returns overwrite `ContentChanges`, but
  // `rewriteAffectedArrays` (the structural caller used by doAddRows/doRemoveRows/doAddColumns/
  // doRemoveColumns to re-place arrays whose dependencies shifted) ignored that return value. When a
  // structural insert/delete grows an array so it overwrites a previously-static cell under the
  // overwrite flag, the stale value was never dropped from the column index, so MATCH/VLOOKUP could
  // still match it. Fixed by applying the returned changes to the column index at this call site only
  // (mirroring the existing `restoreCell` pattern), without threading extra undo entries through
  // insert/delete -- that half is a documented, deliberately out-of-scope limitation.
  it('ON + useColumnIndex: addColumns growing an array over a static cell drops the stale value from the column index', () => {
    // A1 = TRANSPOSE(D1:E1) spills A1:A2 = 10,20. A3 = 99 (static, not yet overlapped).
    // C1 = MATCH(99, A1:A3, 0) sits left of D1:E1 so the column insertion never shifts it.
    const hf = HyperFormula.buildFromArray([
      ['=TRANSPOSE(D1:E1)', null, '=MATCH(99,A1:A3,0)', 10, 20],
      [null],
      [99],
    ], {licenseKey: 'gpl-v3', arrayFunctionResultOverwritesData: true, useColumnIndex: true})

    expect(hf.getCellValue(adr('A3'))).toBe(99)
    expect(hf.getCellValue(adr('C1'))).toBe(3) // 99 found at row 3

    // Insert a column inside D1:E1 (at E's position), extending the reference to D1:F1 and growing
    // the array from 1x2 to 1x3 -- it now spills over A3, overwriting the static 99 there.
    hf.addColumns(0, [4, 1])

    expect(hf.getCellValue(adr('A3'))).toBe(20) // spilled value, 99 is gone

    const match99 = hf.getCellValue(adr('C1'))
    expect(match99 instanceof DetailedCellError).toBe(true) // must be #N/A, not a stale match
    expect((match99 as DetailedCellError).type).toBe(ErrorType.NA)

    hf.destroy()
  })
})
