import {HyperFormula} from '../src'
import {ErrorType} from '../src/Cell'
import {DetailedCellError} from '../src/CellValue'
import {adr} from './testUtils'

describe('TEXTJOIN', () => {
  // Helper to build a single-sheet engine and return cell value
  const evaluate = (data: any[][]) => {
    const hf = HyperFormula.buildFromArray(data, {licenseKey: 'gpl-v3'})
    return {hf, val: (ref: string) => hf.getCellValue(adr(ref))}
  }

  afterEach(() => {
    // HyperFormula instances are destroyed in each test
  })

  describe('basic functionality', () => {
    it('should join literal strings with a scalar delimiter', () => {
      const {hf, val} = evaluate([['=TEXTJOIN(", ", TRUE(), "Hello", "World")']])
      expect(val('A1')).toBe('Hello, World')
      hf.destroy()
    })

    it('should join a range of cells', () => {
      const {hf, val} = evaluate([['a', 'b', 'c', '=TEXTJOIN("-", TRUE(), A1:C1)']])
      expect(val('D1')).toBe('a-b-c')
      hf.destroy()
    })

    it('should concatenate when delimiter is empty string', () => {
      const {hf, val} = evaluate([['x', 'y', 'z', '=TEXTJOIN("", TRUE(), A1:C1)']])
      expect(val('D1')).toBe('xyz')
      hf.destroy()
    })

    it('should handle multi-character delimiter', () => {
      const {hf, val} = evaluate([['a', 'b', 'c', '=TEXTJOIN(", ", TRUE(), A1:C1)']])
      expect(val('D1')).toBe('a, b, c')
      hf.destroy()
    })

    it('should return single text value without delimiter', () => {
      const {hf, val} = evaluate([['=TEXTJOIN(",", TRUE(), "only")']])
      expect(val('A1')).toBe('only')
      hf.destroy()
    })

    it('should join mixed scalar and range arguments', () => {
      const {hf, val} = evaluate([
        ['a', 'b', 'c'],
        ['=TEXTJOIN("-", TRUE(), "start", A1:C1, "end")'],
      ])
      expect(val('A2')).toBe('start-a-b-c-end')
      hf.destroy()
    })
  })

  describe('ignore_empty behavior', () => {
    it('should skip truly empty cells when ignore_empty=TRUE', () => {
      const {hf, val} = evaluate([
        ['hello', null, 'world', '=TEXTJOIN(",", TRUE(), A1:C1)'],
      ])
      expect(val('D1')).toBe('hello,world')
      hf.destroy()
    })

    it('should include truly empty cells when ignore_empty=FALSE', () => {
      const {hf, val} = evaluate([
        ['hello', null, 'world', '=TEXTJOIN(",", FALSE(), A1:C1)'],
      ])
      expect(val('D1')).toBe('hello,,world')
      hf.destroy()
    })

    it('should skip cells containing ="" when ignore_empty=TRUE', () => {
      const {hf, val} = evaluate([
        ['hello', '=""', 'world', '=TEXTJOIN(",", TRUE(), A1:C1)'],
      ])
      expect(val('D1')).toBe('hello,world')
      hf.destroy()
    })

    it('should include cells containing ="" when ignore_empty=FALSE', () => {
      const {hf, val} = evaluate([
        ['hello', '=""', 'world', '=TEXTJOIN(",", FALSE(), A1:C1)'],
      ])
      expect(val('D1')).toBe('hello,,world')
      hf.destroy()
    })

    it('should return empty string for all-empty range with ignore_empty=TRUE', () => {
      const {hf, val} = evaluate([
        [null, null, null, '=TEXTJOIN(",", TRUE(), A1:C1)'],
      ])
      expect(val('D1')).toBe('')
      hf.destroy()
    })

    it('should return delimiters for all-empty range with ignore_empty=FALSE', () => {
      const {hf, val} = evaluate([
        [null, null, null, '=TEXTJOIN(",", FALSE(), A1:C1)'],
      ])
      expect(val('D1')).toBe(',,')
      hf.destroy()
    })
  })

  describe('array/range delimiter', () => {
    it('should cycle through range delimiters with 3 text values', () => {
      const {hf, val} = evaluate([
        ['-', '/', '=TEXTJOIN(A1:B1, TRUE(), "a", "b", "c")'],
      ])
      expect(val('C1')).toBe('a-b/c')
      hf.destroy()
    })

    it('should cycle through range delimiters with 4 text values', () => {
      const {hf, val} = evaluate([
        ['-', '/', '=TEXTJOIN(A1:B1, TRUE(), "a", "b", "c", "d")'],
      ])
      expect(val('C1')).toBe('a-b/c-d')
      hf.destroy()
    })

    it('should use only first delimiter when there are 2 text values', () => {
      const {hf, val} = evaluate([
        ['-', '/', '=TEXTJOIN(A1:B1, TRUE(), "p", "q")'],
      ])
      expect(val('C1')).toBe('p-q')
      hf.destroy()
    })

    it('should handle single-cell range as delimiter (no cycling)', () => {
      const {hf, val} = evaluate([
        ['-', '=TEXTJOIN(A1:A1, TRUE(), "x", "y", "z")'],
      ])
      expect(val('B1')).toBe('x-y-z')
      hf.destroy()
    })

    it('should cycle delimiters with text range argument', () => {
      const {hf, val} = evaluate([
        ['-', '/'],
        ['a', 'b', 'c', 'd', 'e'],
        ['=TEXTJOIN(A1:B1, TRUE(), A2:E2)'],
      ])
      expect(val('A3')).toBe('a-b/c-d/e')
      hf.destroy()
    })

    it('should handle vertical range as delimiter', () => {
      const data = [
        ['-', 'a', 'b', 'c'],
        ['/', '', '', '=TEXTJOIN(A1:A2, TRUE(), B1:D1)'],
      ]
      const {hf, val} = evaluate(data)
      expect(val('D2')).toBe('a-b/c')
      hf.destroy()
    })
  })

  describe('type coercion', () => {
    it('should coerce number to string in delimiter position', () => {
      const {hf, val} = evaluate([['=TEXTJOIN(1, TRUE(), "a", "b")']])
      expect(val('A1')).toBe('a1b')
      hf.destroy()
    })

    it('should coerce cell reference to number as delimiter', () => {
      const {hf, val} = evaluate([
        [42, '=TEXTJOIN(A1, TRUE(), "x", "y")'],
      ])
      expect(val('B1')).toBe('x42y')
      hf.destroy()
    })

    it('should coerce number in text position to string', () => {
      const {hf, val} = evaluate([
        [42, 'hello', '=TEXTJOIN(",", TRUE(), A1, B1)'],
      ])
      expect(val('C1')).toBe('42,hello')
      hf.destroy()
    })

    it('should coerce boolean values in text position to strings', () => {
      const {hf, val} = evaluate([
        ['=TEXTJOIN(",", TRUE(), TRUE(), FALSE(), "text")'],
      ])
      expect(val('A1')).toBe('TRUE,FALSE,text')
      hf.destroy()
    })
  })

  describe('error propagation', () => {
    it('should propagate error from text range', () => {
      const {hf, val} = evaluate([
        ['hello', '=1/0', 'world', '=TEXTJOIN(",", TRUE(), A1:C1)'],
      ])
      const result = val('D1')
      expect(result).toBeInstanceOf(DetailedCellError)
      expect((result as DetailedCellError).type).toBe(ErrorType.DIV_BY_ZERO)
      hf.destroy()
    })

    it('should propagate error from delimiter range', () => {
      const {hf, val} = evaluate([
        ['=1/0', '/', '=TEXTJOIN(A1:B1, TRUE(), "a", "b", "c")'],
      ])
      const result = val('C1')
      expect(result).toBeInstanceOf(DetailedCellError)
      expect((result as DetailedCellError).type).toBe(ErrorType.DIV_BY_ZERO)
      hf.destroy()
    })

    it('should propagate #N/A from a text argument', () => {
      const {hf, val} = evaluate([
        ['hello', '=NA()', 'world', '=TEXTJOIN(",", TRUE(), A1:C1)'],
      ])
      const result = val('D1')
      expect(result).toBeInstanceOf(DetailedCellError)
      expect((result as DetailedCellError).type).toBe(ErrorType.NA)
      hf.destroy()
    })
  })

  describe('edge cases', () => {
    it('should handle range with numbers and empty cells with ignore_empty=TRUE', () => {
      const {hf, val} = evaluate([
        ['hello', null, 'world', 42, '=""', '=TEXTJOIN(",", TRUE(), A1:E1)'],
      ])
      expect(val('F1')).toBe('hello,world,42')
      hf.destroy()
    })

    it('should return #VALUE! when result exceeds 32767 characters', () => {
      // Create a string that will exceed the limit when joined
      const longText = 'x'.repeat(16384)
      const {hf, val} = evaluate([
        [longText, longText, '=TEXTJOIN("-", TRUE(), A1, B1)'],
      ])
      const result = val('C1')
      expect(result).toBeInstanceOf(DetailedCellError)
      expect((result as DetailedCellError).type).toBe(ErrorType.VALUE)
      hf.destroy()
    })

    it('should allow result exactly at 32767 characters', () => {
      // 32767 total: two strings of 16383 chars + 1-char delimiter
      const text = 'a'.repeat(16383)
      const {hf, val} = evaluate([
        [text, text, '=TEXTJOIN("-", TRUE(), A1, B1)'],
      ])
      const result = val('C1') as string
      expect(typeof result).toBe('string')
      expect(result.length).toBe(32767)
      hf.destroy()
    })

    it('should handle multiple range arguments', () => {
      const {hf, val} = evaluate([
        ['a', 'b'],
        ['c', 'd'],
        ['=TEXTJOIN(",", TRUE(), A1:B1, A2:B2)'],
      ])
      expect(val('A3')).toBe('a,b,c,d')
      hf.destroy()
    })
  })
})
