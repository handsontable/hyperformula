import {HandsOnEngine} from "../src";
import {cellError, ErrorType} from "../src/Vertex";

describe('Interpreter', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it.only("relative addressing formula", () => {
    engine.loadSheet([['42', '=A1']])

    expect(engine.getCellValue('B1')).toBe(42)
  })

  it("number literal", () => {
    engine.loadSheet([['3']])

    expect(engine.getCellValue('A1')).toBe(3)
  })

  it("string literals", () => {
    engine.loadSheet([
      ['www', '1www', 'www1']
    ])

    expect(engine.getCellValue("A1")).toBe('www')
    expect(engine.getCellValue("B1")).toBe('1www')
    expect(engine.getCellValue("C1")).toBe('www1')
  })

  it("string literals in formula", () => {
    engine.loadSheet([
      ["='www'", "='1www'", "='www1'"]
    ])

    expect(engine.getCellValue("A1")).toBe('www')
    expect(engine.getCellValue("B1")).toBe('1www')
    expect(engine.getCellValue("C1")).toBe('www1')
  })

  it("plus operator", () => {
    engine.loadSheet([['3', '7', '=A1+B1']])

    expect(engine.getCellValue('C1')).toBe(10)
  })

  it("plus operator", () => {
    engine.loadSheet([['3', '=A1+42']])

    expect(engine.getCellValue('B1')).toBe(45)
  })

  it("plus operator - int + float", () => {
    engine.loadSheet([['2.0', '=A1 + 3.14']])

    expect(engine.getCellValue('B1')).toBeCloseTo(5.14)
  })

  it("plus operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1+42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("plus operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42+A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("minus operator", () => {
    engine.loadSheet([['3', '=A1-43']])

    expect(engine.getCellValue('B1')).toBe(-40)
  })

  it("minus operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1-42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("minus operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42-A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("times operator", () => {
    engine.loadSheet([['3', '=A1*6']])

    expect(engine.getCellValue('B1')).toBe(18)
  })

  it("times operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1*42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("times operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42*A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("div operator - int result", () => {
    engine.loadSheet([['=10 / 2']])

    expect(engine.getCellValue("A1")).toEqual(5)
  })

  it("div operator - float result", () => {
    engine.loadSheet([['=5 / 2']])

    expect(engine.getCellValue("A1")).toEqual(2.5)
  })

  it("div operator - float arg and result", () => {
    engine.loadSheet([['=12 / 2.5']])

    expect(engine.getCellValue("A1")).toEqual(4.8)
  })

  it("div operator - DIV_ZERO error", () => {
    engine.loadSheet([['=42 / 0']])

    expect(engine.getCellValue("A1")).toEqual(cellError(ErrorType.DIV_BY_ZERO))
  })

  it("div operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1 / 42']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("div operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42 / A1']])

    expect(engine.getCellValue('B1')).toEqual(cellError(ErrorType.ARG))
  })

  it("procedures - SUM without args", () => {
    engine.loadSheet([['=SUM()']])

    expect(engine.getCellValue("A1")).toEqual(0)
  })

  it("procedures - SUM with args", () => {
    engine.loadSheet([['=SUM(1; B1)', '3.14']])

    expect(engine.getCellValue("A1")).toBeCloseTo(4.14)
  })

  it("procedures - SUM with range args", () => {
    engine.loadSheet([['1', '2', '5'],
                      ['3', '4', '=SUM(A1:B2)']])

    expect(engine.getCellValue("C2")).toBeCloseTo(10)
  })

  it("procedures - SUM with bad args", () => {
    engine.loadSheet([['=SUM(B1)', 'asdf']])

    expect(engine.getCellValue("A1")).toEqual(cellError(ErrorType.ARG))
  })

  it("procedures - not known procedure", () => {
    engine.loadSheet([['=FOO()']])

    expect(engine.getCellValue("A1")).toEqual(cellError(ErrorType.NAME))
  })

  it("errors - parsing errors", () => {
    engine.loadSheet([['=A', '=A1C1', '=SUM(A)']])

    expect(engine.getCellValue("A1")).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue("B1")).toEqual(cellError(ErrorType.NAME))
    expect(engine.getCellValue("C1")).toEqual(cellError(ErrorType.NAME))
  })
});
