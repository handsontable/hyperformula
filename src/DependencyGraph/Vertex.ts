/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {GraphNode} from './Graph'

/**
 * Base class for all types of vertices in the dependency graph
 */
export abstract class Vertex implements GraphNode {
  /**
   * Used internally by Graph class. Should not be set by other classes.
   * idInGraph is defined if and only if the vertex is stored in dependency graph.
   */
  public idInGraph?: number
}
