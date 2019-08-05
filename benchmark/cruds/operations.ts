import {HandsOnEngine} from '../../src'

export function addColumns(engine: HandsOnEngine) {
  let dimensions = getDimensions(engine)
  measure(engine, 'Add column at the beginning', () => engine.addColumns(0, 0, 1))
  dimensions = getDimensions(engine)
  measure(engine, 'Add column in the middle   ', () => engine.addColumns(0, half(dimensions.width), 1))
  dimensions = getDimensions(engine)
  measure(engine, 'Add column at the end      ', () => engine.addColumns(0, dimensions.width - 1, 1))
}

export function addRows(engine: HandsOnEngine) {
  let dimensions = getDimensions(engine)
  measure(engine, 'Add row at the beginning', () => engine.addRows(0, 0, 1))
  dimensions = getDimensions(engine)
  measure(engine, 'Add row in the middle   ', () => engine.addRows(0, half(dimensions.height), 1))
  dimensions = getDimensions(engine)
  measure(engine, 'Add row at the end      ', () => engine.addRows(0, dimensions.height - 1, 1))
}

export function removeColumns(engine: HandsOnEngine) {
  let dimensions = getDimensions(engine)
  measure(engine, 'Remove column at the beginning', () => engine.removeColumns(0, 0, 0))
  dimensions = getDimensions(engine)
  measure(engine, 'Remove column in the middle   ', () => engine.removeColumns(0, half(dimensions.width), half(dimensions.width)))
  dimensions = getDimensions(engine)
  measure(engine, 'Remove column at the end      ', () => engine.removeColumns(0, dimensions.width - 1, dimensions.width - 1))
}

export function removeRows(engine: HandsOnEngine) {
  let dimensions = getDimensions(engine)
  measure(engine, 'Remove row at the beginning', () => engine.removeRows(0, 0, 0))
  dimensions = getDimensions(engine)
  measure(engine, 'Remove row in the middle   ', () => engine.removeRows(0, half(dimensions.height), half(dimensions.height)))
  dimensions = getDimensions(engine)
  measure(engine, 'Remove row at the end      ', () => engine.removeRows(0, dimensions.height - 1, dimensions.height - 1))
}

export function batch(engine: HandsOnEngine) {
  addRows(engine)
  addColumns(engine)
  removeRows(engine)
  removeColumns(engine)
}

function half(num: number) {
  return Math.floor(num / 2)
}

function getDimensions(engine: HandsOnEngine) {
  return engine.getSheetsDimensions().get('Sheet1')!
}

function measure<T>(engine: HandsOnEngine, name: String, func: () => T): { time: number, result: T } {
  const start = Date.now()
  const result = func()
  const end = Date.now()
  const time = end - start
  console.log(`${name}: ${time} ms (${serializeStats(engine.getStats())})`)
  return { time, result}
}

function serializeStats(statsSnapshot: Map<string, number>): string {
  let elems = []
  for (const [statType, val] of statsSnapshot.entries()) {
    elems.push(`${statType}: ${val}ms`)
  }
  return `(${elems.join("; ")})`
}
