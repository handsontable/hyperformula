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
  allPts(rectFormulas).forEach((pts) =>{
    const formula = randomRange(engine, rectValues)
    console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, '${formula}')`)
    engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, formula)
  })
}

function randomVals(engine: HyperFormula, rectValues: Rectangle) {
  allPts(rectValues).forEach((pts) =>{
    const val = randomInteger(-10,10)
    console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, ${val})`)
    engine.setCellContents({sheet:0, col: pts.x, row: pts.y}, val)
  })
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
  shuffleArray(allPts(rect)).forEach( (pts) => {
      engine.setCellContents({sheet: 0, col: pts.x, row: pts.y}, null)
      console.log(`engine.setCellContents({sheet: 0, col:${pts.x}, row:${pts.y}}, null})`)
    }
  )
}

function verifyValues(engine: HyperFormula) {
  const serialization = engine.getAllSheetsSerialized()
  const engine2 = HyperFormula.buildFromSheets(serialization)
  expect(engine.getAllSheetsValues()).toEqual(engine2.getAllSheetsValues())
}

describe('larger tests', () => {
  it('large rectangular + addRows', () => {
    const engine = HyperFormula.buildFromArray([])
    const sideX = 3
    const n = 2
    let sideY = 1
    while(sideY<5) {
      randomVals(engine, rectangleFromCorner({x: 0, y: 0}, sideX, sideY))
      verifyValues(engine)
      for (let i = 0; i < n; i++) {
        randomSums(engine,
          rectangleFromCorner({x: sideX * (i + 1), y: 0}, sideX, sideY),
          rectangleFromCorner({x: sideX * i, y: 0}, sideX, sideY)
        )
        verifyValues(engine)
      }
      const positionToAdd = randomInteger(0, sideY+1)
      console.log(`engine.addRows(0, [${positionToAdd},2])`)
      engine.addRows(0, [positionToAdd,2])
      sideY += 2
      verifyValues(engine)
      const positionToRemove = randomInteger(0,sideY)
      console.log(`engine.removeRows(0, [${positionToRemove},1])`)
      engine.removeRows(0, [positionToRemove, 1])
      sideY -= 1
      verifyValues(engine)
    }
    randomCleanup(engine, rectangleFromCorner({x:0, y:0}, (n+1)*sideX, sideY))
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

describe('standalone tests', () => {
  it('runtime error - Cannot read property \'forEach\' of undefined', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents({sheet: 0, col:4, row:0}, '=SUM(A1:C1)')
    engine.addRows(0, [1,2])
    engine.removeRows(0, [2,1])
    engine.setCellContents({sheet: 0, col:3, row:1}, '=SUM(A1:C2)')
    engine.setCellContents({sheet: 0, col:4, row:0}, '=SUM(A1:C2)')
    engine.addRows(0, [1,2])
    engine.removeRows(0, [3,1])
    engine.setCellContents({sheet: 0, col:4, row:0}, '=SUM(B2:B3)')
    engine.addRows(0, [1,2])
  })

  it('runtime -  Range does not exist', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents({sheet: 0, col:3, row:0}, '=SUM(A1:C2)')
    engine.setCellContents({sheet: 0, col:4, row:0}, '=SUM(A1:C1)')
    engine.addRows(0, [0,2])
    engine.removeRows(0, [3,1])
    engine.setCellContents({sheet: 0, col:3, row:2}, '=SUM(A2:B3)')
    engine.setCellContents({sheet: 0, col:4, row:2}, '=SUM(A2:B3)')
  })

  it('wrong value', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents({sheet: 0, col:1, row:0}, -2)
    engine.addRows(0, [1,2])
    engine.removeRows(0, [1,1])
    engine.addRows(0, [2,2])
    engine.removeRows(0, [0,1])
    engine.setCellContents({sheet: 0, col:2, row:1}, 7)
    engine.setCellContents({sheet: 0, col:3, row:0}, '=SUM(B2:C3)')
    engine.setCellContents({sheet: 0, col:6, row:0}, '=SUM(D1:F2)')
    engine.setCellContents({sheet: 0, col:6, row:2}, '=SUM(D1:F1)')
    engine.addRows(0, [0,2])
    engine.removeRows(0, [3,1])
    verifyValues(engine)
  })

  it('not properly deallocated', () => {
    const engine = HyperFormula.buildFromArray([])
    engine.setCellContents({sheet: 0, col:3, row:2}, '=SUM(B2:C2)')
    engine.setCellContents({sheet: 0, col:5, row:3}, '=SUM(B2:C3)')
    engine.addRows(0, [2,2])
    engine.removeRows(0, [4,1])
    engine.setCellContents({sheet: 0, col:1, row:4}, null)
    engine.setCellContents({sheet: 0, col:2, row:4}, null)
    engine.setCellContents({sheet: 0, col:3, row:2}, null)
    engine.setCellContents({sheet: 0, col:3, row:1}, null)
    engine.setCellContents({sheet: 0, col:2, row:2}, null)
    engine.setCellContents({sheet: 0, col:4, row:2}, null)
    engine.setCellContents({sheet: 0, col:6, row:2}, null)
    engine.setCellContents({sheet: 0, col:1, row:1}, null)
    engine.setCellContents({sheet: 0, col:2, row:3}, null)
    engine.setCellContents({sheet: 0, col:6, row:0}, null)
    engine.setCellContents({sheet: 0, col:2, row:1}, null)
    engine.setCellContents({sheet: 0, col:4, row:0}, null)
    engine.setCellContents({sheet: 0, col:0, row:4}, null)
    engine.setCellContents({sheet: 0, col:3, row:0}, null)
    engine.setCellContents({sheet: 0, col:5, row:3}, null)
    engine.setCellContents({sheet: 0, col:0, row:0}, null)
    engine.setCellContents({sheet: 0, col:5, row:0}, null)
    engine.setCellContents({sheet: 0, col:5, row:1}, null)
    engine.setCellContents({sheet: 0, col:4, row:1}, null)
    engine.setCellContents({sheet: 0, col:4, row:4}, null)
    engine.setCellContents({sheet: 0, col:0, row:1}, null)
    engine.setCellContents({sheet: 0, col:2, row:0}, null)
    engine.setCellContents({sheet: 0, col:3, row:3}, null)
    engine.setCellContents({sheet: 0, col:1, row:3}, null)
    engine.setCellContents({sheet: 0, col:3, row:4}, null)
    engine.setCellContents({sheet: 0, col:5, row:2}, null)
    engine.setCellContents({sheet: 0, col:4, row:3}, null)
    engine.setCellContents({sheet: 0, col:1, row:0}, null)
    engine.setCellContents({sheet: 0, col:0, row:3}, null)
    engine.setCellContents({sheet: 0, col:0, row:2}, null)
    engine.setCellContents({sheet: 0, col:6, row:3}, null)
    engine.setCellContents({sheet: 0, col:1, row:2}, null)
    engine.setCellContents({sheet: 0, col:6, row:1}, null)
    engine.setCellContents({sheet: 0, col:6, row:4}, null)
    engine.setCellContents({sheet: 0, col:5, row:4}, null)
    expect(engine.dependencyGraph.graph.nodesCount()).toBe(0)
    expect(engine.dependencyGraph.rangeMapping.getMappingSize(0)).toBe(0)
  })
})

