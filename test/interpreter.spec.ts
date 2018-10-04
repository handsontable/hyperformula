import {HandsOnEngine} from "../src";
import {argError} from '../src/Vertex';

describe('Interpreter', () => {
  let hoe: HandsOnEngine

  beforeEach(() => {
    hoe = new HandsOnEngine()
  })

  it("relative addressing formula", () => {
    hoe.loadSheet([['42', '=A1']])

    expect(hoe.getCellValue('B1')).toBe(42)
  })

  it("number literal", () => {
    hoe.loadSheet([['3']])

    expect(hoe.getCellValue('A1')).toBe(3)
  })

  it("string literals", () => {
    hoe.loadSheet([
      ['www', '1www', 'www1']
    ])

    expect(hoe.getCellValue("A1")).toBe('www')
    expect(hoe.getCellValue("B1")).toBe('1www')
    expect(hoe.getCellValue("C1")).toBe('www1')
  })

  it("plus operator", () => {
    hoe.loadSheet([['3', '7', '=A1+B1']])

    expect(hoe.getCellValue('C1')).toBe(10)
  })

  it("plus operator", () => {
    hoe.loadSheet([['3', '=A1+42']])

    expect(hoe.getCellValue('B1')).toBe(45)
  })

  it("plus operator - ARG error on 1st operand", () => {
    hoe.loadSheet([['www', '=A1+42']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })

  it("plus operator - ARG error on 2nd operand", () => {
    hoe.loadSheet([['www', '=42+A1']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })

  it("minus operator", () => {
    hoe.loadSheet([['3', '=A1-43']])

    expect(hoe.getCellValue('B1')).toBe(-40)
  })

  it("minus operator - ARG error on 1st operand", () => {
    hoe.loadSheet([['www', '=A1-42']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })

  it("minus operator - ARG error on 2nd operand", () => {
    hoe.loadSheet([['www', '=42-A1']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })

  it("times operator", () => {
    hoe.loadSheet([['3', '=A1*6']])

    expect(hoe.getCellValue('B1')).toBe(18)
  })

  it("times operator - ARG error on 1st operand", () => {
    hoe.loadSheet([['www', '=A1*42']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })

  it("times operator - ARG error on 2nd operand", () => {
    hoe.loadSheet([['www', '=42*A1']])

    expect(hoe.getCellValue('B1')).toEqual(argError())
  })
});
