import {AstNodeType, ParserWithCaching} from './parser'
import {absolutizeDependencies} from './absolutizeDependencies'
import {CellContent, CellContentParser} from './CellContentParser'
import {DependencyGraph} from './DependencyGraph'
import {SimpleCellAddress, simpleCellAddress} from './Cell'

class NamedExpression {
  constructor(
    public readonly name: string,
    public readonly row: number
  ) {
  }
}

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  private workbookNamedExpressions = new Map<string, NamedExpression>()

  constructor(
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
  ) {
  }

  public doesNamedExpressionExist(expressionName: string): boolean {
    return this.workbookNamedExpressions.has(expressionName)
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
    const namedExpression = new NamedExpression(expressionName, ++this.nextNamedExpressionRow)
    const address = this.buildAddress(namedExpression.row)
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    this.workbookNamedExpressions.set(namedExpression.name, namedExpression);
  }

  public getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress | null {
    const namedExpression = this.workbookNamedExpressions.get(expressionName)!
    if (namedExpression === undefined) {
      return null
    } else {
      return this.buildAddress(namedExpression.row)
    }
  }

  public removeNamedExpression(expressionName: string): void {
    const namedExpression = this.workbookNamedExpressions.get(expressionName)
    if (namedExpression === undefined) {
      return
    }
    this.dependencyGraph.setCellEmpty(this.buildAddress(namedExpression.row))
    this.workbookNamedExpressions.delete(expressionName)
  }

  public changeNamedExpressionFormula(expressionName: string, newFormulaString: string): void {
    const namedExpression = this.workbookNamedExpressions.get(expressionName)!
    const address = this.buildAddress(namedExpression.row)
    const parsedCellContent = this.cellContentParser.parse(newFormulaString)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error("This is not a formula")
    }
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
  }

  public getAllNamedExpressionsNames(): string[] {
    return Array.from(this.workbookNamedExpressions.keys())
  }

  private buildAddress(namedExpressionRow: number) {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, namedExpressionRow)
  }
}
