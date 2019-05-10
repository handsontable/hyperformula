import {benchmark} from './benchmark'
import {expectedValues as expectedValuesT, sheet as sheetTGenerator} from './sheets/05-sheet-t'
import {expectedValues as expectedValuesA, sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {expectedValues as expectedValuesB, sheet as sheetBGenerator} from './sheets/10-sheet-b'

async function start() {
  const sheetA = sheetAGenerator()
  const sheetB = sheetBGenerator()
  const sheetT = sheetTGenerator()

  console.info('\n === Sheet A === ')
  await benchmark(sheetA, expectedValuesA(sheetA), { millisecondsPerThousandRows: 60, numberOfRuns: 100 })
  console.info('\n === Sheet B === ')
  await benchmark(sheetB, expectedValuesB(sheetB), { millisecondsPerThousandRows: 60, numberOfRuns: 100 })
  console.info('\n === Sheet T === ')
  await benchmark(sheetT, expectedValuesT(sheetT), { millisecondsPerThousandRows: 25, numberOfRuns: 100 })
}
start()
