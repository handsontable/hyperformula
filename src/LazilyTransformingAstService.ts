import {SimpleCellAddress} from './Cell'
import {Ast, ParserWithCaching} from './parser'
import {Statistics} from './statistics/Statistics'
import {UndoRedo} from './UndoRedo'
import {RemoveRowsTransformer} from './dependencyTransformers/RemoveRowsTransformer'
import {FormulaTransformer} from './dependencyTransformers/Transformer'
import {StatType} from './statistics'

export class LazilyTransformingAstService {

  public parser?: ParserWithCaching
  public undoRedo?: UndoRedo
  private transformations: FormulaTransformer[] = []

  constructor(
    private readonly stats: Statistics,
  ) {
  }

  public version(): number {
    return this.transformations.length
  }

  public addTransformation(transformation: FormulaTransformer): number {
    this.transformations.push(transformation)
    return this.version()
  }

  public applyTransformations(ast: Ast, address: SimpleCellAddress, version: number): [Ast, SimpleCellAddress, number] {
    this.stats.start(StatType.TRANSFORM_ASTS_POSTPONED)

    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      if (transformation instanceof RemoveRowsTransformer) {
        this.undoRedo!.storeDataForVersion(v, address, this.parser!.computeHashFromAst(ast))
      }

      const [newAst, newAddress] = transformation.transformSingleAst(ast, address)
      ast = newAst
      address = newAddress
    }
    const cachedAst = this.parser!.rememberNewAst(ast)

    this.stats.end(StatType.TRANSFORM_ASTS_POSTPONED)
    return [cachedAst, address, this.transformations.length]
  }

  public* getTransformationsFrom(version: number, filter?: (transformation: FormulaTransformer) => boolean): IterableIterator<FormulaTransformer> {
    for (let v = version; v < this.transformations.length; v++) {
      const transformation = this.transformations[v]
      if (!filter || filter(transformation)) {
        yield transformation
      }
    }
  }

  public destroy() {
    this.parser = undefined
    this.transformations = []
  }
}
