import {benchmark} from './benchmark'
import {sheet as T} from './sheets/05-sheet-t'

console.info('\n === Sheet T === ')
benchmark(T(), [], { millisecondsPerThousandRows: 25, numberOfRuns: 100 })
