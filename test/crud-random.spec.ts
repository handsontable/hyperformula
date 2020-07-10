import {HyperFormula} from '../src'
import {verifyValues} from './testUtils'

let state = 1

function getInt(): number {
  state ^= state << 13
  state ^= state >> 17
  state ^= state << 5
  state &= 0x7FFFFFFF
  return state
}

function getFloat(): number {
  return getInt()/0x80000000
}

const outputLog = false


function randomInteger(min: number, max: number) {
  return Math.floor(getFloat() * (max - min)) + min
}

type Pts = { x: number, y: number }

type Rectangle = { topleft: Pts, bottomright: Pts }


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

function randomSums(engine: HyperFormula, rectFormulas: Rectangle, rectValues: Rectangle) {
  allPts(rectFormulas).forEach((pts) => {
    const formula = randomRange(engine, rectValues)
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, formula)
  })
}

function randomVals(engine: HyperFormula, rectValues: Rectangle) {
  allPts(rectValues).forEach((pts) => {
    const val = randomInteger(-10, 10)
    if(outputLog) {
      console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, ${val})`)
    }
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, val)
  })
}

function rectangleFromCorner(pts: Pts, sideX: number, sideY: number): Rectangle {
  return {topleft: pts, bottomright: {x: pts.x + sideX, y: pts.y + sideY}}
}

function allPts(rect: Rectangle): Pts[] {
  const ret: Pts[] = []
  for (let x = rect.topleft.x; x < rect.bottomright.x; x++) {
    for (let y = rect.topleft.y; y < rect.bottomright.y; y++) {
      ret.push({x, y})
    }
  }
  return ret
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function randomCleanup(engine: HyperFormula, rect: Rectangle) {
  shuffleArray(allPts(rect)).forEach((pts) => {
      engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, null)
      if(outputLog) {
        console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, null})`)
      }
    }
  )
}

describe('larger tests', () => {
  it('large rectangular + addRows', () => {
    const engine = HyperFormula.buildFromArray([])
    const sideX = 3
    const n = 2
    let sideY = 1
    while (sideY < 5) {
      randomVals(engine, rectangleFromCorner({x: 0, y: 0}, sideX, sideY))
      verifyValues(engine)
      for (let i = 0; i < n; i++) {
        randomSums(engine,
          rectangleFromCorner({x: sideX * (i + 1), y: 0}, sideX, sideY),
          rectangleFromCorner({x: sideX * i, y: 0}, sideX, sideY)
        )
        verifyValues(engine)
      }
      const positionToAdd = randomInteger(0, sideY + 1)
      if(outputLog) {
        console.log(`engine.addRows(0, [${positionToAdd},2])`)
      }
      engine.addRows(0, [positionToAdd, 2])
      sideY += 2
      verifyValues(engine)
      const positionToRemove = randomInteger(0, sideY)
      if(outputLog) {
        console.log(`engine.removeRows(0, [${positionToRemove},1])`)
      }
      engine.removeRows(0, [positionToRemove, 1])
      sideY -= 1
      verifyValues(engine)
    }
    randomCleanup(engine, rectangleFromCorner({x: 0, y: 0}, (n + 1) * sideX, sideY))
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

