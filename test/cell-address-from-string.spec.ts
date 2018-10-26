import {cellAddressFromString} from "../src/parser/ParserWithCaching"

describe("cellAddressFromString", () => {
  it("is zero based", () => {
    expect(cellAddressFromString("A1")).toEqual({ col: 0, row: 0 })
  })

  it("works for bigger rows", () => {
    expect(cellAddressFromString("A123")).toEqual({ col: 0, row: 122 })
  })

  it("one letter", () => {
    expect(cellAddressFromString("Z1")).toEqual({ col: 25, row: 0 })
  })

  it("last letter is Z", () => {
    expect(cellAddressFromString("AA1")).toEqual({ col: 26, row: 0 })
  })

  it("works for many letters", () => {
    expect(cellAddressFromString("ABC1")).toEqual({ col: 730, row: 0 })
  })
})
