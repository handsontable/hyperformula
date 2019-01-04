import {cellError, CellValue, ErrorType, getAbsoluteAddress, isCellError, SimpleCellAddress} from '../../Cell'
import {generateCellsFromRangeGenerator} from '../../GraphBuilder'
import {AstNodeType, ProcedureAst} from '../../parser/Ast'
import {FunctionPlugin} from './FunctionPlugin'

export class MedianPlugin extends FunctionPlugin {

  public static implementedFunctions = {
    median: {
      EN: 'MEDIAN',
      PL: 'MEDIANA',
    },
  }

  public median(ast: ProcedureAst, formulaAddress: SimpleCellAddress): CellValue {
    if (ast.args.length === 0) {
      return cellError(ErrorType.NA)
    }

    const values: number[] = []
    for (const astArg of ast.args) {
      if (astArg.type === AstNodeType.CELL_RANGE) {
        const [beginRange, endRange] = [getAbsoluteAddress(astArg.start, formulaAddress), getAbsoluteAddress(astArg.end, formulaAddress)]
        for (const cellFromRange of generateCellsFromRangeGenerator(beginRange, endRange)) {
          const value = this.addressMapping.getCell(cellFromRange)!.getCellValue()
          if (typeof value === 'number') {
            values.push(value)
          } else if (isCellError(value)) {
            return value
          } else {
            return cellError(ErrorType.NA)
          }
        }
      } else {
        const value = this.evaluateAst(astArg, formulaAddress)
        if (typeof value === 'number') {
          values.push(value)
        } else if (isCellError(value)) {
          return value
        } else {
          return cellError(ErrorType.NA)
        }
      }
    }

    values.sort((a, b) => (a - b))

    if (values.length % 2 === 0) {
      return (values[(values.length / 2) - 1] + values[values.length / 2]) / 2
    } else {
      return values[Math.floor(values.length / 2)]
    }
  }
}
