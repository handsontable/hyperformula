/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import { GraphNode } from './Graph'

/**
 * Base class for all types of vertices in the dependency graph
 */
export abstract class Vertex implements GraphNode {
  public idInGraph?: number

  constructor() {
    this.idInGraph = undefined
  }
}
