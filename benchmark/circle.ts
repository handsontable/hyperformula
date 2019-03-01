import {benchmark} from './benchmark'
import {expectedValues as eSb, sheet as Sb} from './sheets/01-simple-big'
import {expectedValues as expectedValuesMarkov, sheet as sheetMarkovFn} from './sheets/03-sheet-markov'
import {expectedValues as expectedValuesPrefixSum, sheet as sheetPrefixSumFn} from './sheets/04-sheet-prefix-sum'
import {expectedValues as eT, sheet as T} from './sheets/05-sheet-t'
import {sheet as Bs} from './sheets/06-big-sum'
import {expectedValues as expectedValuesA, sheet as sheetAFn} from './sheets/09-sheet-a'
import {expectedValues as expectedValuesB, sheet as sheetBFn} from './sheets/10-sheet-b'
import {expectedValues as expectedValuesManyMedians, sheet as sheetManyMediansFn} from './sheets/11-many-medians'

const simpleBig = Sb()
const sheetMarkov = sheetMarkovFn()
const sheetPrefixSum = sheetPrefixSumFn()
const sheetT = T()
const bigSum = Bs()
const sheetA = sheetAFn()
const sheetB = sheetBFn()
const sheetManyMedians = sheetManyMediansFn()

console.info(' === Simple Big === ')
benchmark(simpleBig, eSb(simpleBig), { millisecondsPerThousandRows: 150, numberOfRuns: 3 })
console.info('\n === Sheet Markov === ')
benchmark(sheetMarkov, expectedValuesMarkov(sheetMarkov), { millisecondsPerThousandRows: 60, numberOfRuns: 3 })
console.info('\n === Sheet Prefix Sum === ')
benchmark(sheetPrefixSum, expectedValuesPrefixSum(sheetPrefixSum), { millisecondsPerThousandRows: 70, numberOfRuns: 3 })
console.info('\n === Sheet T === ')
benchmark(sheetT, eT(sheetT), { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
console.info('\n === Big sum === ')
benchmark(bigSum, [], { millisecondsPerThousandRows: 70, numberOfRuns: 3 })
console.info('\n === Sheet A === ')
benchmark(sheetA, expectedValuesA(sheetA), { millisecondsPerThousandRows: 60, numberOfRuns: 3 })
console.info('\n === Sheet B === ')
benchmark(sheetB, expectedValuesB(sheetB), { millisecondsPerThousandRows: 60, numberOfRuns: 3 })
// console.info('\n === Sheet Many Medians === ')
// benchmark(sheetManyMedians, expectedValuesManyMedians(sheetManyMedians), { millisecondsPerThousandRows: 6000, numberOfRuns: 3 })
