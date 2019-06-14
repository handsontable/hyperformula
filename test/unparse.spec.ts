import {CellReferenceAst, ParserWithCaching} from "../src/parser";
import {Config} from "../src";
import {SheetMapping} from "../src/SheetMapping";
import {CellAddress} from "../src/parser/CellAddress";
import {unparse} from "../src/parser/Unparser";
import {simpleCellAddress} from "../src/Cell";

describe('Unparse', () => {
  it('#unparse', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=1+SUM(1,2,3)*3'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse unary minus', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=-1+3'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse simple addreess', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=$Sheet1.A1'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute col', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=$Sheet1.$A1'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute row addreess', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=$Sheet1.A$1'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute address', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=$Sheet1.$A$1'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse cell range', async () => {
    const sheetMapping = new SheetMapping()
    sheetMapping.addSheet("Sheet1")
    const formula = '=$Sheet1.$A$1:B$2'
    const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparse(ast, simpleCellAddress(0, 0, 0), sheetMapping.name)

    expect(formula).toEqual("=" + unparsed)
  })
})
