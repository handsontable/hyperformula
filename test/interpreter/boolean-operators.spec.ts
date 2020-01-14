import {HyperFormula} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'
import {adr} from '../testUtils'

describe('Interpreter - Boolean operators', () => {
  it('Equals operator - numbers',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1=2', '=1=1', '=1+2=3'],
      ['="abc"="abc"', '="foo"="bar"', '="a"="foo"'],
      ['=TRUE()=TRUE()', '=FALSE()=FALSE()', '=TRUE()=FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('Equals operator - strings',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="abc"="abc"', '="foo"="bar"', '="a"="foo"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })

  it('Equals operator - booleans',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TRUE()=TRUE()', '=FALSE()=FALSE()', '=TRUE()=FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })

  it('Equal operator with different types',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="foo"=1', '="foo"=TRUE()', '=1="foo"', '=TRUE()="foo"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
    expect(engine.getCellValue(adr('D1'))).toBe(false)
  })

  it('Equals operator with error',  () => {
    const engine =  HyperFormula.buildFromArray([
        ['=1/0', '=A1=2', '=2=A1'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('Not equals operator - numbers',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1<>2', '=1<>1', '=1+2<>3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })

  it('Not equals operator - strings',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="abc"<>"abc"', '="foo"<>"bar"', '="a"<>"foo"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('Not equals operator - booleans',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=TRUE()<>TRUE()', '=FALSE()<>FALSE()', '=TRUE()<>FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
  })

  it('Not equals operator with error',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1/0', '=A1<>2', '=2<>A1'],
    ])

    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('Not Equal operator with different types',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['="foo"<>1', '="foo"<>TRUE()', '=1<>"foo"', '=TRUE()<>"foo"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
  })

  it('Less than operator with number arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
        ['=1<2', '=2<2', '=-3<4', '=-4<-3'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
  })

  it('Less than operator with wrong arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
        ['=1<"foo"', '="foo"<"bar"', '=TRUE()<"bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Less than operator with coercions', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=FALSE()<"2"', '="1"<"2"', '=TRUE()<FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })

  it('Greater than operator with number arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=2>1', '=2>2', '=4>-3', '=-3>-4'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
  })

  it('Greater than operator with wrong arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1>"foo"', '="foo">"bar"', '=TRUE()>"bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Greater than operator with coercions', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=FALSE()>"2"', '="1">"2"', '=TRUE()>FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(false)
    expect(engine.getCellValue(adr('B1'))).toBe(false)
    expect(engine.getCellValue(adr('C1'))).toBe( true)
  })

  it('Less than or equal operator with number arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1<=2', '=2<=2', '=-3<=4', '=-4<=-3', '=5<=4'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
    expect(engine.getCellValue(adr('E1'))).toBe(false)
  })

  it('Less than or equal operator with coercions', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=FALSE()<="2"', '="1"<="2"', '=TRUE()<=FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })

  it('Less than or equal operator with wrong arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1<="foo"', '="foo"<="bar"', '=TRUE()<="bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Greater than or equal operator with number arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=2>=1', '=2>=2', '=4>=-3', '=-3>=-4', '=4>=5'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(true)
    expect(engine.getCellValue(adr('D1'))).toBe(true)
    expect(engine.getCellValue(adr('E1'))).toBe(false)
  })

  it('Greater than or equal operator with wrong arguments',  () => {
    const engine =  HyperFormula.buildFromArray([
      ['=1>="foo"', '="foo">="bar"', '=TRUE()>="bar"'],
    ])

    expect(engine.getCellValue(adr('A1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('B1'))).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue(adr('C1'))).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Greater than or equal operator with coercions', () => {
    const engine =  HyperFormula.buildFromArray([
      ['=FALSE()<="2"', '="1"<="2"', '=TRUE()<=FALSE()'],
    ])

    expect(engine.getCellValue(adr('A1'))).toBe(true)
    expect(engine.getCellValue(adr('B1'))).toBe(true)
    expect(engine.getCellValue(adr('C1'))).toBe(false)
  })
})

