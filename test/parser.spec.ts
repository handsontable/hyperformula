import {Parser} from '../src/parser/parser'


describe('Basic parser test', () => {
    it('#parse produces simple node with correct type', () => {
        var parser = new Parser()

        // operators
        expect(parser.parse("1").type).toBe("NUMBER")
        expect(parser.parse("'foo'").type).toBe("STRING")
        expect(parser.parse("1+2").type).toBe("PLUS_OP")
        expect(parser.parse("1-2").type).toBe("MINUS_OP")
        expect(parser.parse("1*2").type).toBe("TIMES_OP")
        expect(parser.parse("1/2").type).toBe("DIV_OP")
        expect(parser.parse("1^2").type).toBe("POW_OP")
        expect(parser.parse("-2").type).toBe("NEGATIVE_OP")
        expect(parser.parse("+2").type).toBe("POSITIVE_OP")
        expect(parser.parse("1&2").type).toBe("AND_OP")

        // cell addressing
        expect(parser.parse("A5").type).toBe("RELATIVE_CELL")
        expect(parser.parse("$A$5").type).toBe("ABSOLUTE_CELL")
        expect(parser.parse("A$5").type).toBe("MIXED_CELL")
        expect(parser.parse("$A5").type).toBe("MIXED_CELL")

        // range of cells
        expect(parser.parse("A5:B5").type).toBe("CELL_RANGE")
        expect(parser.parse("$A$5:B5").type).toBe("CELL_RANGE")
        expect(parser.parse("A$5:B5").type).toBe("CELL_RANGE")
        expect(parser.parse("$A5:B5").type).toBe("CELL_RANGE")
    })

    it("function calls without arguments", () => {
        const parser = new Parser()

        const ast = parser.parse("SUM()")

        expect(ast.type).toBe("FUNCTION_CALL")
        expect(ast.args).toEqual(["SUM"])
    })

    it("function calls with arguments", () => {
        const parser = new Parser()

        const ast = parser.parse("SUM(1, 2)")

        expect(ast.type).toBe("FUNCTION_CALL")
        expect(ast.args[0]).toBe("SUM")
        expect(ast.args[1]).toEqual([
            { type: "NUMBER", args: ["1"] },
            { type: "NUMBER", args: ["2"] },
        ])
    })
});
