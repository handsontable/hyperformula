import {Config as EngineConfig} from '../../src'
import {benchmark} from '../benchmark'

export function repeating(rows: number, differentValues: number, vlookupLines: number) {
  const sheet = []
  const half = Math.floor(rows / 2)

  for (let i = 0; i < half; ++i) {
    sheet.push([`=A${(rows - i)}`])
  }

  for (let i = half; i < rows; ++i) {
    sheet.push([(i % differentValues).toString()])
  }

  for (let i = 0; i < vlookupLines; ++i) {
    const row = []
    for (let i = 0; i < differentValues; ++i) {
      row.push(`=VLOOKUP(${i}, A1:A${rows}, 1, false())`)
    }
    sheet.push(row)
  }

  return sheet
}

function start() {
  const rows = 10000
  const differentValues = 4
  const vlookupLines = 1000
  const engine = benchmark(repeating(rows, differentValues, vlookupLines), [], { millisecondsPerThousandRows: 10000, numberOfRuns: 10, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
}

start()
