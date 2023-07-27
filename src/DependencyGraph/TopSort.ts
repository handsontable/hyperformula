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
  private entranceTime: Map<T, number> = new Map()
  private low: Map<T, number> = new Map()
  private parent: Map<T, T> = new Map()
  private inSCC: Set<T> = new Set() // do we need these data structures? logarithmic factor?

  // node status life cycle:
  // undefined -> ON_STACK -> PROCESSED -> POPPED
  private nodeStatus: Map<T, NodeVisitStatus> = new Map()
  private order: T[] = []

  private time: number = 0

  private sccNonSingletons: Set<T> = new Set()

  constructor(
    private edges: Map<T, Set<T>> = new Map()
  ) {}

  public adjacentNodes(node: T): Set<T> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.edges.get(node)!
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
    modifiedNodes.reverse()
    modifiedNodes.forEach((v: T) => this.runDFS(v))
    return this.postprocess(modifiedNodes, onCycle, operatingFunction)
  }

  private runDFS(v: T) {
    if (this.nodeStatus.get(v) !== undefined) {
      return
    }

    const DFSstack: T[] = [v]
    const SCCstack: T[] = []

    this.nodeStatus.set(v, NodeVisitStatus.ON_STACK)
    while (DFSstack.length > 0) {
      const u = DFSstack[DFSstack.length - 1]

      switch (this.nodeStatus.get(u)!) {
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

  private handleOnStack(u: T, SCCstack: T[], DFSstack: T[]) {
    this.entranceTime.set(u, this.time)
    this.low.set(u, this.time)
    SCCstack.push(u)
    this.time++
    this.adjacentNodes(u).forEach((t: T) => {
      if (this.entranceTime.get(t) === undefined) {
        DFSstack.push(t)
        this.parent.set(t, u)
        this.nodeStatus.set(t, NodeVisitStatus.ON_STACK)
      }
    })
    this.nodeStatus.set(u, NodeVisitStatus.PROCESSED)
  }

  private handleProcessed(u: T, SCCstack: T[], DFSstack: T[]) {
    let uLow: number
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    uLow = this.entranceTime.get(u)!
    this.adjacentNodes(u).forEach((t: T) => { // Ta petla chyba jest niepotrzebna. Chiecko mogloby updatowac low[this.parent]
      if (!this.inSCC.has(t)) {
        if (this.parent.get(t) === u) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          uLow = Math.min(uLow, this.low.get(t)!)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          uLow = Math.min(uLow, this.entranceTime.get(t)!)
        }
      }
    })
    this.low.set(u, uLow)
    if (uLow === this.entranceTime.get(u)) {
      const currentSCC: T[] = []
      do {
        currentSCC.push(SCCstack[SCCstack.length - 1])
        SCCstack.pop()
      } while (currentSCC[currentSCC.length - 1] !== u)
      currentSCC.forEach((t) => {
        this.inSCC.add(t)
      })
      this.order.push(...currentSCC)
      if (currentSCC.length > 1) {
        currentSCC.forEach((t) => {
          this.sccNonSingletons.add(t)
        })
      }
    }
    DFSstack.pop()
    this.nodeStatus.set(u, NodeVisitStatus.POPPED)
  }

  private postprocess(modifiedNodes: T[], onCycle: (node: T) => void, operatingFunction: (node: T) => boolean) {
    const shouldBeUpdatedMapping = new Set(modifiedNodes)
    const sorted: T[] = []
    const cycled: T[] = []
    this.order.reverse()
    this.order.forEach((t: T) => {
      const adjacentNodes = this.adjacentNodes(t)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (this.sccNonSingletons.has(t) || adjacentNodes.has(t)) {
        cycled.push(t)
        onCycle(t)
        adjacentNodes.forEach((s: T) => shouldBeUpdatedMapping.add(s))
      } else {
        sorted.push(t)
        if (shouldBeUpdatedMapping.has(t) && operatingFunction(t)) {
          adjacentNodes.forEach((s: T) => shouldBeUpdatedMapping.add(s))
        }
      }
    })
    return {sorted, cycled}
  }
}
