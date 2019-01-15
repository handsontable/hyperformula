import {benchmark} from './benchmark'
import {sheet as A} from './sheets/03-sheet-a'
import {sheet as B} from './sheets/04-sheet-b'
import {sheet as T} from './sheets/05-sheet-t'

console.info('Sheet A')
benchmark(A(), [], { millisecondsPerThousandRows: 60, numberOfRuns: 100 })
console.info('\nSheet B')
benchmark(B(), [], { millisecondsPerThousandRows: 70, numberOfRuns: 100 })
console.info('\nSheet T')
benchmark(T(), [], { millisecondsPerThousandRows: 25, numberOfRuns: 100 })
