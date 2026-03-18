import {HyperFormula} from '../src'
import {SimpleCellAddress, simpleCellAddress} from '../src/Cell'

export const adr = (stringAddress: string, sheet: number = 0): SimpleCellAddress => {

  const result = /^(\$([A-Za-z0-9_]+)\.)?(\$?)([A-Za-z]+)(\$?)([0-9]+)$/.exec(stringAddress)!
  const row = Number(result[6]) - 1
  return simpleCellAddress(sheet, colNumber(result[4]), row)
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

export function unregisterAllLanguages() {
  for (const langCode of HyperFormula.getRegisteredLanguagesCodes()) {
    HyperFormula.unregisterLanguage(langCode)
  }
}
