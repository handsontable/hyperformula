import {Graph} from "./Graph";
import {Vertex} from "./Vertex";
import {SimpleArrayAddressMapping} from "./SimpleArrayAddressMapping";
import {GraphBuilder, Sheet} from "./GraphBuilder";
import {RangeMapping} from "./RangeMapping";
import {Statistics} from "./statistics/Statistics";
import {Config} from "./Config";
import {Distributor} from "./Distributor";

async function init() {
  // const sheet = [
  //   ["1",     "4", "3"],
  //   ["=A1", "=B1", "=C1"],
  //   ["=A2", "=B2", "=C2"],
  //   ["=SUM(A1,A2,A3)+B4", "=B3+C4", "=C3"],
  //   ["=MEDIAN(A1:C1)"],
  // ]
   // const rows = 2000
   // console.warn(`Rows: ${rows}`)
   // const sheet = []
  
   // let current = 1
   // while (current <= rows) {
   //   const rowToPush = [
   //     `${current}`,
   //     `=MEDIAN(A1:A${current})`,
   //     `${current}`,
   //     `=MEDIAN(C1:C${current})`,
   //     `${current}`,
   //     `=MEDIAN(E1:E${current})`,
   //   ]
  
   //   sheet.push(rowToPush)
   //   ++current
   // }
  const rows = 2000
  console.warn(`Rows: ${rows}`)
  const sheet = []
  let dependent = 0

  let current = 1
  while (current <= rows) {
    let rowToPush
    if (current % 1 === 0) {
      rowToPush = [
        `${current}`,
        `=MEDIAN(A1, A1:A${current}, C${current})`,
        `${current}`,
        `=MEDIAN(C1, C1:C${current}, E${current})`,
        `${current}`,
        `=MEDIAN(E1, E1:E${current}, A${current})`,
      ]
      dependent++
    } else {
      rowToPush = [
        `${current}`,
        `=MEDIAN(A1, A1:A${current}, A1)`,
        `${current}`,
        `=MEDIAN(C1, C1:C${current}, C1)`,
        `${current}`,
        `=MEDIAN(E1, E1:E${current}, E1)`,
      ]
    }

    sheet.push(rowToPush)
    ++current
  }
  console.warn(`Dependent rows: ${dependent}`)




  const graph = new Graph<Vertex>()
  const {width, height} = findBoundaries(sheet)
  const addressMapping = new SimpleArrayAddressMapping(width, height, graph, -1)
  const graphBuilder = new GraphBuilder(graph, addressMapping, new RangeMapping(), new Statistics(), new Config())

  const startedAt = Date.now()
  graphBuilder.buildGraph(sheet)

  const distributor = new Distributor(graph, addressMapping)
  const result = await distributor.distribute()
  const finishedAt = Date.now()
  console.log(`Total time: ${finishedAt - startedAt}`)
}

export function findBoundaries(sheet: Sheet): ({ width: number, height: number, fill: number }) {
  let maxWidth = 0
  let cellsCount = 0
  for (let currentRow = 0; currentRow < sheet.length; currentRow++) {
    const currentRowWidth = sheet[currentRow].length
    if (maxWidth === undefined || maxWidth < currentRowWidth) {
      maxWidth = currentRowWidth
    }
    for (let currentCol = 0; currentCol < currentRowWidth; currentCol++) {
      const currentValue = sheet[currentRow][currentCol]
      if (currentValue !== '') {
        cellsCount++
      }
    }
  }
  const sheetSize = sheet.length * maxWidth

  return {
    height: sheet.length,
    width: maxWidth,
    fill: sheetSize === 0 ? 0 : cellsCount / sheetSize,
  }
}

init()
