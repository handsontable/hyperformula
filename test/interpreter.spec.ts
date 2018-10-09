import {HandsOnEngine} from "../src";
import {argError} from '../src/Vertex';

describe('Interpreter', () => {
  let engine: HandsOnEngine

  beforeEach(() => {
    engine = new HandsOnEngine()
  })

  it("relative addressing formula", () => {
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

  it("plus operator", () => {
    engine.loadSheet([['3', '7', '=A1+B1']])

    expect(engine.getCellValue('C1')).toBe(10)
  })

  it("plus operator", () => {
    engine.loadSheet([['3', '=A1+42']])

    expect(engine.getCellValue('B1')).toBe(45)
  })

  it("plus operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1+42']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })

  it("plus operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42+A1']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })

  it("minus operator", () => {
    engine.loadSheet([['3', '=A1-43']])

    expect(engine.getCellValue('B1')).toBe(-40)
  })

  it("minus operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1-42']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })

  it("minus operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42-A1']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })

  it("times operator", () => {
    engine.loadSheet([['3', '=A1*6']])

    expect(engine.getCellValue('B1')).toBe(18)
  })

  it("times operator - ARG error on 1st operand", () => {
    engine.loadSheet([['www', '=A1*42']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })

  it("times operator - ARG error on 2nd operand", () => {
    engine.loadSheet([['www', '=42*A1']])

    expect(engine.getCellValue('B1')).toEqual(argError())
  })
});
