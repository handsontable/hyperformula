import {ParserWithCaching} from '../src/parser/ParserWithCaching'
import {
  AstNodeType,
  CellRangeAst,
  CellReferenceAst,
  ErrorAst,
  NumberAst,
  PlusOpAst,
  ProcedureAst,
  StringAst
} from '../src/parser/Ast'
import {CellReferenceType, relativeCellAddress} from '../src/Cell'

const sharedExamples = (optimizationMode: string) => {
  it("integer literal", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=42") as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(42)
  })

  it("string literal", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("='foobar'") as StringAst
    expect(ast.type).toBe(AstNodeType.STRING)
    expect(ast.value).toBe("foobar")
  })

  it("plus operator on different nodes", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=1+A5") as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it("cell reference types", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const cellAbs = parser.parse("=$A$1") as CellReferenceAst
    const cellAbsCol = parser.parse("=$A2") as CellReferenceAst
    const cellAbsRow = parser.parse("=A$2") as CellReferenceAst
    const cellRel = parser.parse("=A2") as CellReferenceAst

    expect(cellAbs.reference.type).toEqual(CellReferenceType.CELL_REFERENCE_ABSOLUTE)
    expect(cellAbsCol.reference.type).toEqual(CellReferenceType.CELL_REFERENCE_ABSOLUTE_COL)
    expect(cellAbsRow.reference.type).toEqual(CellReferenceType.CELL_REFERENCE_ABSOLUTE_ROW)
    expect(cellRel.reference.type).toEqual(CellReferenceType.CELL_REFERENCE_RELATIVE)
  })

  it("it use cache for similar formulas", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast1 = parser.parse("=A1")
    const ast2 = parser.parse("=A2")

    expect(ast1).toEqual(ast2)
    expect(parser.statsCacheUsed).toBe(1)
  })

  it("doesn't count cache for different formulas", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const bast1 = parser.parse("=A1")
    const bast2 = parser.parse("=A2+A3")

    expect(parser.statsCacheUsed).toBe(0)
  })

  it("SUM function without args", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const ast = parser.parse("=SUM()") as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args.length).toBe(0)
  })

  it("SUM function with args", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const ast = parser.parse("=SUM(1; A1)") as ProcedureAst
    expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
    expect(ast.procedureName).toBe("SUM")
    expect(ast.args[0].type).toBe(AstNodeType.NUMBER)
    expect(ast.args[1].type).toBe(AstNodeType.CELL_REFERENCE)
  })

  it("joining nodes without braces", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const ast = parser.parse("=1 + 2 + 3") as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.right.type).toBe(AstNodeType.NUMBER)
  })

  it("joining nodes with braces", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const ast = parser.parse("=1 + (2 + 3)") as PlusOpAst
    expect(ast.type).toBe(AstNodeType.PLUS_OP)
    expect(ast.left.type).toBe(AstNodeType.NUMBER)
    expect(ast.right.type).toBe(AstNodeType.PLUS_OP)
  })

  it("float literal", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const ast = parser.parse("=3.14") as NumberAst
    expect(ast.type).toBe(AstNodeType.NUMBER)
    expect(ast.value).toBe(3.14)
  })

  it("leading zeros", () => {
    const parser = new ParserWithCaching(optimizationMode)
    const int = parser.parse("=01234") as NumberAst
    const float = parser.parse("=03.14") as NumberAst
    expect(int.type).toBe(AstNodeType.NUMBER)
    expect(int.value).toBe(1234)
    expect(float.type).toBe(AstNodeType.NUMBER)
    expect(float.value).toBe(3.14)
  })

  it("simple cell range", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=A1:B2") as CellRangeAst
    expect(ast.type).toBe(AstNodeType.CELL_RANGE)
  })

  it("parsing error - unexpected token", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=A") as ErrorAst
    expect(ast.args[0].name).toBe("MismatchedTokenException")
  })

  it("parsing error - unexpected token", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=SUM(A)") as ErrorAst
    expect(ast.args[0].name).toBe("MismatchedTokenException")
  })

  it("parsing error - not all input parsed", () => {
    const parser = new ParserWithCaching(optimizationMode)

    const ast = parser.parse("=A1B1") as ErrorAst
    expect(ast.args[0].name).toBe("NotAllInputParsedException")
  })
};

describe('ParserWithCaching - parser optimizations', () => {
  sharedExamples('parser')
});
