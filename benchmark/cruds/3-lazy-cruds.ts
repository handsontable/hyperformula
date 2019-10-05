import {HandsOnEngine} from '../../src'
import {Sheet} from '../../src/GraphBuilder'
import {sheet as Sb} from '../sheets/01-simple-big'
import {sheet as Bs} from '../sheets/06-big-sum'
import {logStats, measureCruds} from '../stats'

function addRow(sheet: Sheet, row: number, stats: any[]) {
  const engine = HandsOnEngine.buildFromArray(sheet)
  return measureCruds(engine, stats, `Add row: ${row}`, () => engine.addRows(0, row, 1))
}

function addColumn(sheet: Sheet, column: number, stats: any[]) {
  const engine = HandsOnEngine.buildFromArray(sheet)
  return measureCruds(engine, stats, `Add column: ${column}`, () => engine.addColumns(0, column, 1))
}

function removeRow(sheet: Sheet, row: number, stats: any[]) {
  const engine = HandsOnEngine.buildFromArray(sheet)
  return measureCruds(engine, stats, `Remove row: ${row}`, () => engine.removeRows(0, row, row))
}

function removeColumn(sheet: Sheet, column: number, stats: any[]) {
  const engine = HandsOnEngine.buildFromArray(sheet)
  return measureCruds(engine, stats, `Remove column: ${column}`, () => engine.removeRows(0, column, column))
}

function start(sheet: Sheet, title: string) {
  const height = sheet.length
  const width = sheet[0].length
  const stats: any[] = []

  console.log(title)

  addRow(sheet, 0, stats)
  addRow(sheet, Math.floor(height / 2), stats)
  addRow(sheet, height - 1, stats)

  addColumn(sheet, 0, stats)
  addColumn(sheet, Math.floor(width / 2), stats)
  addColumn(sheet, width - 1, stats)

  removeRow(sheet, 0, stats)
  removeRow(sheet, Math.floor(height / 2), stats)
  removeRow(sheet, height - 1, stats)

  removeColumn(sheet, 0, stats)
  removeColumn(sheet, Math.floor(width / 2), stats)
  removeColumn(sheet, width - 1, stats)

  logStats(stats)
}

start(Sb(10000), '=== Simple Big ===')
start(Bs(10000), '=== Big Sum ===')
