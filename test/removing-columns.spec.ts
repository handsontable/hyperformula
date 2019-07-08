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

describe('Removing columns - graph', function () {
  it('should remove vertices from graph', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3', '4'],
      ['1', '2', '3', '4'],
    ])
    expect(engine.graph.nodes.size).toBe(9)
    engine.removeColumns(0, 0, 1)
    expect(engine.graph.nodes.size).toBe(5) // left two vertices in first column, two in last and empty singleton
  });

  it('works if there are empty cells removed', function () {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '', '3'],
    ])
    expect(engine.graph.nodes.size).toBe(3)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(3)
  });

  it('does not remove matrix vertices from graph', function () {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2', '3'],
      ['1', '2', '3'],
    ], config)
    expect(engine.graph.nodes.size).toBe(2)
    engine.removeColumns(0, 1, 1)
    expect(engine.graph.nodes.size).toBe(2)
  });
});
