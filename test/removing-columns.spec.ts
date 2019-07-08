import {Config, HandsOnEngine} from "../src";

describe('Removing columns - matrices', () => {
  it('should not remove column within formula matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '{=MMULT(A1:B2, A1:B2)}'],
      ['3', '4'],
    ])

    expect(() => engine.removeColumns(0, 2, 2)).toThrowError("It is not possible to remove column within matrix")
  })
});
