import {benchmark} from './benchmark'
import {expectedValues as expectedValuesT, sheet as sheetTGenerator} from './sheets/05-sheet-t'
import {expectedValues as expectedValuesA, sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {expectedValues as expectedValuesB, sheet as sheetBGenerator} from './sheets/10-sheet-b'

function start() {
  const sheetA = sheetAGenerator()
  const sheetB = sheetBGenerator()
  const sheetT = sheetTGenerator()

  benchmark('Sheet A', sheetA, expectedValuesA(sheetA), { millisecondsPerThousandRows: 60, numberOfRuns: 10 })
  benchmark('Sheet B', sheetB, expectedValuesB(sheetB), { millisecondsPerThousandRows: 60, numberOfRuns: 10 })
  benchmark('Sheet T', sheetT, expectedValuesT(sheetT), { millisecondsPerThousandRows: 25, numberOfRuns: 10 })
}
start()
