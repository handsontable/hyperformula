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
    const entranceTime: Map<T, number> = new Map()
    const low: Map<T, number> = new Map()
    const parent: Map<T, T> = new Map()
    const inSCC: Set<T> = new Set() // do we need these data structures? logarithmic factor?

    // node status life cycle:
    // undefined -> ON_STACK -> PROCESSED -> POPPED
    const nodeStatus: Map<T, NodeVisitStatus> = new Map()
    const order: T[] = []

    let time: number = 0

    const sccNonSingletons: Set<T> = new Set()

    modifiedNodes.reverse()
    modifiedNodes.forEach((v: T) => {
      if (nodeStatus.get(v) !== undefined) {
        return
      }
      const DFSstack: T[] = [v]
      const SCCstack: T[] = []
      nodeStatus.set(v, NodeVisitStatus.ON_STACK)
      while (DFSstack.length > 0) {
        const u = DFSstack[DFSstack.length - 1]
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        switch (nodeStatus.get(u)!) {
          case NodeVisitStatus.ON_STACK: {
            entranceTime.set(u, time)
            low.set(u, time)
            SCCstack.push(u)
            time++
            this.adjacentNodes(u).forEach((t: T) => {
              if (entranceTime.get(t) === undefined) {
                DFSstack.push(t)
                parent.set(t, u)
                nodeStatus.set(t, NodeVisitStatus.ON_STACK)
              }
            })
            nodeStatus.set(u, NodeVisitStatus.PROCESSED)
            break
          }
          case NodeVisitStatus.PROCESSED: { // leaving this DFS subtree
            let uLow: number
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            uLow = entranceTime.get(u)!
            this.adjacentNodes(u).forEach((t: T) => { // Ta petla chyba jest niepotrzebna. Chiecko mogloby updatowac low[parent]
              if (!inSCC.has(t)) {
                if (parent.get(t) === u) {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  uLow = Math.min(uLow, low.get(t)!)
                } else {
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  uLow = Math.min(uLow, entranceTime.get(t)!)
                }
              }
            })
            low.set(u, uLow)
            if (uLow === entranceTime.get(u)) {
              const currentSCC: T[] = []
              do {
                currentSCC.push(SCCstack[SCCstack.length - 1])
                SCCstack.pop()
              } while (currentSCC[currentSCC.length - 1] !== u)
              currentSCC.forEach((t) => {
                inSCC.add(t)
              })
              order.push(...currentSCC)
              if (currentSCC.length > 1) {
                currentSCC.forEach((t) => {
                  sccNonSingletons.add(t)
                })
              }
            }
            DFSstack.pop()
            nodeStatus.set(u, NodeVisitStatus.POPPED)
            break
          }
          case NodeVisitStatus.POPPED: { // it's a 'shadow' copy, we already processed this vertex and can ignore it
            DFSstack.pop()
            break
          }
        }
      }
    })

    const shouldBeUpdatedMapping = new Set(modifiedNodes)
    const sorted: T[] = []
    const cycled: T[] = []
    order.reverse()
    order.forEach((t: T) => {
      const adjacentNodes = this.adjacentNodes(t)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (sccNonSingletons.has(t) || adjacentNodes.has(t)) {
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
