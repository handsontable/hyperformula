import {RowsSpan} from '../src/RowsSpan'

describe('RowsSpan', () => {
  it('raise error when starting row is less than 0', () => {
    expect(() => {
      const span = new RowsSpan(0, -1, 0)
    }).toThrow('Starting row cant be less than 0')
  })

  it('raise error when row end before row start', () => {
    expect(() => {
      const span = new RowsSpan(0, 1, 0)
    }).toThrow('Row span cant end before start')
  })

  it('#fromNumberOfRows', () => {
    const span = RowsSpan.fromNumberOfRows(0, 42, 2)

    expect(span).toEqual(new RowsSpan(0, 42, 43))
  })

  it('#numberOfRows for one row', () => {
    const span = new RowsSpan(0, 42, 42)

    expect(span.numberOfRows).toBe(1)
  })

  it('#numberOfRows for more than one row', () => {
    const span = new RowsSpan(0, 42, 45)

    expect(span.numberOfRows).toBe(4)
  })

  it('#rows iterates over row numbers', () => {
    const span = new RowsSpan(0, 42, 45)

    expect(Array.from(span.rows())).toEqual([42, 43, 44, 45])
  })

  it('#intersect with span from other sheet', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(1, 43, 45)

    expect(() => {
      span1.intersect(span2)
    }).toThrow("Can't intersect spans from different sheets")
  })

  it('#intersect with span overlapping at right', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 43, 46)

    expect(span1.intersect(span2)).toEqual(new RowsSpan(0, 43, 45))
  })

  it('#intersect with span whole after', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 46, 49)

    expect(span1.intersect(span2)).toEqual(null)
  })

  it('#intersect with span overlapping at left', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 40, 44)

    expect(span1.intersect(span2)).toEqual(new RowsSpan(0, 42, 44))
  })

  it('#intersect with span whole before', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 39, 41)

    expect(span1.intersect(span2)).toEqual(null)
  })

  it('#intersect with span included', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 43, 44)

    expect(span1.intersect(span2)).toEqual(span2)
  })

  it('#intersect with span outside', () => {
    const span1 = new RowsSpan(0, 42, 45)
    const span2 = new RowsSpan(0, 40, 47)

    expect(span1.intersect(span2)).toEqual(span1)
  })

  it('#firstRow when one row', () => {
    const span1 = new RowsSpan(0, 42, 42)

    expect(span1.firstRow()).toEqual(span1)
  })

  it('#firstRow when more rows', () => {
    const span1 = new RowsSpan(0, 42, 44)

    expect(span1.firstRow()).toEqual(new RowsSpan(0, 42, 42))
  })
})
