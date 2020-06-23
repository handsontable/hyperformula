import {benchmark} from './benchmark'
import {expectedValues as expectedValuesT, sheet as sheetTGenerator} from './sheets/05-sheet-t'
import {expectedValues as expectedValuesA, sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {expectedValues as expectedValuesB, sheet as sheetBGenerator} from './sheets/10-sheet-b'
import {sheet as columnRangesGenerator} from './sheets/column-ranges'

(() => {
  const sheetA = sheetAGenerator()
  const sheetB = sheetBGenerator()
  const sheetT = sheetTGenerator()
  const infiniteRanges = columnRangesGenerator()

  benchmark('Sheet A', sheetA, expectedValuesA(sheetA), {expectedTime: 600, numberOfRuns: 10})
  benchmark('Sheet B', sheetB, expectedValuesB(sheetB), {expectedTime: 300, numberOfRuns: 10})
  benchmark('Sheet T', sheetT, expectedValuesT(sheetT), {expectedTime: 250, numberOfRuns: 10})
  benchmark('Column ranges', infiniteRanges, [{
    address: 'AX50',
    value: 1.04519967355127e+63
  }], {expectedTime: 1000, numberOfRuns: 10})
})()