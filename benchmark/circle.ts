import {benchmark} from './benchmark'
import {expectedValues as eSb, sheet as Sb} from './sheets/01-simple-big'
import {expectedValues as eA, sheet as A} from './sheets/03-sheet-a'
import {expectedValues as eB, sheet as B} from './sheets/04-sheet-b'
import {expectedValues as eT, sheet as T} from './sheets/05-sheet-t'
import {sheet as Bs} from './sheets/06-big-sum'

const simpleBig = Sb()
const sheetA = A()
const sheetB = B()
const sheetT = T()
const bigSum = Bs()

console.info(' === Simple Big === ')
benchmark(simpleBig, eSb(simpleBig), { millisecondsPerThousandRows: 150, numberOfRuns: 3 })
console.info('\n === Sheet A === ')
benchmark(sheetA, eA(sheetA), { millisecondsPerThousandRows: 60, numberOfRuns: 3 })
console.info('\n === Sheet B === ')
benchmark(sheetB, eB(sheetB), { millisecondsPerThousandRows: 70, numberOfRuns: 3 })
console.info('\n === Sheet T === ')
benchmark(sheetT, eT(sheetT), { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
console.info('\n === Big sum === ')
benchmark(bigSum, [], { millisecondsPerThousandRows: 70, numberOfRuns: 3 })
