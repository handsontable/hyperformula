import {AstNodeType, ParserWithCaching} from './parser'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellContent, CellContentParser} from './CellContentParser'
import {DependencyGraph} from './DependencyGraph'
import {SimpleCellAddress} from './Cell'

export class NamedExpressions {
  private nextExternalFormulaId: number = 0
  private workbookNamedExpressions = new Map<string, number>()

  constructor(
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
  ) {
  }

  public addNamedExpression(expressionName: string, formulaString: string): SimpleCellAddress {
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error("This is not a formula")
    }
    const namedExpressionId = ++this.nextExternalFormulaId;
    const address = { sheet: -1, col: 0, row: namedExpressionId }
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    this.workbookNamedExpressions.set(expressionName, namedExpressionId);
    return address
  }

  public getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress {
    const namedExpressionRow = this.workbookNamedExpressions.get(expressionName)!
    return { sheet: -1, col: 0, row: namedExpressionRow }
  }
}
