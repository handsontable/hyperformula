import {HandsOnEngine} from "../../src";

describe('Interpreter - concatenate operator', () => {
  it('Ampersand with string arguments', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['="foo"&"bar"'],
    ])

    expect(engine.getCellValue('A1')).toBe("foobar")
  })
})