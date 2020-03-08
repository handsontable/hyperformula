import {absolutizeDependencies} from './absolutizeDependencies'
import {SimpleCellAddress, simpleCellAddress, InternalCellValue} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {DependencyGraph, AddressMapping, SparseStrategy} from './DependencyGraph'
import {ParserWithCaching} from './parser'
import {CrudOperations} from './CrudOperations'

class NamedExpression {
  constructor(
    public readonly name: string,
    public readonly row: number,
  ) {
  }
}

class NamedExpressionsStore {
  private readonly mapping = new Map<string, NamedExpression>()
  private readonly rowMapping = new Map<number, NamedExpression>()

  public has(expressionName: string): boolean {
    return this.mapping.has(this.normalizeExpressionName(expressionName))
  }

  public isNameAvailable(expressionName: string): boolean {
    return !(this.mapping.has(this.normalizeExpressionName(expressionName)))
  }

  public add(namedExpression: NamedExpression): void {
    this.mapping.set(this.normalizeExpressionName(namedExpression.name), namedExpression)
    this.rowMapping.set(namedExpression.row, namedExpression)
  }

  public get(expressionName: string): NamedExpression | undefined {
    return this.mapping.get(this.normalizeExpressionName(expressionName))
  }

  public getByRow(row: number): NamedExpression | undefined {
    return this.rowMapping.get(row)
  }

  public remove(expressionName: string): void {
    const normalizedExpressionName = this.normalizeExpressionName(expressionName)
    const namedExpression = this.mapping.get(normalizedExpressionName)
    if (namedExpression) {
      this.mapping.delete(normalizedExpressionName)
      this.rowMapping.delete(namedExpression.row)
    }
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
    addressMapping: AddressMapping,
    private readonly cellContentParser: CellContentParser,
    private readonly dependencyGraph: DependencyGraph,
    private readonly parser: ParserWithCaching,
    private readonly crudOperations: CrudOperations,
  ) {
    addressMapping.addSheet(-1, new SparseStrategy(0, 0))
  }

  public doesNamedExpressionExist(expressionName: string): boolean {
    return this.workbookStore.has(expressionName)
  }

  public isNameAvailable(expressionName: string): boolean {
    return this.workbookStore.isNameAvailable(expressionName)
  }

  public fetchNameForNamedExpressionRow(row: number): string {
    const namedExpression = this.workbookStore.getByRow(row)
    if (!namedExpression) {
      throw new Error('Requested Named Expression does not exist')
    }
    return namedExpression.name
  }

  public getDisplayNameByName(expressionName: string): string | undefined {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression) {
      return namedExpression.name
    } else {
      return undefined
    }
  }

  public isNameValid(expressionName: string): boolean {
    if (/^[A-Za-z]+[0-9]+$/.test(expressionName)) {
      return false
    }
    return /^[A-Za-z\u00C0-\u02AF_][A-Za-z0-9\u00C0-\u02AF\._]*$/.test(expressionName)
  }

  public addNamedExpression(expressionName: string, expression: RawCellContent): void {
    if (!this.isNameValid(expressionName)) {
      throw new Error('Name of Named Expression is invalid')
    }
    if (!this.isNameAvailable(expressionName)) {
      throw new Error('Name of Named Expression already taken')
    }
    const namedExpression = new NamedExpression(expressionName, this.nextNamedExpressionRow)
    this.storeExpressionInCell(namedExpression, expression)
    this.nextNamedExpressionRow++
    this.workbookStore.add(namedExpression)
  }

  private getInternalNamedExpressionAddress(expressionName: string): SimpleCellAddress | null {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      return null
    } else {
      return this.buildAddress(namedExpression.row)
    }
  }

  public removeNamedExpression(expressionName: string): boolean {
    const namedExpression = this.workbookStore.get(expressionName)
    if (namedExpression === undefined) {
      return false
    }
    this.dependencyGraph.setCellEmpty(this.buildAddress(namedExpression.row))
    this.workbookStore.remove(expressionName)
    return true
  }

  public changeNamedExpressionExpression(expressionName: string, newExpression: RawCellContent): void {
    const namedExpression = this.workbookStore.get(expressionName)
    if (!namedExpression) {
      throw new Error('Requested Named Expression does not exist')
    }
    this.storeExpressionInCell(namedExpression, newExpression)
  }

  public getAllNamedExpressionsNames(): string[] {
    return this.workbookStore.getAllNamedExpressions().map((ne) => ne.name)
  }

  public getNamedExpressionValue(expressionName: string): InternalCellValue | null {
    const internalNamedExpressionAddress = this.getInternalNamedExpressionAddress(expressionName)
    if (internalNamedExpressionAddress === null) {
      return null
    } else {
      return this.dependencyGraph.getCellValue(internalNamedExpressionAddress)
    }
  }

  private buildAddress(namedExpressionRow: number) {
    return simpleCellAddress(NamedExpressions.SHEET_FOR_WORKBOOK_EXPRESSIONS, 0, namedExpressionRow)
  }

  private storeExpressionInCell(namedExpression: NamedExpression, expression: RawCellContent) {
    const parsedCellContent = this.cellContentParser.parse(expression)
    const address = this.buildAddress(namedExpression.row)
    if (parsedCellContent instanceof CellContent.MatrixFormula) {
      throw new Error('Matrix formulas are not supported')
    } else if (parsedCellContent instanceof CellContent.Formula) {
      const {ast, hasVolatileFunction, hasStructuralChangeFunction, dependencies} = this.parser.parse(parsedCellContent.formula, address)
      this.dependencyGraph.setFormulaToCell(address, ast, absolutizeDependencies(dependencies, address), hasVolatileFunction, hasStructuralChangeFunction)
    } else if (parsedCellContent instanceof CellContent.Empty) {
      this.crudOperations.setCellEmpty(address)
    } else {
      this.crudOperations.setValueToCell(parsedCellContent.value, address)
    }
  }
}
