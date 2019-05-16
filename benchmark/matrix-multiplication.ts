import {sheetCellAddressToString} from '../src/Cell'
import {Config as EngineConfig} from '../src/Config'
import {benchmark, ExpectedValue} from './benchmark'

function randomNumber(from: number, to: number): number {
  const span = to - from
  return Math.random() * span + from
}

export function sheet(): string[][] {
  const matrixSize = 1000

  const sheet = []
  const current = 1
  for (let i = 0; i < matrixSize; i++) {
    const rowToPush: string[] = []
    for (let j = 0; j < matrixSize; j++) {
      rowToPush.push(randomNumber(1, 1000).toString())
    }
    rowToPush.push("")
    for (let j = 0; j < matrixSize; j++) {
      rowToPush.push(randomNumber(1, 1000).toString())
    }
    sheet.push(rowToPush)
  }
  for (let i = 0; i < matrixSize; i++) {
    const rowToPush: string[] = []
    for (let j = 0; j < matrixSize; j++) {
      rowToPush.push(`{=MMULT(A1:${sheetCellAddressToString({ row: matrixSize - 1, col: matrixSize - 1 })}, ${sheetCellAddressToString({ row: 0, col: matrixSize + 1 })}:${sheetCellAddressToString({ row: matrixSize - 1, col: matrixSize * 2 })})}`)
    }
    sheet.push(rowToPush)
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
  ]
}

async function start() {
  const s = sheet()

  console.info('\n === Sheet Matrix Multiplication -- GPU === ')
  await benchmark(s, expectedValues(s), { millisecondsPerThousandRows: 8000, numberOfRuns: 3, engineConfig: new EngineConfig({ gpuMode: 'gpu' })  })
  console.info('\n === Sheet Matrix Multiplication -- CPU === ')
  await benchmark(s, expectedValues(s), { millisecondsPerThousandRows: 8000, numberOfRuns: 3, engineConfig: new EngineConfig({ gpuMode: 'cpu' }) })
}

start()
