import {Config, HandsOnEngine} from "../src";
import {simpleCellAddress} from "../src/Cell";
import {MatrixVertex, ValueCellVertex} from "../src/Vertex";

describe("Disable matrix optimizatoins", () => {
  it("should split matrix into singluar value cell vertices", () => {
    const config = new Config({ matrixDetection: true, matrixDetectionThreshold: 1})
    const sheet = [
        ['1','2'],
        ['3','4'],
    ]

    const engine = HandsOnEngine.buildFromArray(sheet, config)

    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))).toBeInstanceOf(MatrixVertex)

    engine.disableMatrixOptimizations()

    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 0))).toBeInstanceOf(ValueCellVertex)
    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 0))).toBeInstanceOf(ValueCellVertex)
    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 0, 1))).toBeInstanceOf(ValueCellVertex)
    expect(engine.addressMapping!.fetchCell(simpleCellAddress(0, 1, 1))).toBeInstanceOf(ValueCellVertex)
    expect(engine.getCellValue("A1")).toBe(1)
    expect(engine.getCellValue("B2")).toBe(4)
  })
})
