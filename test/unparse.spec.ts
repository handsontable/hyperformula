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
  const parser = new ParserWithCaching(config, sheetMapping.fetch)
  const unparser = new Unparser(config, sheetMapping.name)

  it('#unparse', async () => {
    const formula = '=1+SUM(1,2,3)*3'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))
    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse simple addreess', async () => {
    const formula = '=$Sheet1.A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse absolute col', async () => {
    const formula = '=$Sheet1.$A1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse absolute row addreess', async () => {
    const formula = '=$Sheet1.A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse absolute address', async () => {
    const formula = '=$Sheet1.$A$1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse cell ref between strings', async () => {
    const formula = '="A5"+$Sheet1.A4+"A6"'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse  cell ref in string with escape', async () => {
    const formula = '="fdsaf\\"A5"'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse cell range', async () => {
    const formula = '=$Sheet1.$A$1:B$2'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })

  it('#unparse ops', async () => {
    const formula = '=-1+1-1*1/1^1&1=1<>1<1<=1>1<1'
    const ast = parser.parse(formula, CellAddress.absolute(0, 0, 0)).ast
    const unparsed = unparser.unparse(ast, simpleCellAddress(0, 0, 0))

    expect(formula).toEqual('=' + unparsed)
  })
})
