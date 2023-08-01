/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

export interface TopSortResult<T> {
  sorted: T[],
  cycled: T[],
}

enum NodeVisitStatus {
  ON_STACK,
  PROCESSED,
  POPPED,
}

/**
 * An algorithm class. Provides topological sorting of a graph.
 */
export class TopSort<T> {
  private nodes: T[] = []
  private edges: number[][] = []
  private mapping: Map<T, number> = new Map()

  private entranceTime: number[] = []
  private low: number[] = []
  private parent: number[] = []
  private inSCC: boolean[] = []

  // node status life cycle:
  // undefined -> ON_STACK -> PROCESSED -> POPPED
  private nodeStatus: NodeVisitStatus[] = []
  private order: number[] = []

  private time: number = 0

  private sccNonSingletons: boolean[] = []

  constructor(
    edges: Map<T, Set<T>> = new Map()
  ) {
    edges.forEach((_, node: T) => {
      this.nodes.push(node)
      this.mapping.set(node, this.nodes.length - 1)
    })

    edges.forEach((neighbours: Set<T>, node: T) => {
      const nodeId = this.mapping.get(node)

      if (nodeId === undefined) {
        throw Error(`Unknown node ${nodeId}`)
      }

      this.edges[nodeId] = []
      neighbours.forEach((neighbour: T) => {
        const neighbourId = this.mapping.get(neighbour)

        if (neighbourId === undefined) {
          throw Error(`Unknown neighbour ${neighbour}`)
        }

        this.edges[nodeId].push(neighbourId)
      })
    })
  }

  public adjacentNodes(nodeId: number): number[] {
    return this.edges[nodeId]
  }

  /**
   * An iterative implementation of Tarjan's algorithm for finding strongly connected components.
   * Returns vertices in order of topological sort, but vertices that are on cycles are kept separate.
   *
   * @param modifiedNodes - seed for computation. During engine init run, all of the vertices of grap. In recomputation run, changed vertices.
   * @param operatingFunction - recomputes value of a node, and returns whether a change occured
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(modifiedNodes: T[], operatingFunction: (node: T) => boolean, onCycle: (node: T) => void): TopSortResult<T> {
    const modifiedNodeIds = modifiedNodes.map(node => this.mapping.get(node)!).reverse()
    modifiedNodeIds.forEach((id: number) => this.runDFS(id))
    return this.postprocess(modifiedNodeIds, onCycle, operatingFunction)
  }

  private runDFS(v: number) {
    if (this.nodeStatus[v] !== undefined) {
      return
    }

    const DFSstack: number[] = [v]
    const SCCstack: number[] = []

    this.nodeStatus[v] = NodeVisitStatus.ON_STACK
    while (DFSstack.length > 0) {
      const u = DFSstack[DFSstack.length - 1]

      switch (this.nodeStatus[u]) {
        case NodeVisitStatus.ON_STACK: {
          this.handleOnStack(u, SCCstack, DFSstack)
          break
        }
        case NodeVisitStatus.PROCESSED: { // leaving this DFS subtree
          this.handleProcessed(u, SCCstack, DFSstack)
          break
        }
        case NodeVisitStatus.POPPED: { // it's a 'shadow' copy, we already processed this vertex and can ignore it
          DFSstack.pop()
          break
        }
      }
    }
  }

  private handleOnStack(u: number, SCCstack: number[], DFSstack: number[]) {
    this.entranceTime[u] = this.time
    this.low[u] = this.time
    SCCstack.push(u)
    this.time++
    this.adjacentNodes(u).forEach((t: number) => {
      if (this.entranceTime[t] === undefined) {
        DFSstack.push(t)
        this.parent[t] = u
        this.nodeStatus[t] = NodeVisitStatus.ON_STACK
      }
    })
    this.nodeStatus[u] = NodeVisitStatus.PROCESSED
  }

  private handleProcessed(u: number, SCCstack: number[], DFSstack: number[]) {
    let uLow: number
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    uLow = this.entranceTime[u]
    this.adjacentNodes(u).forEach((t: number) => { // Ta petla chyba jest niepotrzebna. Chiecko mogloby updatowac low[this.parent]
      if (!this.inSCC[t]) {
        if (this.parent[t] === u) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          uLow = Math.min(uLow, this.low[t])
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          uLow = Math.min(uLow, this.entranceTime[t])
        }
      }
    })
    this.low[u] = uLow
    if (uLow === this.entranceTime[u]) {
      const currentSCC: number[] = []
      do {
        currentSCC.push(SCCstack[SCCstack.length - 1])
        SCCstack.pop()
      } while (currentSCC[currentSCC.length - 1] !== u)
      currentSCC.forEach((t) => {
        this.inSCC[t] = true
      })
      this.order.push(...currentSCC)
      if (currentSCC.length > 1) {
        currentSCC.forEach((t) => {
          this.sccNonSingletons[t] = true
        })
      }
    }
    DFSstack.pop()
    this.nodeStatus[u] = NodeVisitStatus.POPPED
  }

  private postprocess(modifiedNodeIds: number[], onCycle: (node: T) => void, operatingFunction: (node: T) => boolean) {
    const shouldBeUpdatedMapping: boolean[] = []
    modifiedNodeIds.forEach((t: number) => {
      shouldBeUpdatedMapping[t] = true
    })

    const sorted: T[] = []
    const cycled: T[] = []
    this.order.reverse()
    this.order.forEach((t: number) => {
      const adjacentNodes = this.adjacentNodes(t)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (this.sccNonSingletons[t] || adjacentNodes.includes(t)) { // TODO: to jest potencjalnie czas kwadratowy
        cycled.push(this.nodes[t])
        onCycle(this.nodes[t])
        adjacentNodes.forEach((s: number) => shouldBeUpdatedMapping[s] = true)
      } else {
        sorted.push(this.nodes[t])
        if (shouldBeUpdatedMapping[t] && operatingFunction(this.nodes[t])) {
          adjacentNodes.forEach((s: number) => shouldBeUpdatedMapping[s] = true)
        }
      }
    })
    return {sorted, cycled}
  }
}


// TODO:
// 1. experiment with ids -> 15% speedup
// 2. focus on parsing date-time