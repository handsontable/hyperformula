import {HyperFormula} from '../src'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {verifyValues} from './testUtils'

/**
 * random int from global variable 'state'
 */

const getInt = (function() {
  let state = 1
  return function() {
    state ^= state << 13
    state ^= state >> 17
    state ^= state << 5
    state &= 0x7FFFFFFF
    return state
  }
})()

/**
 * random float from global variable 'state'
 */
function getFloat(): number {
  return getInt() / 0x80000000
}

/**
 * boolean flag for outputing crud operations
 */
const outputLog = false

/**
 * random int in range between min and max
 *
 * @param min
 * @param max
 */
function randomInteger(min: number, max: number) {
  return Math.floor(getFloat() * (max - min)) + min
}

type Pts = { x: number, y: number }

type Rectangle = { topleft: Pts, bottomright: Pts }

/**
 * picks a random range as a subset of rectangle
 * and builds a formula =SUM(range)
 * @param engine
 * @param rect
 */
function randomRange(engine: HyperFormula, rect: Rectangle): string {
  const x1 = randomInteger(rect.topleft.x, rect.bottomright.x)
  const x2 = randomInteger(rect.topleft.x, rect.bottomright.x)
  const y1 = randomInteger(rect.topleft.y, rect.bottomright.y)
  const y2 = randomInteger(rect.topleft.y, rect.bottomright.y)
  const startAddress = engine.simpleCellAddressToString({
    sheet: 0,
    col: Math.min(x1, x2),
    row: Math.min(y1, y2),
  }, 0)
  const endAddress = engine.simpleCellAddressToString({
    sheet: 0,
    col: Math.max(x1, x2),
    row: Math.max(y1, y2)
  }, 0)
  return '=SUM(' + startAddress + ':' + endAddress + ')'
}

function undoRedo(engine: HyperFormula) {
  if (outputLog) {
    console.log('engine.undo()')
  }
  engine.undo()
  if (outputLog) {
    console.log('engine.redo()')
  }
  engine.redo()
}

/**
 * Fills a rectangle of cells with random formula sums with a random ranges from another rectangle.
 * @param engine
 * @param rectFormulas
 * @param rectValues
 */
function randomSums(engine: HyperFormula, rectFormulas: Rectangle, rectValues: Rectangle) {
  allPts(rectFormulas).forEach((pts) => {
    const formula = randomRange(engine, rectValues)
    if (outputLog) {
      console.log(`engine.setCellContents({sheet: 0, col: ${pts.x}, row: ${pts.y}}, '${formula}')`)
    }
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, formula)
    undoRedo(engine)
  })
}

/**
 * Fills a rectangle of cells with random values.
 * @param engine
 * @param rectValues
 */
function randomVals(engine: HyperFormula, rectValues: Rectangle) {
  allPts(rectValues).forEach((pts) => {
    const val = randomInteger(-10, 10)
    if (outputLog) {
      console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, ${val})`)
    }
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, val)
    undoRedo(engine)
  })
}

/**
 * builds a rectangle from corner + X side length + Y side length
 * @param pts
 * @param sideX
 * @param sideY
 */
function rectangleFromCorner(pts: Pts, sideX: number, sideY: number): Rectangle {
  return {topleft: pts, bottomright: {x: pts.x + sideX, y: pts.y + sideY}}
}

/**
 * all addresses from a rectangle
 *
 * @param rect
 */
function allPts(rect: Rectangle): Pts[] {
  const ret: Pts[] = []
  for (let x = rect.topleft.x; x < rect.bottomright.x; x++) {
    for (let y = rect.topleft.y; y < rect.bottomright.y; y++) {
      ret.push({x, y})
    }
  }
  return ret
}

/**
 * random shuffle of an array
 *
 * @param array
 */
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * swaps two rectangles in-place
 * @param engine
 * @param corner1
 * @param corner2
 * @param sideX
 * @param sideY
 */
function swapTwoRectangles(engine: HyperFormula, pts1: Pts, pts2: Pts, sideX: number, sideY: number) {
  if (outputLog) {
    console.log(`engine.moveCells( AbsoluteCellRange.spanFrom({sheet: 0, col: ${pts1.x}, row: ${pts1.y}}, ${sideX}, ${sideY}), {sheet: 0, col: 1000, row: 1000})`)
  }
  engine.moveCells(AbsoluteCellRange.spanFrom({sheet: 0, col: pts1.x, row: pts1.y}, sideX, sideY), {
    sheet: 0,
    col: 1000,
    row: 1000
  })
  undoRedo(engine)
  if (outputLog) {
    console.log(`engine.moveCells( AbsoluteCellRange.spanFrom({sheet: 0, col: ${pts2.x}, row: ${pts2.y}}, ${sideX}, ${sideY}), {sheet: 0, col: ${pts1.x}, row: ${pts1.y}})`)
  }
  engine.moveCells(AbsoluteCellRange.spanFrom({sheet: 0, col: pts2.x, row: pts2.y}, sideX, sideY), {
    sheet: 0,
    col: pts1.x,
    row: pts1.y
  })
  undoRedo(engine)
  if (outputLog) {
    console.log(`engine.moveCells( AbsoluteCellRange.spanFrom({sheet: 0, col: 1000, row: 1000}, ${sideX}, ${sideY}), {sheet: 0, col: ${pts2.x}, row: ${pts2.y}})`)
  }
  engine.moveCells(AbsoluteCellRange.spanFrom({sheet: 0, col: 1000, row: 1000}, sideX, sideY), {
    sheet: 0,
    col: pts2.x,
    row: pts2.y
  })
  undoRedo(engine)
}

/**
 * Empties the engine using .setCellContents()
 * operates only on sheet: 0
 *
 * @param engine - engine to be emptied
 * @param rect - rectangle of adresses we expect nonempty cell to be in
 *
 * The outcome should be that there are no cells in the engine.
 */
function randomCleanup(engine: HyperFormula, rect: Rectangle) {
  shuffleArray(allPts(rect)).forEach((pts) => {
      if (outputLog) {
        console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, null)`)
      }
      engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, null)
      undoRedo(engine)
    }
  )
}

describe('large psuedo-random test', () => {
  it('growing rectangle + addRows + addColumns + removeRows + removeColumns should produce the same sheet as static sheet', () => {
    const [engine] = HyperFormula.buildFromArray([])
    let sideX = 3
    const n = 4
    let sideY = 3
    for (let rep = 0; rep < 3; rep++) {
      randomVals(engine, rectangleFromCorner({x: 0, y: 0}, sideX, sideY))
      verifyValues(engine)
      for (let i = 0; i < n; i++) {
        randomSums(engine,
          rectangleFromCorner({x: sideX * (i + 1), y: 0}, sideX, sideY),
          rectangleFromCorner({x: sideX * i, y: 0}, sideX, sideY)
        )
        verifyValues(engine)
      }
      for (let i = 0; i < n; i++) {
        randomSums(engine,
          rectangleFromCorner({x: sideX * (i + 1), y: 0}, sideX, sideY),
          rectangleFromCorner({x: 0, y: 0}, sideX * (i + 1), sideY)
        )
        verifyValues(engine)
      }
      for (let i = 0; i < n; i++) {
        const columnPositionToAdd = randomInteger(0, sideX * (n + 1) + 1)
        if (outputLog) {
          console.log(`engine.addColumns(0, [${columnPositionToAdd},2])`)
        }
        engine.addColumns(0, [columnPositionToAdd, 2])
        undoRedo(engine)
        verifyValues(engine)
        const columnPositionToRemove = randomInteger(0, sideX * (n + 1))
        if (outputLog) {
          console.log(`engine.removeColumns(0, [${columnPositionToRemove},1])`)
        }
        engine.removeColumns(0, [columnPositionToRemove, 1])
        undoRedo(engine)
      }
      sideX += 1

      const rowPositionToAdd = randomInteger(0, sideY + 1)
      if (outputLog) {
        console.log(`engine.addRows(0, [${rowPositionToAdd},2])`)
      }
      engine.addRows(0, [rowPositionToAdd, 2])
      undoRedo(engine)
      sideY += 2
      verifyValues(engine)
      const rowPositionToRemove = randomInteger(0, sideY)
      if (outputLog) {
        console.log(`engine.removeRows(0, [${rowPositionToRemove},1])`)
      }
      engine.removeRows(0, [rowPositionToRemove, 1])
      undoRedo(engine)
      sideY -= 1
      verifyValues(engine)
      const x1 = randomInteger(0, n * sideX)
      const x2 = randomInteger(0, n * sideX)
      const y1 = randomInteger(0, sideY)
      const y2 = randomInteger(0, sideY)
      swapTwoRectangles(engine, {x: x1, y: y1}, {x: x2, y: y2}, sideX, sideY)
      verifyValues(engine)
    }
    randomCleanup(engine, rectangleFromCorner({x: 0, y: 0}, 2 * (n + 1) * sideX, 2 * sideY))
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

