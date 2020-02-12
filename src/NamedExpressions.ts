import {AstNodeType, ParserWithCaching} from './parser'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellContent, CellContentParser} from './CellContentParser'
import {DependencyGraph} from './DependencyGraph'
import {SimpleCellAddress, simpleCellAddress} from './Cell'

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  private workbookNamedExpressions = new Map<string, number>()

  constructor(
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
  ) {
  }

  public isNameAvailable(expressionName: string): boolean {
    return !(this.workbookNamedExpressions.has(expressionName))
  }

  public isNameValid(expressionName: string): boolean {
    return !expressionName.match(/^\d/)
  }

  public addNamedExpression(expressionName: string, formulaString: string): void {
    if (!this.isNameValid(expressionName)) {
      throw new Error("Name of Named Expression is invalid")
    }
    if (!this.isNameAvailable(expressionName)) {
      throw new Error("Name of Named Expression already taken")
    }
    const parsedCellContent = this.cellContentParser.parse(formulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error("This is not a formula")
    }
    const namedExpressionRow = ++this.nextNamedExpressionRow;
    const address = this.buildAddress(namedExpressionRow)
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    this.workbookNamedExpressions.set(expressionName, namedExpressionRow);
  }

  public getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress | null {
    const namedExpressionRow = this.workbookNamedExpressions.get(expressionName)!
    if (namedExpressionRow === undefined) {
      return null
    } else {
      return this.buildAddress(namedExpressionRow)
    }
  }

  public removeNamedExpression(expressionName: string): void {
    const namedExpressionRow = this.workbookNamedExpressions.get(expressionName)
    if (namedExpressionRow === undefined) {
      return
    }
    this.dependencyGraph.setCellEmpty(this.buildAddress(namedExpressionRow))
    this.workbookNamedExpressions.delete(expressionName)
  }

  private buildAddress(namedExpressionRow: number) {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, namedExpressionRow)
  }
}
