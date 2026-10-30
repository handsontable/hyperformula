/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Signal thrown by a function that needs the value of a cell that is not current yet in the running evaluation pass.
 * The evaluator catches it, computes the requested cell, and retries the formula. A function that catches it, e.g., a
 * custom function with a try/catch, does not change that: an evaluation that requested a cell never stores its value.
 */
export class EvaluationDeferred extends Error {
  constructor() {
    super('Evaluation deferred to a later pass.')
    this.name = 'EvaluationDeferred'
  }
}

/**
 * The only instance of {@link EvaluationDeferred}. Created once, so throwing it does not capture a stack trace each time.
 */
export const EVALUATION_DEFERRED = new EvaluationDeferred()
