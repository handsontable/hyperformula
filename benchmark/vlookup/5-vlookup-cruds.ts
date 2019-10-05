import {Config, HandsOnEngine} from '../../src'
import {simpleCellAddress} from '../../src/Cell'
import {logStats, statsToObject} from '../stats'
import { repeating2} from './sheets'

(() => {
  const stats = []
  const sheet = repeating2(10000, 100, 100)
  const engine = HandsOnEngine.buildFromArray(sheet, new Config({ matrixDetection: false, vlookupThreshold: 1, useColumnIndex: true }))

  stats.push(statsSnapshot('build engine', engine))
  engine.setCellContent(simpleCellAddress(0, 0, 8000), '42')
  engine.setCellContent(simpleCellAddress(0, 0, 8000), '43')
  engine.setCellContent(simpleCellAddress(0, 0, 8000), '44')
  stats.push(statsSnapshot('after changing some values', engine))
  engine.addRows(0, 0, 10)
  stats.push(statsSnapshot('after adding 10 rows', engine))
  engine.removeRows(0, 0, 9)
  stats.push(statsSnapshot('after removing 10 rows', engine))
  engine.addColumns(0, 0, 10)
  stats.push(statsSnapshot('after adding 10 cols', engine))
  engine.removeColumns(0, 0, 9)
  stats.push(statsSnapshot('after removing 10 cols', engine))
  engine.setCellContent(simpleCellAddress(0, 1, 9000), '45')
  engine.setCellContent(simpleCellAddress(0, 1, 9000), '46')
  engine.setCellContent(simpleCellAddress(0, 1, 9000), '47')
  stats.push(statsSnapshot('after changing some values', engine))
  logStats(stats)
})()

export function statsSnapshot(name: string, engine: HandsOnEngine) {
  const stats = engine.getStats() as Map<string, any>
  stats.set('NAME', name)
  return statsToObject(stats)
}
