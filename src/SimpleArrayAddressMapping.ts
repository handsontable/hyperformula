import {CellValue, SimpleCellAddress, SimpleCellRange} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {Vertex, CellVertex, EmptyCellVertex} from './Vertex'
import {Graph} from './Graph'
import {add} from "./interpreter/scalar";

/**
 * Mapping from cell addresses to vertices
 *
 * Uses Array to store addresses, having minimal memory usage for dense sheets and constant set/lookup.
 */
export class SimpleArrayAddressMapping implements IAddressMapping {
  /**
   * Array in which actual data is stored.
   *
   * It is created when building the mapping and the size of it is fixed.
   */

  public mapping: Int32Array

  private resolvers = new Map<string, any>()

  private awaitingComputation = new Set<string>()

  public remoteCache = new Map<number, CellValue>()

  public remotePromiseCache = new Map<number, Promise<CellValue>>()
  public remoteRangePromiseCache = new Map<string, Promise<any>>()

  private bc: BroadcastChannel

  /**
   * @param width - width of the stored sheet
   * @param height - height of the stored sheet
   */
  constructor(private width: number, private height: number, private graph: Graph<Vertex>, public contextColor: number, mapping?: Int32Array) {
    this.mapping = mapping || new Int32Array(width * height)

    this.bc = new BroadcastChannel("addressMappingBus")

    this.bc.onmessage = (message) => {
      if (message.data.type === "CELL_VALUE_RESPONSE") {
        const data = message.data as CellValueResponse

        const resolver = this.resolvers.get(addressKey(data.address))

        if (resolver === undefined) {
          return
        }
        const vertexId = this.getVertexId(data.address)
        this.remoteCache.set(vertexId, data.value)

        resolver(data.value)
      }

      if (message.data.type === "CELL_VALUE_REQUEST") {
        const data = message.data as CellValueRequest

        // if (data.color !== contextColor) {
        //   return
        // }

        const vertex = this.getCell(data.address)
        if (!vertex || vertex.color != this.contextColor) {
          return
        }
        if (vertex.cellValueComputed()) {
          this.sendCellValue(data.address, vertex.getCellValue())
        } else {
          const key = addressKey(data.address)
          this.awaitingComputation.add(key)
        }
      }
    }
  }

  private sendCellValue(address: SimpleCellAddress, value: CellValue) {
    const payload: CellValueResponse = {
      type: "CELL_VALUE_RESPONSE",
      address: address,
      value: value
    }

    // console.log(this.contextColor, "sending cell value", payload)

    this.bc.postMessage(payload)
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const vertexId = this.mapping[address.row * this.width + address.col]
    if (vertexId === 0) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return this.graph.getNodeById(vertexId) as CellVertex
  }

  public getVertexId(address: SimpleCellAddress): number {
    return this.mapping[address.row * this.width + address.col]
  }

  /** @inheritDoc */
  public setCell(address: SimpleCellAddress, newVertex: CellVertex) {
    this.mapping[address.row * this.width + address.col] = newVertex.vertexId
  }

  /** @inheritDoc */
  public has(address: SimpleCellAddress): boolean {
    const vertexId = this.mapping[address.row * this.width + address.col]
    return !(vertexId === 0);
  }

  /** @inheritDoc */
  public getHeight(): number {
    return this.height
  }

  /** @inheritDoc */
  public getWidth(): number {
    return this.width
  }

  public getCellValue(address: SimpleCellAddress): CellValue {
    const vertex = this.getCell(address)

    if (vertex.color === this.contextColor) {
      return vertex.getCellValue()
    } else {
      return this.remoteCache.get(vertex.vertexId)!
    }
  }

  public getRemoteCellValueByVertex(address: SimpleCellAddress): Promise<CellValue> {
    const promise: Promise<CellValue> = new Promise(((resolve, reject) => {
      this.resolvers.set(addressKey(address), resolve)

      const payload: CellValueRequest = {
        type: "CELL_VALUE_REQUEST",
        address: address
      }

      // console.log(this.contextColor, "requesting cell value", payload)

      this.bc.postMessage(payload)
    }))
    this.remotePromiseCache.set(this.getVertexId(address), promise)

    return promise
  }

  public setCellValue(address: SimpleCellAddress, value: CellValue) {
    const vertex = (this.getCell(address)) as LazyCellVertex
    const key = addressKey(address)
    vertex.setCellValue(value)

    if (this.awaitingComputation.has(key)) {
      this.sendCellValue(address, value)
      this.awaitingComputation.delete(key)
    }
  }

  public rangeKey(range: SimpleCellRange): string {
    return `${range.start.col},${range.start.row},${range.end.col},${range.end.row}`
  }
}

function addressKey(address: SimpleCellAddress): string {
  return `${address.row},${address.col}`
}

type CellValueRequest = {
  type: "CELL_VALUE_REQUEST"
  address: SimpleCellAddress
}

type CellValueResponse = {
  type: "CELL_VALUE_RESPONSE"
  address: SimpleCellAddress
  value: CellValue
}

interface LazyCellVertex {
  setCellValue: (value: CellValue) => void
}
