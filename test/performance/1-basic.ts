import {benchmark} from './benchmark'
import {expectedValues as expectedValuesT, sheet as sheetTGenerator} from './sheets/05-sheet-t'
import {expectedValues as expectedValuesA, sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {expectedValues as expectedValuesB, sheet as sheetBGenerator} from './sheets/10-sheet-b'

(() => {
  const sheetA = sheetAGenerator()
  const sheetB = sheetBGenerator()
  const sheetT = sheetTGenerator()

  benchmark('Sheet A', sheetA, expectedValuesA(sheetA), {expectedTime: 60, numberOfRuns: 10})
  benchmark('Sheet B', sheetB, expectedValuesB(sheetB), {expectedTime: 60, numberOfRuns: 10})
  benchmark('Sheet T', sheetT, expectedValuesT(sheetT), {expectedTime: 25, numberOfRuns: 10})
})()