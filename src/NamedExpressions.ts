import {AstNodeType, ParserWithCaching} from './parser'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellContent, CellContentParser} from './CellContentParser'
import {DependencyGraph} from './DependencyGraph'
import {SimpleCellAddress} from './Cell'

export class NamedExpressions {
  private nextExternalFormulaId: number = 0

  constructor(
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
  ) {
  }

  public addNamedExpression(formulaString: string): SimpleCellAddress {
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error("This is not a formula")
    }
    const address = { sheet: -1, col: 0, row: this.nextExternalFormulaId }
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    this.nextExternalFormulaId++
    return address
  }
}
