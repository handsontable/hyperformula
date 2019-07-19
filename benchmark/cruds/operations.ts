import {HandsOnEngine} from "../../src";
import {sheet as Sb} from '../sheets/01-simple-big'


export function addColumns(engine: HandsOnEngine) {
  const dimensions = engine.getSheetsDimensions().get("Sheet1")!

  measure("Add column at the beginning", () => engine.addColumns(0, 0, 1))
  measure("Add column in the middle   ", () => engine.addColumns(0, dimensions.width / 2, 1))
  measure("Add column at the end      ", () => engine.addColumns(0, dimensions.width, 1))
}

export function addRows(engine: HandsOnEngine) {
  const dimensions = engine.getSheetsDimensions().get("Sheet1")!

  measure("Add row at the beginning", () => engine.addRows(0, 0, 1))
  measure("Add row in the middle   ", () => engine.addRows(0, dimensions.height / 2, 1))
  measure("Add row at the end      ", () => engine.addRows(0, dimensions.height, 1))
}

export function removeColumns(engine: HandsOnEngine) {
  const dimensions = engine.getSheetsDimensions().get("Sheet1")!

  measure("Remove column at the beginning", () => engine.removeColumns(0, 0, 1))
  measure("Remove column in the middle   ", () => engine.removeColumns(0, dimensions.width / 2, dimensions.width / 2))
  measure("Remove column at the end      ", () => engine.removeColumns(0, 0, 1))
}

export function removeRows(engine: HandsOnEngine) {
  const dimensions = engine.getSheetsDimensions().get("Sheet1")!

  measure("Remove row at the beginning", () => engine.removeRows(0, 0, 1))
  measure("Remove row in the middle   ", () => engine.removeRows(0, dimensions.height / 2, dimensions.height / 2))
  measure("Remove row at the end      ", () => engine.removeRows(0, dimensions.height, dimensions.height))
}


function measure<T>(name: String, func: () => T): { time: number, result: T } {
  const start = Date.now()
  const result = func()
  const end = Date.now()
  const time = end - start
  console.log(`${name}: ${time} ms`)
  return { time: time, result: result}
}

function init() {
  let engine = HandsOnEngine.buildFromArray(Sb(100000))
  let dimensions = engine.getSheetsDimensions().get("Sheet1")!

  console.log("== Simple big ==", dimensions)

  addRows(engine)
  addColumns(engine)
  removeRows(engine)
  removeColumns(engine)
}

init()
