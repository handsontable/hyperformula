import {benchmarkCruds} from './benchmark'
import {adr} from './utils/utils'
import {HyperFormula} from '../../src'
import {sheet as sheetAGenerator} from './sheets/09-sheet-a'
import {sheet as sheetBGenerator} from './sheets/10-sheet-b'

(() => {
  benchmarkCruds('Sheet A:  change value, add/remove row/column', sheetAGenerator(10000), (engine: HyperFormula) => {
    engine.setCellContents(adr('A1'), '123')
    engine.addRows(0, [5000, 1])
    engine.removeRows(0, [8000, 1])
    engine.addColumns(0, [0, 1])
    engine.removeColumns(0, [0, 1])
  }, [
    {address: 'E7000', value: -1.17344394901827e+23},
  ], {
    expectedTime: 100,
    engineConfig: {matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}
  })

  benchmarkCruds('Sheet B: change value, add/remove row/column', sheetBGenerator(5000), (engine: HyperFormula) => {
    engine.setCellContents(adr('A1'), '123')
    engine.addRows(0, [2000, 1])
    engine.removeRows(0, [3000, 1])
    engine.addColumns(0, [0, 1])
    engine.removeColumns(0, [0, 1])
  }, [
    {address: 'E50', value: 1347},
    {address: 'E2002', value: 2001122},
  ], {
    expectedTime: 300,
    engineConfig: {matrixDetection: false, vlookupThreshold: 1, useColumnIndex: false}
  })
})()
