import {Parser} from '../src/parser/Parser'
import {RawAstNodeType} from "../src/parser/RawAstNodeType"

describe('Basic parser test', () => {
    const parser = new Parser()

    it('#parse produces simple node with correct type', () => {
        // operators
        expect(parser.parse("1").type).toBe(RawAstNodeType.NUMBER)
        expect(parser.parse("'foo'").type).toBe(RawAstNodeType.STRING)
        expect(parser.parse("1-2").type).toBe(RawAstNodeType.MINUS_OP)
        expect(parser.parse("1+2").type).toBe(RawAstNodeType.PLUS_OP)
        expect(parser.parse("1*2").type).toBe(RawAstNodeType.TIMES_OP)
        expect(parser.parse("1/2").type).toBe(RawAstNodeType.DIV_OP)
        expect(parser.parse("1^2").type).toBe(RawAstNodeType.POW_OP)
        expect(parser.parse("-2").type).toBe(RawAstNodeType.NEGATIVE_OP)
        expect(parser.parse("+2").type).toBe(RawAstNodeType.POSITIVE_OP)
        expect(parser.parse("1&2").type).toBe(RawAstNodeType.AND_OP)

        // cell addressing
        expect(parser.parse("A5").type).toBe(RawAstNodeType.RELATIVE_CELL)
        expect(parser.parse("$A$5").type).toBe(RawAstNodeType.ABSOLUTE_CELL)
        expect(parser.parse("A$5").type).toBe(RawAstNodeType.MIXED_CELL)
        expect(parser.parse("$A5").type).toBe(RawAstNodeType.MIXED_CELL)

        // range of cells
        expect(parser.parse("A5:B5").type).toBe(RawAstNodeType.CELL_RANGE)
        expect(parser.parse("$A$5:B5").type).toBe(RawAstNodeType.CELL_RANGE)
        expect(parser.parse("A$5:B5").type).toBe(RawAstNodeType.CELL_RANGE)
        expect(parser.parse("$A5:B5").type).toBe(RawAstNodeType.CELL_RANGE)
    })

    it("function calls without arguments", () => {
        const ast = parser.parse("SUM()")

        expect(ast.type).toBe(RawAstNodeType.FUNCTION_CALL)
        expect(ast.args).toEqual(["SUM"])
    })

    it("function calls with arguments", () => {
        const ast = parser.parse("SUM(1, 2)")

        expect(ast.type).toBe(RawAstNodeType.FUNCTION_CALL)
        expect(ast.args[0]).toBe("SUM")
        expect(ast.args[1]).toEqual([
            { type: RawAstNodeType.NUMBER, args: ["1"] },
            { type: RawAstNodeType.NUMBER, args: ["2"] },
        ])
    })
});
