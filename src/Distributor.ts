import {Graph} from "./Graph";
import {CellVertex, Vertex} from "./Vertex";
import {AddressMapping} from "./AddressMapping";

const NUMBER_OF_WORKERS = 3

export class Distributor {
  constructor(
      private graph: Graph<Vertex>,
      private addressMapping: AddressMapping,
  ) {}

  public distribute(): Map<Color, WorkerInitPayload> {
    let { sorted, cycled } = this.topSort()

    const result: Map<Color, WorkerInitPayload> = new Map()

    sorted.forEach(colorNode => {
      if (!result.has(colorNode.color)) {
        result.set(colorNode.color, {
          type: "INIT",
          nodes: [],
          edges: new Map(),
          addressMapping: this.addressMapping.getMapping()
        })
      }

      const subgraph = result.get(colorNode.color)!
      subgraph.nodes.push(colorNode.node)
      subgraph.edges.set(colorNode.node, this.graph.adjacentNodes(colorNode.node))
    })

    return result
  }

  public topSort(): { sorted: ColorNode[], cycled: Vertex[] } {
    const incomingEdges = this.incomingEdges()
    const dominantColors = this.initDominantColors()

    const danglingNodes = this.colorNodes(this.danglingNodes(incomingEdges))

    let currentNodeIndex = 0
    const sorted: ColorNode[] = []

    while (currentNodeIndex < danglingNodes.length) {
      const node = danglingNodes[currentNodeIndex]

      sorted.push(node)

      this.graph.getEdges().get(node.node)!.forEach((targetNode) => {
        ++dominantColors.get(targetNode)![node.color]
        incomingEdges.set(targetNode, incomingEdges.get(targetNode)! - 1)

        if (incomingEdges.get(targetNode) === 0) {
          danglingNodes.push({
            color: this.getDominantColor(dominantColors.get(targetNode)!),
            node: targetNode
          })
        }
      })

      ++ currentNodeIndex
    }

    if (sorted.length !== this.graph.getNodes().size) {
      const nodesOnCycle = new Set(this.graph.getNodes())
      for (let i = 0; i < sorted.length; ++i) {
        nodesOnCycle.delete(sorted[i].node)
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

  private colorNodes(nodes: Vertex[]): ColorNode[] {
    let currentColor = 0
    const result: ColorNode[] = []
    nodes.forEach(node => {
      result.push({
        color: (++currentColor) % NUMBER_OF_WORKERS,
        node: node
      })
    })
    return result
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
  nodes: Vertex[],
  edges: Map<Vertex, Set<Vertex>>,
  addressMapping: Map<number, Map<number, CellVertex>>,
}

interface ColorNode {
  color: Color,
  node: Vertex
}
