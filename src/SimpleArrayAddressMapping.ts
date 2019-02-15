import {CellValue, SimpleCellAddress} from './Cell'
import {IAddressMapping} from './IAddressMapping'
import {Vertex, CellVertex, EmptyCellVertex} from './Vertex'
import {Graph} from './Graph'

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

  private bc: BroadcastChannel

  /**
   * @param width - width of the stored sheet
   * @param height - height of the stored sheet
   */
  constructor(private width: number, private height: number, private graph: Graph<Vertex>, private contextColor: number, mapping?: Int32Array) {
    this.mapping = mapping || new Int32Array(width * height)

    this.bc = new BroadcastChannel("addressMappingBus")

    this.bc.onmessage = (message) => {
      if (message.data.type === "CELL_VALUE_RESPONSE") {
        const data = message.data as CellValueResponse
        const resolverKey = `${data.address.row},${data.address.col}`

        const resolver = this.resolvers.get(resolverKey)

        if (resolver !== null) {
          resolver(data.value)
        }
      }

      if (message.data.type === "CELL_VALUE_REQUEST") {
        const data = message.data as CellValueRequest

        if (data.color !== contextColor) {
          return
        }

        const payload: CellValueResponse = {
          type: "CELL_VALUE_RESPONSE",
          address: data.address,
          value: 0 // we don't know if value for this cell is already computed
        }

        this.bc.postMessage(payload)
      }
    }
  }

  /** @inheritDoc */
  public getCell(address: SimpleCellAddress): CellVertex {
    const vertexId = this.mapping[address.row * this.width + address.col]
    if (vertexId === 0) {
      return EmptyCellVertex.getSingletonInstance()
    }
    return this.graph.getNodeById(vertexId) as CellVertex
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

  public getCellValue(address: SimpleCellAddress): Promise<CellValue> {
    const vertex = this.getCell(address)

    if (vertex.color === this.contextColor) {
      return Promise.resolve(vertex.getCellValue())
    }

    const promise: Promise<CellValue> = new Promise(((resolve, reject) => {
      this.resolvers.set(`${address.row},${address.col}`, resolve)

      this.bc.postMessage({
        color: vertex.color,
        address: address
      })
    }))


    return promise
  }

}

type CellValueRequest = {
  type: "CELL_VALUE_REQUEST"
  color: number
  address: SimpleCellAddress
}

type CellValueResponse = {
  type: "CELL_VALUE_RESPONSE"
  address: SimpleCellAddress
  value: CellValue
}
