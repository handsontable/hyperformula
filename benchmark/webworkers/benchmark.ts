import {sheet as T} from '../sheets/05-sheet-t'
import {sheet as A} from '../sheets/09-sheet-a'
import {sheet as B} from '../sheets/10-sheet-b'
import {GraphBuilder, Sheet} from "../../src/GraphBuilder";
import {Graph} from "../../src/Graph";
import {FormulaCellVertex, RangeVertex, Vertex} from "../../src/Vertex";
import {SimpleArrayAddressMapping} from "../../src/SimpleArrayAddressMapping";
import {RangeMapping} from "../../src/RangeMapping";
import {Statistics, StatType} from "../../src/statistics/Statistics";
import {Config} from "../../src/Config";
import {Distributor} from "../../src/Distributor";
import {Interpreter} from "../../src/interpreter/Interpreter";
import {absoluteCellAddress, cellAddressFromString} from "../../src/Cell";
import {IAddressMapping} from "../../src/IAddressMapping";

let working = false

interface IExtendedConsole extends Console {
  olog?: any
}

async function benchmark(sheet: Sheet, numberOfWorkers: number) {
  console.log("running benchmark on workers")
  const graph = new Graph<Vertex>()
  const {width, height} = findBoundaries(sheet)
  const addressMapping = new SimpleArrayAddressMapping(width, height, graph, -1)
  const graphBuilder = new GraphBuilder(graph, addressMapping, new RangeMapping(), new Statistics(), new Config())

  const startedAt = Date.now()

  graphBuilder.buildGraph(sheet)
  const distributor = new Distributor(graph, addressMapping, numberOfWorkers)
  await distributor.distribute()

  const finishedAt = Date.now()
  console.log(`Total time: ${finishedAt - startedAt}`)
}

async function benchmarkSync(sheet: Sheet) {
  console.log("running benchmark in main thread")
  const graph = new Graph<Vertex>()
  const statistics = new Statistics()
  const {width, height} = findBoundaries(sheet)
  const rangeMapping = new RangeMapping()
  const addressMapping = new SimpleArrayAddressMapping(width, height, graph, -1)
  const interpreter = new Interpreter(addressMapping, rangeMapping, graph, new Config())
  const graphBuilder = new GraphBuilder(graph, addressMapping, new RangeMapping(), new Statistics(), new Config())

  const overallStart = Date.now()

  graphBuilder.buildGraph(sheet)

  let { sorted, cycled } = statistics.measure(StatType.TOP_SORT, () => {
    return graph.topologicalSort();
  })

  const evalStart = Date.now()
  for (const vertex of sorted) {
    if (vertex instanceof FormulaCellVertex) {
      const address = vertex.getAddress()
      const formula = vertex.getFormula()
      const cellValue = interpreter.evaluateAst(formula, address)

      addressMapping.setCellValue(address, cellValue)
    } else if (vertex instanceof RangeVertex) {
      vertex.clear()
    }
  }
  const evalEnd = Date.now()

  const overallEnd = Date.now()

  console.log(`Total time: ${overallEnd - overallStart}` )
  console.log(`Eval time : ${evalEnd - evalStart}` )
  printSample("C10000", addressMapping)
}

function printSample(addressStr: string, addressMapping: IAddressMapping) {
  const address = cellAddressFromString(addressStr, absoluteCellAddress(0, 0))
  const vertex = addressMapping.getCell(address)!
  const value = vertex.getCellValue()
  console.log(`Value in ${addressStr}:`, value)
}

function findBoundaries(sheet: Sheet): ({ width: number, height: number, fill: number }) {
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

function runBenchmark(fun: any, benchmarkName: string) {
  if (working) {
    return
  }

  const numberOfWorkers = parseInt((document.getElementById('numberOfWorkers')! as HTMLInputElement).value, 10)
  const sync = (document.getElementById('sync')! as HTMLInputElement).checked
  clear()
  toggle()

  setTimeout(async () => {
    working = true
    console.info(`=== ${benchmarkName} ===`)
    if (sync) {
      await benchmarkSync(fun())
    } else {
      await benchmark(fun(), numberOfWorkers)
    }
    working = false
    toggle()
  }, 500)
}

function toggle() {
  const inputs = document.getElementsByTagName('input')
  for (let i = 0; i < inputs.length; ++i) {
    inputs[i].disabled = !inputs[i].disabled
  }
}

function clear() {
  const log = document.getElementById('log')!
  log.innerHTML = ''
}

function logInit() {
  const eConsole: IExtendedConsole = console

  const log = document.getElementById('log')!

  if (typeof eConsole !== 'undefined') {
    if (typeof eConsole.log !== 'undefined') {
      eConsole.olog = eConsole.log
    } else {
      eConsole.olog = () => {
      }
    }
  }

  eConsole.log = function (message: string) {
    eConsole.olog(message)
    log.innerHTML += '<p>' + message + '</p>'
  }
  eConsole.error = eConsole.debug = eConsole.info = eConsole.log
}

function init() {
  logInit()

  const btn_sheetA = document.getElementById('btn_sheetA')!
  const btn_sheetB = document.getElementById('btn_sheetB')!
  const btn_sheetT = document.getElementById('btn_sheetT')!

  btn_sheetA.addEventListener('click', () => runBenchmark(A, 'Sheet A'))
  btn_sheetB.addEventListener('click', () => runBenchmark(B, 'Sheet B'))
  btn_sheetT.addEventListener('click', () => runBenchmark(T, 'Sheet T'))
}

init()
