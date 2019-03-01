import {WorkerInitPayload} from "../Distributor";
import {SimpleArrayAddressMapping} from "../SimpleArrayAddressMapping"
import {Graph} from '../Graph'
import {Vertex, FormulaCellVertex, ValueCellVertex, RangeVertex, EmptyCellVertex, CellVertex} from '../Vertex'
import {
  SimpleCellAddress,
  simpleCellAddress,
  CellValue,
  buildCellRange,
  simpleCellRange,
  CellDependency,
  SimpleCellRange,
  cellAddressFromString, absoluteCellAddress
} from '../Cell'
import {Ast} from '../parser/Ast'
import {RangeMapping} from "../RangeMapping";
import {MedianPlugin} from "../interpreter/plugin/MedianPlugin"
import {Interpreter} from "../interpreter/Interpreter";
import {Config} from "../Config";
import {generateCellsFromRangeGenerator} from '../GraphBuilder'
import {absolutizeDependencies} from '../parser/ParserWithCaching'
import {collectDependencies, RelativeDependency} from '../parser/Cache'
import {IAddressMapping} from "../IAddressMapping";
import {add} from "../interpreter/scalar";

const ctx: Worker = self as any;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let addressMapping: SimpleArrayAddressMapping,
    rangeMapping: RangeMapping,
    graph: Graph<Vertex>,
    nodes: Vertex[],
    interpreter: Interpreter,
    color: number,
    bc: BroadcastChannel,
    numberOfWorkers: number

let blockedNodesPromises = new Map<number, Promise<any>>()
let blockedNodesResolvers = new Map<number, any>()
let blockedCount = 0
const resolvedNodes: number[] = []

export interface WorkerInitializedPayload {
  type: "INITIALIZED"
}

export interface WorkerFinishedPayload {
  type: "FINISHED",
}

ctx.onmessage = (message) => {
  switch (message.data.type) {
    case "INIT":
      init(message.data)
      break
    case "START":
      console.log("start!!!")
      start()
      break
  }
}

function init(payload: WorkerInitPayload) {
  console.log("payload", payload)

  const startedAt = Date.now()
  // graph reconstruction
  graph = new Graph<Vertex>()
  rangeMapping = new RangeMapping()
  color = payload.color
  nodes = []
  numberOfWorkers = payload.numberOfWorkers
  let serializedEdges = payload.edges
  let serializedNodes = payload.nodes as any[]

  bc = new BroadcastChannel("mybus")
  bc.onmessage = (e) => {
    // console.log(color, "Received message", e)
  }


  for (const node of serializedNodes) {
    let vertex;
    switch (node.kind) {
      case "formula": {
        vertex = new FormulaCellVertex(
            node.vertexId as number,
            node.formula as Ast,
            node.cellAddress as SimpleCellAddress,
            node.color
        )
        break
      }
      case "value": {
        vertex = new ValueCellVertex(
            node.vertexId as number,
            node.cellValue as CellValue,
            node.color
        )
        break
      }
      case "empty": {
        vertex = new EmptyCellVertex(node.vertexId, node.color)
        EmptyCellVertex.instance = vertex
        break
      }
      case "range": {
        // something should be done about restoring caches here
        // not sure whether Map copies correctly, it's just Object here
        vertex = new RangeVertex(
            node.vertexId as number,
            node.start as SimpleCellAddress,
            node.end as SimpleCellAddress,
            node.color
        )
        rangeMapping.setRange(vertex)
        break
      }
      default:
        throw new Error()
    }
    graph.addNode(vertex)
    nodes.push(vertex)
  }

  const numberOfEdges = serializedEdges.length / 2
  for (let i = 0; i < numberOfEdges; i++) {
    graph.addEdgeByIds(serializedEdges[i * 2], serializedEdges[i * 2 + 1])
  }

  addressMapping = new SimpleArrayAddressMapping(
      payload.sheetWidth,
      payload.sheetHeight,
      graph,
      color,
      payload.addressMapping,
  )

  interpreter = new Interpreter(addressMapping, rangeMapping, graph, new Config())

  const response: WorkerInitializedPayload = {
    type: "INITIALIZED"
  }

  const finishedAt = Date.now()
  console.warn(`Initialization at Worker ${color} finished in ${finishedAt - startedAt}`)

  ctx.postMessage(response)
}

const findSmallerCacheRange = (addressMapping: SimpleArrayAddressMapping, ranges: SimpleCellRange[]): { smallerRangePromise: Promise<any> | null, restRanges: SimpleCellRange[] } => {
  if (ranges[0].end.row > ranges[0].start.row) {
    const valuesRangeEndRowLess = simpleCellAddress(ranges[0].end.col, ranges[0].end.row - 1)
    // const rowLessVertex = rangeMapping.getRange(ranges[0].start, valuesRangeEndRowLess)
    const rowLessRange = simpleCellRange(ranges[0].start, valuesRangeEndRowLess)
    const rowLessRangeKey = addressMapping.rangeKey(rowLessRange)
    const rowLessPromise = addressMapping.remoteRangePromiseCache.get(rowLessRangeKey)
    if (rowLessPromise) {
      const restRanges = ranges.map((range) => {
        return simpleCellRange(simpleCellAddress(range.start.col, range.end.row), range.end)
      })

      return {
        smallerRangePromise: rowLessPromise,
        restRanges,
      }
    }
  }
  return {
    smallerRangePromise: null,
    restRanges: ranges,
  }
}

async function start() {
  bc.postMessage(`message from ${color}`)

  const startedAt = Date.now()

  let collectingDependencies = 0.0
  let waitingForDependencies = 0.0
  let dependencyProcessing = 0.0

  for (let j = 0; j < nodes.length; j++) {
    const vertex = nodes[j]

    if (vertex.color != color) {
      continue
    }

    if (vertex instanceof RangeVertex) {
      vertex.clear()
      continue
    }

    if (!(vertex instanceof FormulaCellVertex)) {
      continue;
    }

    processBlockedNodes()

    const address = vertex.getAddress()
    const formula = vertex.getFormula()

    if (numberOfWorkers > 1) {
      // const startedAt = Date.now()
      let relativeDependencies: RelativeDependency[] = []
      collectDependencies(formula, relativeDependencies)
      const dependencies = absolutizeDependencies(relativeDependencies, address)
      const dependenciesPromises = []
      // const finishedAt = Date.now()
      // collectingDependencies += (finishedAt - startedAt)

      // const dependencyProcessingStartedAt = Date.now()
      for (let i = 0; i < dependencies.length; i++) {
        if (Array.isArray(dependencies[i])) {
          const depDummyRange = dependencies[i] as [SimpleCellAddress, SimpleCellAddress]
          const depRange = simpleCellRange(depDummyRange[0], depDummyRange[1])
          const rangeKey = addressMapping.rangeKey(depRange)

          if (addressMapping.remoteRangePromiseCache.has(rangeKey)) {
            dependenciesPromises.push(addressMapping.remoteRangePromiseCache.get(rangeKey))
          } else {
            const promisesForRange = []
            const {smallerRangePromise, restRanges} = findSmallerCacheRange(addressMapping, [depRange])

            if (smallerRangePromise) {
              promisesForRange.push(smallerRangePromise)
            }

            for (const cellFromRange of generateCellsFromRangeGenerator(restRanges[0])) {
              const promise = getDependencyPromise(cellFromRange, addressMapping)
              if (promise !== null) {
                promisesForRange.push(promise)
              }
            }

            const rangePromise = Promise.all(promisesForRange)
            addressMapping.remoteRangePromiseCache.set(rangeKey, rangePromise)
            dependenciesPromises.push(rangePromise)
          }
        } else {
          const promise = getDependencyPromise(dependencies[i] as SimpleCellAddress, addressMapping)
          if (promise !== null) {
            dependenciesPromises.push(promise)
          }
        }
      }
      // const dependencyProcessingFinishedAt = Date.now()
      // dependencyProcessing += (dependencyProcessingFinishedAt - dependencyProcessingStartedAt)

      if (dependenciesPromises.length > 0) {
        blockedCount++
        const nodePromise = new Promise((resolve, reject) => {
          blockedNodesResolvers.set(vertex.vertexId, resolve)
        })
        Promise.all(dependenciesPromises).then(() => {
          resolvedNodes.push(j);
          blockedCount--;
        })
        blockedNodesPromises.set(vertex.vertexId, nodePromise)
        continue
      }

      // const startedAt = Date.now()
      // await Promise.all(dependenciesPromises)
      // const finishedAt = Date.now()
      // waitingForDependencies += (finishedAt - startedAt)

      // let cellValue = interpreter.evaluateAst(formula, address)
      // addressMapping.setCellValue(address, cellValue)
    }

    let cellValue = interpreter.evaluateAst(formula, address)
    addressMapping.setCellValue(address, cellValue)
  }

  console.warn(color, `Blocked: ${blockedCount}, resolvedNodes: ${resolvedNodes}`)
  while (blockedCount > 0 || resolvedNodes.length > 0) {
    processBlockedNodes()
    await sleep(1)
  }

  const finishedAt = Date.now()
  console.warn(`Computing at Worker ${color} finished in ${finishedAt - startedAt}`)
  // console.warn(`waiting for deps at ${color}:   ${waitingForDependencies}`)
  // console.warn(`processing dependencies at ${color}:   ${dependencyProcessing}`)

  console.warn(color, addressMapping.getCellValueIfHere({ col: 1, row: 999 }))
  console.warn(color, addressMapping.getCellValueIfHere({ col: 3, row: 999 }))
  console.warn(color, addressMapping.getCellValueIfHere({ col: 5, row: 999 }))
  console.log(color, graph)
  ctx.postMessage({
    type: "FINISHED",
  })
}

function processBlockedNodes() {
  while (resolvedNodes.length > 0) {
    const vertex = nodes[resolvedNodes.shift()!] as FormulaCellVertex

    const address = vertex.getAddress()
    const formula = vertex.getFormula()

    let cellValue = interpreter.evaluateAst(formula, address)
    addressMapping.setCellValue(address, cellValue)
    const resolver = blockedNodesResolvers.get(vertex.vertexId)
    resolver()
  }
}

function getDependencyPromise(address: SimpleCellAddress, addressMapping: SimpleArrayAddressMapping): Promise<CellValue> | null {
  const vertexId = addressMapping.getVertexId(address)

  const vertex = graph.getNodeById(vertexId)
  if (vertex !== null && vertex.color === color) {
    return blockedNodesPromises.get(vertexId) || null
  }

  if (addressMapping.remoteCache.has(vertexId)) {
    return null
  } else if (addressMapping.remotePromiseCache.has(vertexId)) {
    return addressMapping.remotePromiseCache.get(vertexId) || null
  } else {
    return addressMapping.getRemoteCellValueByVertex(address)
  }
}
