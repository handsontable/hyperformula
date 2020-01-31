import {Config, EmptyValue} from '../src'
import {cellValueRounding} from '../src/CellValueRounding'

describe( 'rounding', () => {
  it( 'no rounding', () =>{
    const config = new Config({ smartRounding : false})
    expect(cellValueRounding(1.000000000000001, config)).toBe(1.000000000000001)
    expect(cellValueRounding(-1.000000000000001, config)).toBe(-1.000000000000001)
    expect(cellValueRounding(0.000000000000001, config)).toBe(0.000000000000001)
    expect(cellValueRounding(-0.000000000000001, config)).toBe(-0.000000000000001)
    expect(cellValueRounding(true, config)).toBe(true)
    expect(cellValueRounding(false, config)).toBe(false)
    expect(cellValueRounding(1, config)).toBe(1)
    expect(cellValueRounding(EmptyValue, config)).toBe(EmptyValue)
    expect(cellValueRounding('abcd', config)).toBe('abcd')
  })

  it( 'with rounding', () =>{
    const config = new Config()
    expect(cellValueRounding(1.0000000000001, config)).toBe(1.0000000000001)
    expect(cellValueRounding(-1.0000000000001, config)).toBe(-1.0000000000001)
    expect(cellValueRounding(1.000000000000001, config)).toBe(1)
    expect(cellValueRounding(-1.000000000000001, config)).toBe(-1)
    expect(cellValueRounding(0.0000000000001, config)).toBe(0.0000000000001)
    expect(cellValueRounding(-0.0000000000001, config)).toBe(-0.0000000000001)
    expect(cellValueRounding(true, config)).toBe(true)
    expect(cellValueRounding(false, config)).toBe(false)
    expect(cellValueRounding(1, config)).toBe(1)
    expect(cellValueRounding(EmptyValue, config)).toBe(EmptyValue)
    expect(cellValueRounding('abcd', config)).toBe('abcd')
  })
})
