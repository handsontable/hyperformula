/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import type {Vertex} from '../DependencyGraph'

/** Requests a pending cell calculation from the evaluator's work stack. */
export class PendingValueRead extends Error {
  constructor(public readonly target: Vertex) {
    super()
  }
}
