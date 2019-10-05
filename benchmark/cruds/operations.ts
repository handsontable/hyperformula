import {HandsOnEngine} from '../../src'
import {logStats, measureCruds} from "../stats";

export function addColumns(engine: HandsOnEngine, stats: any[]) {
  let dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add column at the beginning', () => engine.addColumns(0, 0, 1))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add column in the middle   ', () => engine.addColumns(0, half(dimensions.width), 1))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add column at the end      ', () => engine.addColumns(0, dimensions.width - 1, 1))
}

export function addRows(engine: HandsOnEngine, stats: any[]) {
  let dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add row at the beginning', () => engine.addRows(0, 0, 1))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add row in the middle   ', () => engine.addRows(0, half(dimensions.height), 1))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Add row at the end      ', () => engine.addRows(0, dimensions.height - 1, 1))
}

export function removeColumns(engine: HandsOnEngine, stats: any[]) {
  let dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove column at the beginning', () => engine.removeColumns(0, 0, 0))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove column in the middle   ', () => engine.removeColumns(0, half(dimensions.width), half(dimensions.width)))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove column at the end      ', () => engine.removeColumns(0, dimensions.width - 1, dimensions.width - 1))
}

export function removeRows(engine: HandsOnEngine, stats: any[]) {
  let dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove row at the beginning', () => engine.removeRows(0, 0, 0))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove row in the middle   ', () => engine.removeRows(0, half(dimensions.height), half(dimensions.height)))
  dimensions = getDimensions(engine)
  measureCruds(engine, stats, 'Remove row at the end      ', () => engine.removeRows(0, dimensions.height - 1, dimensions.height - 1))
}

export function batch(engine: HandsOnEngine) {
  const stats: any[] = []
  addRows(engine, stats)
  addColumns(engine, stats)
  removeRows(engine, stats)
  removeColumns(engine, stats)
  logStats(stats)
}

export function half(num: number) {
  return Math.floor(num / 2)
}

export function getDimensions(engine: HandsOnEngine) {
  return engine.getSheetsDimensions().get('Sheet1')!
}

