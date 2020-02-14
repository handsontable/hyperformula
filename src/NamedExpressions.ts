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

class NamedExpressionsStore {
  private readonly mapping = new Map<string, NamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    return !(this.mapping.has(this.normalizeExpressionName(expressionName)))
  }
  
  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.name), namedExpression);
  }

  public get(expressionName: string): NamedExpression | undefined {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public remove(expressionName: string): void {
    this.mapping.delete(this.normalizeExpressionName(expressionName))
  }

  public getAllNamedExpressions(): NamedExpression[] {
    return Array.from(this.mapping.values())
  }

  private normalizeExpressionName(expressionName: string): string {
    return expressionName.toLowerCase()
  }
}

export class NamedExpressions {
  public static SHEET_FOR_WORKBOOK_EXPRESSIONS = -1
  private nextNamedExpressionRow: number = 0
  private workbookStore = new NamedExpressionsStore()

  constructor(
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
  ) {
  }

  public doesNamedExpressionExist(expressionName: string): boolean {
    return this.workbookStore.has(expressionName)
  }

  public isNameAvailable(expressionName: string): boolean {
    return this.workbookStore.isNameAvailable(expressionName)
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
    const namedExpression = new NamedExpression(expressionName, this.nextNamedExpressionRow)
    this.storeFormulaInCell(namedExpression, formulaString)
    this.nextNamedExpressionRow++
    this.workbookStore.add(namedExpression)
  }

  public getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress | null {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      return null
    } else {
      return this.buildAddress(namedExpression.row)
    }
  }

  public removeNamedExpression(expressionName: string): void {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      return
    }
    this.dependencyGraph.setCellEmpty(this.buildAddress(namedExpression.row))
    this.workbookStore.remove(expressionName)
  }

  public changeNamedExpressionFormula(expressionName: string, newFormulaString: string): void {
    const namedExpression = this.workbookStore.get(expressionName)
    if (!namedExpression) {
      throw new Error("Requested Named Expression does not exist")
    }
    this.storeFormulaInCell(namedExpression, newFormulaString)
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.workbookStore.getAllNamedExpressions().map((ne) => ne.name)
  }

  private buildAddress(namedExpressionRow: number) {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, namedExpressionRow)
  }

  private storeFormulaInCell(namedExpression: NamedExpression, formula: string) {
    const parsedCellContent = this.cellContentParser.parse(formula)
    if (!(parsedCellContent instanceof CellContent.Formula)) {
      throw new Error("This is not a formula")
    }
    const address = this.buildAddress(namedExpression.row)
    const {ast, hash, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
    this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
  }
}
