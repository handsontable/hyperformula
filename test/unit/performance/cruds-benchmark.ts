import {HyperFormula} from '../../../src'
import {batch, benchmarkCruds, BenchmarkResult} from './benchmark'
import {sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {sheet as sheetBGenerator} from './sheets/10-sheet-b'
import {sheet as columnRangesGenerator} from './sheets/column-ranges'
import {adr} from './utils/utils'

export function runCrudsBenchmark(): BenchmarkResult[] {
  const result: BenchmarkResult[] = []
  const sheetA = sheetAGenerator(10000)
  const sheetB = sheetBGenerator(5000)
  const columnRanges = columnRangesGenerator()

  batch(result,
    () => benchmarkCruds('Sheet A:  change value, add/remove row/column', sheetA, (engine: HyperFormula) => {
      engine.setCellContents(adr('A1'), '123')
      engine.addRows(0, [5000, 1])
      engine.removeRows(0, [8000, 1])
      engine.addColumns(0, [0, 1])
      engine.removeColumns(0, [0, 1])
    }, [
      {address: 'E7000', value: -1.17344394901827e+23},
    ], { numberOfRuns: 100 }),

    () => benchmarkCruds('Sheet B: change value, add/remove row/column', sheetB, (engine: HyperFormula) => {
      engine.setCellContents(adr('A1'), '123')
      engine.addRows(0, [2000, 1])
      engine.removeRows(0, [3000, 1])
      engine.addColumns(0, [0, 1])
      engine.removeColumns(0, [0, 1])
    }, [
      {address: 'E50', value: 1347},
      {address: 'E2002', value: 2001122},
    ], { numberOfRuns: 100 }),

    () => benchmarkCruds('Column ranges - add column', columnRanges, (engine: HyperFormula) => {
      engine.addColumns(0, [1, 1])
      engine.setCellContents(adr('A1'), 5)
    }, [
      {address: 'AY50', value: 3.47832712968835e+63},
    ], { numberOfRuns: 100 }),

    () => benchmarkCruds('Column ranges - without batch', columnRanges, (engine: HyperFormula) => {
      engine.setCellContents(adr('A1'), 1)
      engine.setCellContents(adr('A1'), 2)
      engine.setCellContents(adr('A1'), 3)
      engine.setCellContents(adr('A1'), 4)
      engine.setCellContents(adr('A1'), 5)
    }, [
      {address: 'AX50', value: 3.47832712968835e+63},
    ], { numberOfRuns: 100 }),

    () => benchmarkCruds('Column ranges - batch', columnRanges, (engine: HyperFormula) => {
      engine.batch(() => {
        engine.setCellContents(adr('A1'), 1)
        engine.setCellContents(adr('A1'), 2)
        engine.setCellContents(adr('A1'), 3)
        engine.setCellContents(adr('A1'), 4)
        engine.setCellContents(adr('A1'), 5)
      })
    }, [
      {address: 'AX50', value: 3.47832712968835e+63},
    ], { numberOfRuns: 100 })
  )

  return result
}
