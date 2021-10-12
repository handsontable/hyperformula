import {HyperFormula, SimpleCellAddress} from '../../../src'

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {
  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!
  const row = Number(result[6]) - 1
  return {sheet: sheet, col: colNumber(result[4]), row: row}
}

const colNumber = (input: string): number => {
  if (input.length === 1) {
    return input.toUpperCase().charCodeAt(0) - 65
  } else {
    return input.split('').reduce((currentColumn, nextLetter) => {
      return currentColumn * 26 + (nextLetter.toUpperCase().charCodeAt(0) - 64)
    }, 0) - 1
  }
}

export function numberOfRows(engine: HyperFormula) {
  const dimensions = engine.getAllSheetsDimensions()
  let sum = 0
  const sheetNames = Object.getOwnPropertyNames(dimensions)
  for (const sheet of sheetNames) {
    sum += dimensions[sheet].height
  }
  return sum
}
