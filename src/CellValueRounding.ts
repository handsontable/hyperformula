import {CellValue} from './Cell'
import {Config} from './Config'

export function cellValueRounding(val: CellValue, config: Config): CellValue
{
  if(config.smartRounding && typeof val == 'number' && !Number.isInteger(val)) { //CUSTOM ROUNDING
    const placesMultiplier = Math.pow(10, config.precisionRounding)
    if (val < 0) {
      return -Math.round(-val * placesMultiplier) / placesMultiplier
    } else {
      return Math.round(val * placesMultiplier) / placesMultiplier
    }
  }
  else {
    return val
  }
}
