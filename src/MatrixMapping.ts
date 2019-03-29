import {SimpleCellAddress} from "./Cell";
import {Matrix} from "./Vertex";

export class MatrixMapping {
    private matrixMapping: Map<SimpleCellAddress, Matrix> = new Map()

    getMatrix(matrixAddresss: SimpleCellAddress): Matrix {
        return this.matrixMapping.get(matrixAddresss)!;
    }

    setMatrix(matrixAddress: SimpleCellAddress, matrix: Matrix) {
        this.matrixMapping.set(matrixAddress, matrix)
    }
}
