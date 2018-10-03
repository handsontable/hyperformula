import {FullParser} from '../src/parser/FullParser'
import {AstNodeType} from "../src/AstNodeType"

describe('Basic parser test', () => {
    const parser = new FullParser()

    it('#parse produces simple node with correct type', () => {
        // operators
        expect(parser.parse("1").type).toBe(AstNodeType.NUMBER)
        expect(parser.parse("'foo'").type).toBe(AstNodeType.STRING)
        expect(parser.parse("1-2").type).toBe(AstNodeType.MINUS_OP)
        expect(parser.parse("1*2").type).toBe(AstNodeType.TIMES_OP)
        expect(parser.parse("1/2").type).toBe(AstNodeType.DIV_OP)
        expect(parser.parse("1^2").type).toBe(AstNodeType.POW_OP)
        expect(parser.parse("-2").type).toBe(AstNodeType.NEGATIVE_OP)
        expect(parser.parse("+2").type).toBe(AstNodeType.POSITIVE_OP)
        expect(parser.parse("1&2").type).toBe(AstNodeType.AND_OP)

        // cell addressing
        expect(parser.parse("A5").type).toBe(AstNodeType.RELATIVE_CELL)
        expect(parser.parse("$A$5").type).toBe(AstNodeType.ABSOLUTE_CELL)
        expect(parser.parse("A$5").type).toBe(AstNodeType.MIXED_CELL)
        expect(parser.parse("$A5").type).toBe(AstNodeType.MIXED_CELL)

        // range of cells
        expect(parser.parse("A5:B5").type).toBe(AstNodeType.CELL_RANGE)
        expect(parser.parse("$A$5:B5").type).toBe(AstNodeType.CELL_RANGE)
        expect(parser.parse("A$5:B5").type).toBe(AstNodeType.CELL_RANGE)
        expect(parser.parse("$A5:B5").type).toBe(AstNodeType.CELL_RANGE)
    })

    it("plus operator on literals", () => {
        const ast = parser.parse("1+2")

        expect(ast.type).toBe(AstNodeType.PLUS_OP)
        expect(ast.args).toEqual([
            { type: AstNodeType.NUMBER, args: ["1"] },
            { type: AstNodeType.NUMBER, args: ["2"] },
        ])
    })

    it("function calls without arguments", () => {
        const ast = parser.parse("SUM()")

        expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
        expect(ast.args).toEqual(["SUM"])
    })

    it("function calls with arguments", () => {
        const ast = parser.parse("SUM(1, 2)")

        expect(ast.type).toBe(AstNodeType.FUNCTION_CALL)
        expect(ast.args[0]).toBe("SUM")
        expect(ast.args[1]).toEqual([
            { type: AstNodeType.NUMBER, args: ["1"] },
            { type: AstNodeType.NUMBER, args: ["2"] },
        ])
    })
});
