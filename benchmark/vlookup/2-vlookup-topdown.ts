import {Config as EngineConfig} from '../../src'
import {benchmark} from '../benchmark'

export function topdown(rows: number, vlookupLines: number) {
  const sheet = []

  let prev = 1
  while (prev <= rows) {
    sheet.push([(rows - prev + 1).toString()])
    prev++
  }

  for (let i = 0; i < vlookupLines; ++i) {
    sheet.push([`=VLOOKUP(1, A1:B${rows}, 1, false())`])
  }

  return sheet
}

function start() {
  const rows = 10000
  benchmark(topdown(rows, 1000), [
    {address: `A${rows}`, value: 1},
  ], { millisecondsPerThousandRows: 10000, numberOfRuns: 3, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
}

start()
