import {AddressMapping} from '../AddressMapping'
import {RangeMapping} from '../RangeMapping'
import {SheetMapping} from '../SheetMapping'
import {SimpleCellAddress} from '../Cell'
import {CellDependency} from '../CellDependency'
import {Graph} from '../Graph'
import {Vertex} from '../Vertex'
import {Ast} from '../parser'

export class DependencyGraph {
  constructor(
    private readonly addressMapping: AddressMapping,
    private readonly rangeMapping: RangeMapping,
    private readonly graph: Graph<Vertex>,
    private readonly sheetMapping: SheetMapping,
  ) {
  }

  public setFormulaToCell(address: SimpleCellAddress, ast: Ast, dependencies: CellDependency) {
  }
}
