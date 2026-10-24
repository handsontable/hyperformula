/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

export interface TopSortResult<T> {
  sorted: T[],
  cycled: T[],
  /**
   * Nodes that still have to be recomputed in another pass. Always empty: a node that reads a pending node is
   * retried in the same pass, after the pending node is computed.
   */
  deferred: T[],
}

/**
 * Outcome of processing a single node during a top-sort pass.
 */
export enum NodeProcessingResult {
  /** The node was recomputed and its value changed. */
  CHANGED = 'CHANGED',
  /** The node was recomputed and its value did not change. */
  UNCHANGED = 'UNCHANGED',
  /**
   * The node read a value that is not current yet, and requested that node with {@link TopSort.requestPull}.
   * It is recomputed again once the requested node is computed.
   */
  DEFERRED = 'DEFERRED',
}

// node status life cycle: undefined -> ON_STACK -> PROCESSED -> POPPED
enum NodeVisitStatus {
  ON_STACK,
  PROCESSED,
  POPPED,
}

/**
 * An algorithm class. Provides an iterative implementation of Tarjan's algorithm for finding strongly connected components
 */
export class TopSort<T> {
  private entranceTime: number[] = []
  private low: number[] = []
  private parent: number[] = []
  private inSCC: boolean[] = []
  private nodeStatus: NodeVisitStatus[] = []
  private order: number[] = []
  private sccNonSingletons: boolean[] = []
  private finalized: boolean[] = []
  private onPullPath: boolean[] = []
  private pendingPrecedents: Map<number, number[]> = new Map()
  private pullRequest?: number
  private shouldBeUpdatedMapping: boolean[] = []
  private sorted: T[] = []
  private cycled: T[] = []
  private timeCounter: number = 0

  /**
   * @param nodesSparseArray - nodes by id
   * @param edgesSparseArray - ids of the dependents of each node, by id
   * @param precedentIds - ids of the nodes a node reads; used only for nodes pulled out of order
   */
  constructor(
    private nodesSparseArray: T[] = [],
    private edgesSparseArray: number[][] = [],
    private precedentIds: (id: number) => number[] = () => [],
  ) {
  }

  /**
   * An iterative implementation of Tarjan's algorithm for finding strongly connected components.
   * Returns vertices in order of topological sort, but vertices that are on cycles are kept separate.
   *
   * @param modifiedNodes - seed for computation. During engine init run, all of the vertices of grap. In recomputation run, changed vertices.
   * @param operatingFunction - recomputes value of a node, and returns the outcome
   * @param onCycle - action to be performed when node is on cycle
   */
  public getTopSortedWithSccSubgraphFrom(
    modifiedNodeIds: number[],
    operatingFunction: (node: T) => NodeProcessingResult,
    onCycle: (node: T) => void
  ): TopSortResult<T> {
    const modifiedNodeIdsReversed = modifiedNodeIds.reverse()
    modifiedNodeIdsReversed.forEach((id: number) => this.runDFS(id))
    return this.postprocess(modifiedNodeIdsReversed, onCycle, operatingFunction)
  }

  /**
   * Returns true if the node was reached by this pass and has not been finalized yet,
   * i.e., its value may still change later in the pass.
   */
  public isPending(id: number): boolean {
    return Boolean(this.inSCC[id]) && !this.finalized[id]
  }

  /**
   * Requests that a pending node is computed before the node being processed is retried.
   * The operating function calls it right before it returns {@link NodeProcessingResult.DEFERRED}.
   */
  public requestPull(id: number): void {
    this.pullRequest = id
  }

  /**
   * Returns adjacent nodes of a given node.
   */
  private getAdjacentNodeIds(id: number): number[] {
    return this.edgesSparseArray[id].filter(adjacentId => adjacentId !== undefined && this.nodesSparseArray[adjacentId])
  }

  /**
   * Runs DFS starting from a given node.
   */
  private runDFS(v: number) {
    if (this.nodeStatus[v] !== undefined) {
      return
    }

    this.nodeStatus[v] = NodeVisitStatus.ON_STACK
    const DFSstack: number[] = [v]
    const SCCstack: number[] = []

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

  /**
   * Handles a node that is on stack.
   */
  private handleOnStack(u: number, SCCstack: number[], DFSstack: number[]) {
    this.entranceTime[u] = this.timeCounter
    this.low[u] = this.timeCounter
    this.timeCounter++
    SCCstack.push(u)

    this.getAdjacentNodeIds(u).forEach((t: number) => {
      if (this.entranceTime[t] === undefined) {
        DFSstack.push(t)
        this.parent[t] = u
        this.nodeStatus[t] = NodeVisitStatus.ON_STACK
      }
    })

    this.nodeStatus[u] = NodeVisitStatus.PROCESSED
  }

  /**
   * Handles a node that is already processed.
   */
  private handleProcessed(u: number, SCCstack: number[], DFSstack: number[]) {
    let uLow = this.entranceTime[u]

    this.getAdjacentNodeIds(u).forEach((t: number) => {
      if (this.inSCC[t]) {
        return
      }

      uLow = this.parent[t] === u ? Math.min(uLow, this.low[t]) : Math.min(uLow, this.entranceTime[t])
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

  /**
   * Postprocesses the result of Tarjan's algorithm: processes the nodes in topological order.
   *
   * A node whose operating function returns DEFERRED has read a pending node P. P is pulled: its pending precedents
   * and then P itself are processed right away, from an explicit stack, and the node is retried. The main walk skips
   * nodes that were already processed this way. A pull that reaches a node already on the pull path is a cycle.
   */
  private postprocess(modifiedNodeIds: number[], onCycle: (node: T) => void, operatingFunction: (node: T) => NodeProcessingResult): TopSortResult<T> {
    modifiedNodeIds.forEach((t: number) => {
      this.shouldBeUpdatedMapping[t] = true
    })

    this.order.reverse()

    for (const t of this.order) {
      if (this.finalized[t] || this.nodesSparseArray[t] === undefined) {
        continue
      }
      this.pullRequest = undefined
      if (this.processNode(t, onCycle, operatingFunction) === NodeProcessingResult.DEFERRED) {
        this.pullFor(t, onCycle, operatingFunction)
      }
    }

    return {sorted: this.sorted, cycled: this.cycled, deferred: []}
  }

  /**
   * Called after the root node was deferred: pulls the pending nodes it reads and retries it until it is finalized.
   */
  private pullFor(root: number, onCycle: (node: T) => void, operatingFunction: (node: T) => NodeProcessingResult): void {
    const stack: number[] = [root]
    this.onPullPath[root] = true
    this.pushRequestedNode(stack, onCycle)

    while (stack.length > 0) {
      const t = stack[stack.length - 1]

      if (this.finalized[t] || this.nodesSparseArray[t] === undefined) {
        stack.pop()
        this.onPullPath[t] = false
        continue
      }

      if (t !== root) {
        const precedent = this.nextPendingPrecedent(t)
        if (precedent !== undefined) {
          if (this.onPullPath[precedent]) {
            this.finalizeCycle(stack, precedent, onCycle)
          } else {
            stack.push(precedent)
            this.onPullPath[precedent] = true
          }
          continue
        }
      }

      this.pullRequest = undefined
      if (this.processNode(t, onCycle, operatingFunction) === NodeProcessingResult.DEFERRED) {
        this.pushRequestedNode(stack, onCycle)
      }
    }
  }

  /**
   * Pushes the node requested by the deferred node on top of the stack, or gives the cycle treatment to the pull path
   * if the requested node is already on it.
   */
  private pushRequestedNode(stack: number[], onCycle: (node: T) => void): void {
    const target = this.pullRequest
    if (target === undefined || !this.isPending(target)) {
      throw new Error('A node was deferred without requesting a pending node.')
    }
    if (this.onPullPath[target]) {
      this.finalizeCycle(stack, target, onCycle)
    } else {
      stack.push(target)
      this.onPullPath[target] = true
    }
  }

  /**
   * Returns a precedent of a pulled node that is still pending, or undefined if there is none.
   * The pending precedents are collected once per node and consumed as they get finalized.
   */
  private nextPendingPrecedent(t: number): number | undefined {
    let pending = this.pendingPrecedents.get(t)
    if (pending === undefined) {
      pending = this.precedentIds(t).filter(id => this.isPending(id))
      this.pendingPrecedents.set(t, pending)
    }
    while (pending.length > 0 && !this.isPending(pending[pending.length - 1])) {
      pending.pop()
    }
    return pending.length > 0 ? pending[pending.length - 1] : undefined
  }

  /**
   * Gives every node on the pull path from the given node to the top of the stack the cycle treatment.
   */
  private finalizeCycle(stack: number[], from: number, onCycle: (node: T) => void): void {
    for (let i = stack.indexOf(from); i < stack.length; i++) {
      const t = stack[i]
      if (this.finalized[t]) {
        continue
      }
      const node = this.nodesSparseArray[t]
      this.cycled.push(node)
      onCycle(node)
      this.getAdjacentNodeIds(t).forEach((s: number) => this.shouldBeUpdatedMapping[s] = true)
      this.finalized[t] = true
    }
  }

  /**
   * Processes a single node: gives it the cycle treatment, skips it if it is current, or runs the operating function.
   * Finalizes the node unless the operating function returns DEFERRED.
   */
  private processNode(t: number, onCycle: (node: T) => void, operatingFunction: (node: T) => NodeProcessingResult): NodeProcessingResult {
    const node = this.nodesSparseArray[t]
    const adjacentNodes = this.getAdjacentNodeIds(t)

    // The following line is a potential performance bottleneck.
    // Array.includes() is O(n) operation, which makes the whole algorithm O(n^2).
    // Idea for improvement: use Set<T>[] instead of number[][] for edgesSparseArray.
    if (this.sccNonSingletons[t] || adjacentNodes.includes(t)) {
      this.cycled.push(node)
      onCycle(node)
      adjacentNodes.forEach((s: number) => this.shouldBeUpdatedMapping[s] = true)
      this.finalized[t] = true
      return NodeProcessingResult.CHANGED
    }

    if (!this.shouldBeUpdatedMapping[t]) {
      this.sorted.push(node)
      this.finalized[t] = true
      return NodeProcessingResult.UNCHANGED
    }

    const result = operatingFunction(node)

    if (result === NodeProcessingResult.DEFERRED) {
      return result
    }

    this.sorted.push(node)
    this.finalized[t] = true
    if (result === NodeProcessingResult.CHANGED) {
      adjacentNodes.forEach((s: number) => this.shouldBeUpdatedMapping[s] = true)
    }
    return result
  }
}
