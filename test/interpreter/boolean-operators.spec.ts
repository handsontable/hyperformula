import {HandsOnEngine} from '../../src'
import {CellError, ErrorType} from '../../src/Cell'
import '../testConfig'

describe('Interpreter - Boolean operators', () => {
  it('Equals operator - numbers', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1=2', '=1=1', '=1+2=3'],
      ['="abc"="abc"', '="foo"="bar"', '="a"="foo"'],
      ['=TRUE()=TRUE()', '=FALSE()=FALSE()', '=TRUE()=FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toBe(false)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('Equals operator - strings', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="abc"="abc"', '="foo"="bar"', '="a"="foo"'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(false)
  })

  it('Equals operator - booleans', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=TRUE()=TRUE()', '=FALSE()=FALSE()', '=TRUE()=FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(false)
  })

  it('Equal operator with different types', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="foo"=1', '="foo"=TRUE()', '=1="foo"', '=TRUE()="foo"'],
    ])

    expect(engine.getCellValue('A1')).toBe(false)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(false)
    expect(engine.getCellValue('D1')).toBe(false)
  })

  it('Equals operator with error', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=1/0', '=A1=2', '=2=A1'],
    ])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('Not equals operator - numbers', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1<>2', '=1<>1', '=1+2<>3'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(false)
  })

  it('Not equals operator - strings', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="abc"<>"abc"', '="foo"<>"bar"', '="a"<>"foo"'],
    ])

    expect(engine.getCellValue('A1')).toBe(false)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('Not equals operator - booleans', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=TRUE()<>TRUE()', '=FALSE()<>FALSE()', '=TRUE()<>FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toBe(false)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
  })

  it('Not equals operator with error', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1/0', '=A1<>2', '=2<>A1'],
    ])

    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.DIV_BY_ZERO))
  })

  it('Not Equal operator with different types', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['="foo"<>1', '="foo"<>TRUE()', '=1<>"foo"', '=TRUE()<>"foo"'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
  })

  it('Less than operator with number arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=1<2', '=2<2', '=-3<4', '=-4<-3'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
  })

  it('Less than operator with wrong arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
        ['=1<"foo"', '="foo"<"bar"', '=TRUE()<FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Greater than operator with number arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=2>1', '=2>2', '=4>-3', '=-3>-4'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(false)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
  })

  it('Greater than operator with wrong arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1>"foo"', '="foo">"bar"', '=TRUE()>FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Less than or equal operator with number arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1<=2', '=2<=2', '=-3<=4', '=-4<=-3', '=5<=4'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
    expect(engine.getCellValue('E1')).toBe(false)
  })

  it('Less than or equal operator with wrong arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1<="foo"', '="foo"<="bar"', '=TRUE()<=FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })

  it('Greater than or equal operator with number arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=2>=1', '=2>=2', '=4>=-3', '=-3>=-4', '=4>=5'],
    ])

    expect(engine.getCellValue('A1')).toBe(true)
    expect(engine.getCellValue('B1')).toBe(true)
    expect(engine.getCellValue('C1')).toBe(true)
    expect(engine.getCellValue('D1')).toBe(true)
    expect(engine.getCellValue('E1')).toBe(false)
  })

  it('Greater than or equal operator with wrong arguments', async () => {
    const engine = await HandsOnEngine.buildFromArray([
      ['=1>="foo"', '="foo">="bar"', '=TRUE()>=FALSE()'],
    ])

    expect(engine.getCellValue('A1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('B1')).toEqual(new CellError(ErrorType.VALUE))
    expect(engine.getCellValue('C1')).toEqual(new CellError(ErrorType.VALUE))
  })
})
