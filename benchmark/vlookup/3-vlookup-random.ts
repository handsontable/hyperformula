import {benchmark} from "../benchmark";
import {Config as EngineConfig, CsvExporter} from "../../src";

export function randomVlookups(rows: number, cols: number, vlookupLines: number) {
  const sheet = []

  for (let i=0; i<rows; ++i) {
    const row = []
    for (let j=0; j<cols; ++j) {
      row.push(rand(1, rows).toString())
    }
    sheet.push(row)
  }

  for (let i=0; i<vlookupLines; ++i) {
    const row = []
    for (let j=0; j<cols; ++j) {
      const columnLetter= String.fromCharCode(65+j).toUpperCase()
      row.push(`=VLOOKUP(${rand(1, rows).toString()}, ${columnLetter}1:${columnLetter}${rows}, 1, false())`)
    }
    sheet.push(row)
  }

  return sheet
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function start() {
  const rows = 10000
  const cols = 10
  const vlookupLines = 100
  benchmark(randomVlookups(rows, cols, vlookupLines), [], { millisecondsPerThousandRows: 10000, numberOfRuns: 10, engineConfig: new EngineConfig({ matrixDetection: false, vlookupThreshold: 10000000 })  })
}

start()
