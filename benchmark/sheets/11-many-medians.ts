import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 2000
  const divider = 10

  let dependent = 0
  const sheet = []
  let current = 1
  while (current <= rows) {
    let rowToPush
    if (current % divider === 0) {
      rowToPush = [
        `${current}`,
        `=MEDIAN(A1, A1:A${current}, C${current})`,
        `${current}`,
        `=MEDIAN(C1, C1:C${current}, E${current})`,
        `${current}`,
        `=MEDIAN(E1, E1:E${current}, A${current})`,
      ]
      dependent++
    } else {
      rowToPush = [
        `${current}`,
        `=MEDIAN(A1, A1:A${current}, A1)`,
        `${current}`,
        `=MEDIAN(C1, C1:C${current}, C1)`,
        `${current}`,
        `=MEDIAN(E1, E1:E${current}, E1)`,
      ]
    }
    sheet.push(rowToPush)
    ++current
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: 'A1000', value: 1000 },
    { address: 'B1000', value: 500.5 },
    { address: 'C1000', value: 1000 },
    { address: 'D1000', value: 500.5 },
    { address: 'E1000', value: 1000 },
    { address: 'F1000', value: 500.5 },
  ]
}
