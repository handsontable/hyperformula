import {HyperFormula} from '../src'

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}

type Pts = {x: number, y: number}

type Rectangle = {topleft: Pts, bottomright: Pts}


function randomRange(engine: HyperFormula, rect: Rectangle): string {
  const x1 = randomInteger(rect.topleft.x, rect.bottomright.x)
  const x2 = randomInteger(rect.topleft.x, rect.bottomright.x)
  const y1 = randomInteger(rect.topleft.y, rect.bottomright.y)
  const y2 = randomInteger(rect.topleft.y, rect.bottomright.y)
  const startAddress = engine.simpleCellAddressToString({
    sheet: 0,
    row: Math.min(x1, x2),
    col: Math.min(y1, y2)
  }, 0)
  const endAddress = engine.simpleCellAddressToString({
    sheet: 0,
    row: Math.max(x1, x2),
    col: Math.max(y1, y2)
  }, 0)
  return '=SUM(' + startAddress + ':' + endAddress + ')'
}

function randomSums(engine: HyperFormula, rectFormulas: Rectangle, rectValues: Rectangle) {
  allPts(rectFormulas).forEach((pts) =>{
    const formula = randomRange(engine, rectValues)
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, formula)
  })
}

function randomVals(engine: HyperFormula, rectValues: Rectangle) {
  allPts(rectValues).forEach((pts) =>{
    engine.setCellContents({sheet:0, col: pts.x, row: pts.y}, randomInteger(-10,10))
  })
}

function squareFromCorner(pts: Pts, side: number): Rectangle {
  return {topleft: pts, bottomright: {x: pts.x+side, y: pts.y+side}}
}

function rectangleFromCorner(pts: Pts, sideX: number, sideY: number): Rectangle {
  return {topleft: pts, bottomright: {x: pts.x+sideX, y: pts.y+sideY}}
}

function allPts(rect: Rectangle): Pts[] {
  const ret: Pts[] = []
  for(let x = rect.topleft.x; x<rect.bottomright.x; x++) {
    for(let y = rect.topleft.y; y<rect.bottomright.y; y++) {
      ret.push({x,y})
    }
  }
  return ret
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}

function randomCleanup(engine: HyperFormula, rect: Rectangle) {
  shuffleArray(allPts(rect)).forEach( (pts) =>
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, null)
  )
}

function verifyValues(engine: HyperFormula) {
  const serialization = engine.getAllSheetsSerialized()
  const engine2 = HyperFormula.buildFromSheets(serialization)
  expect(engine.getAllSheetsValues()).toEqual(engine2.getAllSheetsValues())
}

describe('larger tests', () => {
  it('large rectangular', () => {
    const engine = HyperFormula.buildFromArray([])
    const side = 5
    const n = 5
    for(let rep=0; rep<5; rep++) {
      randomVals(engine, squareFromCorner({x: 0, y: 0}, side))
      for (let i = 0; i < n; i++) {
        randomSums(engine, squareFromCorner({x: side * (i + 1), y: 0}, side), squareFromCorner({
          x: side * i,
          y: 0
        }, side))
      }
      verifyValues(engine)
    }
    randomCleanup(engine, rectangleFromCorner({x:0, y:0}, (n+1)*side, side))
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

