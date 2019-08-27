import {ColumnsSpan} from '../src/ColumnsSpan'

describe("ColumnsSpan", () => {
  it("raise error when starting column is less than 0", () => {
    expect(() => {
      const span = new ColumnsSpan(0, -1, 0)
    }).toThrow("Starting column cant be less than 0")
  })

  it("raise error when column end before column start", () => {
    expect(() => {
      const span = new ColumnsSpan(0, 1, 0)
    }).toThrow("Column span cant end before start")
  })

  it("#fromNumberOfColumns", () => {
    const span = ColumnsSpan.fromNumberOfColumns(0, 42, 2)

    expect(span).toEqual(new ColumnsSpan(0, 42, 43))
  })

  it("#numberOfColumns for one column", () => {
    const span = new ColumnsSpan(0, 42, 42)

    expect(span.numberOfColumns).toBe(1)
  })

  it("#numberOfColumns for more than one column", () => {
    const span = new ColumnsSpan(0, 42, 45)

    expect(span.numberOfColumns).toBe(4)
  })

  it("#columns iterates over column numbers", () => {
    const span = new ColumnsSpan(0, 42, 45)

    expect(Array.from(span.columns())).toEqual([42, 43, 44, 45])
  })

  it("#intersect with span from other sheet", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(1, 43, 45)

    expect(() => {
      span1.intersect(span2)
    }).toThrow("Can't intersect spans from different sheets")
  })

  it("#intersect with span overlapping at right", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 43, 46)

    expect(span1.intersect(span2)).toEqual(new ColumnsSpan(0, 43, 45))
  })

  it("#intersect with span whole after", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 46, 49)

    expect(span1.intersect(span2)).toEqual(null)
  })

  it("#intersect with span overlapping at left", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 40, 44)

    expect(span1.intersect(span2)).toEqual(new ColumnsSpan(0, 42, 44))
  })

  it("#intersect with span whole before", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 39, 41)

    expect(span1.intersect(span2)).toEqual(null)
  })

  it("#intersect with span included", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 43, 44)

    expect(span1.intersect(span2)).toEqual(span2)
  })

  it("#intersect with span outside", () => {
    const span1 = new ColumnsSpan(0, 42, 45)
    const span2 = new ColumnsSpan(0, 40, 47)

    expect(span1.intersect(span2)).toEqual(span1)
  })

  it("#firstColumn when one column", () => {
    const span1 = new ColumnsSpan(0, 42, 42)

    expect(span1.firstColumn()).toEqual(span1)
  })

  it("#firstColumn when more columns", () => {
    const span1 = new ColumnsSpan(0, 42, 44)

    expect(span1.firstColumn()).toEqual(new ColumnsSpan(0, 42, 42))
  })
})
