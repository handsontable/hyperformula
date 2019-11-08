import {AstNodeType, CellAddress, ErrorAst, ParserWithCaching, StringAst} from "../../src/parser";
import {Config} from "../../src";
import {SheetMapping} from "../../src/DependencyGraph";
import {enGB} from "../../src/i18n";
import {ErrorType} from "../../src/Cell";

describe('Parsing error literals', () => {
  it('should parse error literals', () => {
    const parser = new ParserWithCaching(new Config(), new SheetMapping(enGB).get)
    const ast = parser.parse('=#VALUE!', CellAddress.absolute(0, 0, 0)).ast as ErrorAst
    expect(ast.type).toBe(AstNodeType.ERROR)
    expect(ast.error!.type).toEqual(ErrorType.VALUE)
  })
})
