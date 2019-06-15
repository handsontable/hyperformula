import {CellReferenceAst, ParserWithCaching} from "../src/parser";
import {Config} from "../src";
import {SheetMapping} from "../src/SheetMapping";
import {CellAddress} from "../src/parser/CellAddress";
import {simpleCellAddress} from "../src/Cell";
import {Unparser} from "../src/parser/Unparser";

describe('Unparser', () => {
  const sheetMapping = new SheetMapping()
  sheetMapping.addSheet("Sheet1")
  const parser = new ParserWithCaching(new Config(), sheetMapping.fetch)
  const unparser = new Unparser(new Config(), sheetMapping.name)

  it('#unparse', async () => {
    const formula = '=1+SUM(1,2,3)*3'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))
    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse unary minus', async () => {
    const formula = '=-1+3'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse simple addreess', async () => {
    const formula = '=$Sheet1.A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute col', async () => {
    const formula = '=$Sheet1.$A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute row addreess', async () => {
    const formula = '=$Sheet1.A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse absolute address', async () => {
    const formula = '=$Sheet1.$A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })

  it('#unparse cell range', async () => {
    const formula = '=$Sheet1.$A$1:B$2'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual("=" + unparsed)
  })
})
