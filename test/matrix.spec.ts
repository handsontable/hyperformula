import {HandsOnEngine} from "../src";
import {Config} from "../src/Config";
import {MatrixPlugin} from "../src/interpreter/plugin/MatrixPlugin";

describe('Matrix', () => {
  it('matrix', () => {
    const config = new Config({ functionPlugins: [MatrixPlugin] })
    const engine = HandsOnEngine.buildFromArray([
        ['1','2'],
        ['3','4'],
        ['5','6'],
        ['1','2','3'],
        ['4','5','6'],
        ['=mmult(A1:B3,A4:C5)']
    ], config)

    expect(engine.getCellValue("A6")).toBeCloseTo(9)
    expect(engine.getCellValue("B6")).toBeCloseTo(12)
    expect(engine.getCellValue("C6")).toBeCloseTo(15)
    expect(engine.getCellValue("A7")).toBeCloseTo(19)
    expect(engine.getCellValue("B7")).toBeCloseTo(26)
    expect(engine.getCellValue("C7")).toBeCloseTo(33)
    expect(engine.getCellValue("A8")).toBeCloseTo(29)
    expect(engine.getCellValue("B8")).toBeCloseTo(40)
    expect(engine.getCellValue("C8")).toBeCloseTo(51)
  })
})
