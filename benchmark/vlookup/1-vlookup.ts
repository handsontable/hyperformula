import {Config as EngineConfig} from '../../src'
import {benchmark} from '../benchmark'

export function simpleSorted(rows: number) {
  const sheet = []

  let prev = 1
  while (prev < rows + 1) {
    sheet.push([prev.toString()])
    prev++
  }

  sheet.push([`=VLOOKUP(1, A1:B${rows}, 1, TRUE())`, `=VLOOKUP(${Math.floor(rows / 2)}, A1:B${rows}, 1, TRUE())`, `=VLOOKUP(${rows}, A1:B${rows}, 1, TRUE())`])

  return sheet
}

function start() {
  const rows = 10000
  benchmark(simpleSorted(rows), [
    {address: `A${rows + 1}`, value: 1},
    {address: `B${rows + 1}`, value: Math.floor(rows / 2)},
    {address: `C${rows + 1}`, value: rows},
  ], { millisecondsPerThousandRows: 10000, numberOfRuns: 3, engineConfig: new EngineConfig({ matrixDetection: false })  })
}

start()
