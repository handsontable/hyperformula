import {CellValue, isCellError} from '../Cell'

export function concatenate(args: CellValue[]): CellValue {
  return args.reduce((acc: CellValue, arg: CellValue) => {
    if (isCellError(acc)) {
      return acc
    } else if (isCellError(arg)) {
      return arg
    } else {
      return (acc as string).concat(arg.toString())
    }
  }, '')
}
