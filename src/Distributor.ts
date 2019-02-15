import {Graph} from "./Graph";
import {CellVertex, Vertex} from "./Vertex";
import {AddressMapping} from "./AddressMapping";
import {SimpleArrayAddressMapping} from "./SimpleArrayAddressMapping";
import {Pool} from "./worker/Pool";

const NUMBER_OF_WORKERS = 3

export class Distributor {
  private pool: Pool

  private initialized: number

  constructor(
      private graph: Graph<Vertex>,
      private addressMapping: SimpleArrayAddressMapping,
  ) {
    this.pool = new Pool(NUMBER_OF_WORKERS)
    this.pool.init()
    this.initialized = 0
  }


  public distribute(): Map<Color, WorkerInitPayload> {
    let { sorted, cycled } = this.topSort()

    const coloredChunks: Map<Color, WorkerInitPayload> = new Map()

    const serializedEdges = this.serializeEdges(this.graph.getEdges(), this.graph.edgesCount())

    sorted.forEach(node => {
      if (!coloredChunks.has(node.color)) {
        coloredChunks.set(node.color, {
          type: "INIT",
          nodes: [],
          edges: new Map(),
          allEdges: serializedEdges,
          allNodes: Array.from(this.graph.nodes.values()),
          addressMapping: this.addressMapping.mapping,
          sheetWidth: this.addressMapping.getWidth(),
          sheetHeight: this.addressMapping.getHeight(),
          color: node.color
        })
      }

      const subgraph = coloredChunks.get(node.color)!
      subgraph.nodes.push(node.vertexId)
      subgraph.edges.set(node, this.graph.adjacentNodes(node))
    })

    this.pool.addWorkerTaskForAllWorkers((workerId: number) => {
      return {
        data: coloredChunks.get(workerId),
        callback: this.onWorkerMessage(this),
      }
    })

    return coloredChunks
  }

  private onWorkerMessage(that: Distributor) {
    return (message: any) => {
      switch (message.data.type) {
        case "INITIALIZED": {
          this.initialized += 1
          if (this.initialized == NUMBER_OF_WORKERS) {
            this.pool.addWorkerTaskForAllWorkers((workerId: number) => {
              return {
                data: {
                  type: "START"
                },
                callback: that.onWorkerMessage(that)
              }
            })
          }
          break
        }
      }
    }
  }

  public serializeEdges(edges: Map<Vertex, Set<Vertex>>, edgesCount: number): Int32Array {
    const result = new Int32Array(edgesCount * 2)
    let i = 0
    edges.forEach((targetNodes, sourceNode) => {
      targetNodes.forEach((targetNode) => {
        result[i] = sourceNode.vertexId
        result[i+1] = targetNode.vertexId
        i += 2
      })
    })
    return result
  }

  public topSort(): { sorted: Vertex[], cycled: Vertex[] } {
    const incomingEdges = this.incomingEdges()
    const dominantColors = this.initDominantColors()

    const danglingNodes = this.colorNodes(this.danglingNodes(incomingEdges))

    let currentNodeIndex = 0
    const sorted: Vertex[] = []

    while (currentNodeIndex < danglingNodes.length) {
      const node = danglingNodes[currentNodeIndex]

      sorted.push(node)

      this.graph.getEdges().get(node)!.forEach((targetNode) => {
        ++dominantColors.get(targetNode)![node.color]
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)

        if (incomingEdges.get(targetNode) === 0) {
          targetNode.color = this.getDominantColor(dominantColors.get(targetNode)!)
          danglingNodes.push(targetNode)
        }
      })

      ++ currentNodeIndex
    }

    if (sorted.length !== this.graph.nodes.size) {
      const nodesOnCycle = new Set(this.graph.nodes.values())
      for (let i = 0; i < sorted.length; ++i) {
        nodesOnCycle.delete(sorted[i])
      }
      return {
        sorted: sorted,
        cycled: Array.from(nodesOnCycle)
      }
    }

    return {
      sorted: sorted,
      cycled: []
    }
  }

  private getDominantColor(colors: Color[]): Color {
    let max = colors[0]
    let maxIndex = 0

    for (let i=1; i<colors.length; ++i) {
      if (colors[i] > max) {
        maxIndex = i
        max = colors[i]
      }
    }

    return maxIndex
  }

  private danglingNodes(incomingEdges: Map<Vertex, number>): Vertex[] {
    const result: Vertex[] = []
    incomingEdges.forEach((currentCount, targetNode) => {
      if (currentCount === 0) {
        result.push(targetNode)
      }
    })
    return result
  }

  private colorNodes(nodes: Vertex[]): Vertex[] {
    let currentColor = 0
    nodes.forEach(node => node.color = (++currentColor) % NUMBER_OF_WORKERS)
    return nodes
  }

  private initDominantColors(): Map<Vertex, Color[]> {
    const result = new Map()
    this.graph.getNodes().forEach((node) => {
      result.set(node, new Int32Array(NUMBER_OF_WORKERS))
    })
    return result
  }

  private incomingEdges(): Map<Vertex, number> {
    const incomingEdges: Map<Vertex, number> = new Map()
    this.graph.getNodes().forEach((node) => (incomingEdges.set(node, 0)))
    this.graph.getEdges().forEach((adjacentNodes, sourceNode) => {
      adjacentNodes.forEach((targetNode) => {
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! + 1)
      })
    })
    return incomingEdges
  }
}

export type Color = number

export type WorkerInitPayload = {
  type: "INIT",
  nodes: number[],
  edges: Map<Vertex, Set<Vertex>>,
  allNodes: Vertex[],
  allEdges: Int32Array,
  addressMapping: Int32Array,
  sheetWidth: number,
  sheetHeight: number,
  color: number,
}

export interface WorkerStartPayload {
  type: "START"
}

