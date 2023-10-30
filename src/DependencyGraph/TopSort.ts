/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

export interface TopSortResult<T> {
  sorted: T[],
  cycled: T[],
}

// node status life cycle: undefined -> ON_STACK -> PROCESSED -> POPPED
enum NodeVisitStatus {
  ON_STACK,
  PROCESSED,
  POPPED,
}

type id = string | number

/**
 * An algorithm class. Provides an iterative implementation of Tarjan's algorithm for finding strongly connected components
 */
export class TopSort<T> {
  private entranceTime: Map<id, number> = new Map()
  private low: Map<id, number> = new Map()
  private parent: Map<id, id> = new Map()
  private inSCC: Map<id, boolean> = new Map()
  private nodeStatus: Map<id, NodeVisitStatus> = new Map()
  private order: id[] = []
  private sccNonSingletons: Map<id, boolean> = new Map()
  private timeCounter: number = 0

  constructor(
    private nodes: Map<id, T> = new Map(),
    private edges: Map<id, Set<id>> = new Map(),
  ) {
  }

  /**
   * An iterative implementation of Tarjan's algorithm for finding strongly connected components.
   * Returns vertices in order of topological sort, but vertices that are on cycles are kept separate.
   *
   * @param modifiedNodes - seed for computation. During engine init run, all of the vertices of grap. In recomputation run, changed vertices.
   * @param operatingFunction - recomputes value of a node, and returns whether a change occured
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(
    modifiedNodeIds: id[],
    operatingFunction: (node: T) => boolean,
    onCycle: (node: T) => void
  ): TopSortResult<T> {
    const modifiedNodeIdsReversed = modifiedNodeIds.reverse()
    modifiedNodeIdsReversed.forEach(id => this.runDFS(id))
    return this.postprocess(modifiedNodeIdsReversed, onCycle, operatingFunction)
  }

  /**
   * Returns adjacent nodes of a given node.
   */
  private getAdjacentNodeIds(id: id) {
    const edges = this.edges.get(id)
    if (edges === undefined) {
      throw new Error(`Edge set missing for node ${id}: ${Array.from(this.nodes.keys())}`)
    }
    return new Set(Array.from(edges.values()).filter(id => this.nodes.has(id)))
  }

  /**
   * Runs DFS starting from a given node.
   */
  private runDFS(v: id) {
    if (this.nodeStatus.has(v)) {
      return
    }

    this.nodeStatus.set(v, NodeVisitStatus.ON_STACK)
    const DFSstack: id[] = [v]
    const SCCstack: id[] = []

    while (DFSstack.length > 0) {
      const u = DFSstack[DFSstack.length - 1]

      switch (this.nodeStatus.get(u)) {
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

  /**
   * Handles a node that is on stack.
   */
  private handleOnStack(u: id, SCCstack: id[], DFSstack: id[]) {
    this.entranceTime.set(u, this.timeCounter)
    this.low.set(u, this.timeCounter)
    this.timeCounter++
    SCCstack.push(u)

    this.getAdjacentNodeIds(u).forEach(t => {
      if (!this.entranceTime.has(t)) {
        DFSstack.push(t)
        this.parent.set(t, u)
        this.nodeStatus.set(t, NodeVisitStatus.ON_STACK)
      }
    })

    this.nodeStatus.set(u, NodeVisitStatus.PROCESSED)
  }

  /**
   * Handles a node that is already processed.
   */
  private handleProcessed(u: id, SCCstack: id[], DFSstack: id[]) {
    let uLow = this.entranceTime.get(u) as number

    this.getAdjacentNodeIds(u).forEach(t => {
      if (this.inSCC.get(t)) {
        return
      }

      uLow = this.parent.get(t) === u ? Math.min(uLow, this.low.get(t)!) : Math.min(uLow, this.entranceTime.get(t)!)
    })

    this.low.set(u, uLow)

    if (uLow === this.entranceTime.get(u)) {
      const currentSCC: id[] = []

      do {
        currentSCC.push(SCCstack[SCCstack.length - 1])
        SCCstack.pop()
      } while (currentSCC[currentSCC.length - 1] !== u)

      currentSCC.forEach((t) => {
        this.inSCC.set(t, true)
      })

      this.order.push(...currentSCC)

      if (currentSCC.length > 1) {
        currentSCC.forEach((t) => {
          this.sccNonSingletons.set(t, true)
        })
      }
    }

    DFSstack.pop()
    this.nodeStatus.set(u, NodeVisitStatus.POPPED)
  }

  /**
   * Postprocesses the result of Tarjan's algorithm.
   */
  private postprocess(modifiedNodeIds: id[], onCycle: (node: T) => void, operatingFunction: (node: T) => boolean) {
    const shouldBeUpdatedMapping: Map<id, boolean> = new Map()

    modifiedNodeIds.forEach(t => shouldBeUpdatedMapping.set(t, true))

    const sorted: T[] = []
    const cycled: T[] = []
    this.order.reverse()

    this.order.forEach(t => {
      const adjacentNodes = this.getAdjacentNodeIds(t)
      const node = this.nodes.get(t) as T
      if (this.sccNonSingletons.get(t) || adjacentNodes.has(t)) {
        cycled.push(node)
        onCycle(node)
        adjacentNodes.forEach(s => shouldBeUpdatedMapping.set(s, true))
      } else {
        sorted.push(node)
        if (shouldBeUpdatedMapping.get(t) && operatingFunction(node)) {
          adjacentNodes.forEach(s => shouldBeUpdatedMapping.set(s, true))
        }
      }
    })

    return {sorted, cycled}
  }
}
