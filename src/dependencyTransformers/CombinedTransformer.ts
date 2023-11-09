/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, ParserWithCaching} from '../parser'
import {FormulaTransformer} from './Transformer'

export class CombinedTransformer implements FormulaTransformer {
  private readonly transformations: FormulaTransformer[] = []

  constructor(
    public readonly sheet: number
  ) {
  }

  public add(transformation: FormulaTransformer): void {
    this.transformations.push(transformation)
  }

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
    this.transformations.forEach(transformation => transformation.performEagerTransformations(graph, parser))
  }

  public transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress] {
    let [transformedAst, transformedAddress] = [ast, address]
    this.transformations.forEach(transformation => {
      [transformedAst, transformedAddress] = transformation.transformSingleAst(transformedAst, transformedAddress)
    })
    return [transformedAst, transformedAddress]
  }

  public isIrreversible() {
    return true
  }
}
