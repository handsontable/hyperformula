import {Config} from '../src'
import {simpleCellAddress} from '../src/Cell'
import {SheetMapping} from '../src/DependencyGraph'
import { ParserWithCaching} from '../src/parser'
import {CellAddress} from '../src/parser/CellAddress'
import {Unparser} from '../src/parser/Unparser'

describe('Unparse', () => {
  const config = new Config()
  const sheetMapping = new SheetMapping()
  sheetMapping.addSheet('Sheet1')
  sheetMapping.addSheet('Sheet2')
  const parser = new ParserWithCaching(config, sheetMapping.fetch)
  const unparser = new Unparser(config, sheetMapping.name)

  it('#unparse', async () => {
    const formula = '=1+SUM(1,2,3)*3'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))
    expect(unparsed).toEqual(formula)
  })

  it('#unparse simple addreess', async () => {
    const formula = '=A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse simple addreess from other sheet', async () => {
    const formula = '=$Sheet1.A1'
    const ast = parser.parse(formula, CellAddress.absolute(1, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(1, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute col', async () => {
    const formula = '=$A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute row addreess', async () => {
    const formula = '=A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse absolute address', async () => {
    const formula = '=$A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell ref between strings', async () => {
    const formula = '="A5"+A4+"A6"'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse  cell ref in string with escape', async () => {
    const formula = '="fdsaf\\"A5"'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell range from same sheet', async () => {
    const formula = '=$A$1:B$2'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse cell range from other sheet', async () => {
    const formula = '=$Sheet1.$A$1:B$2'
    const ast = parser.parse(formula, CellAddress.absolute(1, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(1, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse ops', async () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual(formula)
  })

  it('#unparse with unspecified error', () => {
    const formula = '=1+'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual('=#ERR!')
  })

  it('#unparse with known error', () => {
    const formula = '=#REF!'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(unparsed).toEqual('=#REF!')
  })
})
