import { ExpectedValue} from '../benchmark'

export function sheet(rows: number = 2000) {
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

export function sheets() {
  return {
    Sheet1: sheet(),
    Sheet2: sheet(),
    Sheet3: sheet(),
  }
}

export function expectedValues(): ExpectedValue[] {
  return [
    { address: '$Sheet1.A1000', value: 1000 },
    { address: '$Sheet1.B1000', value: 500.5 },
    { address: '$Sheet1.C1000', value: 1000 },
    { address: '$Sheet1.D1000', value: 500.5 },
    { address: '$Sheet1.E1000', value: 1000 },
    { address: '$Sheet1.F1000', value: 500.5 },
    { address: '$Sheet2.A1000', value: 1000 },
    { address: '$Sheet2.B1000', value: 500.5 },
    { address: '$Sheet2.C1000', value: 1000 },
    { address: '$Sheet2.D1000', value: 500.5 },
    { address: '$Sheet2.E1000', value: 1000 },
    { address: '$Sheet2.F1000', value: 500.5 },
    { address: '$Sheet3.A1000', value: 1000 },
    { address: '$Sheet3.B1000', value: 500.5 },
    { address: '$Sheet3.C1000', value: 1000 },
    { address: '$Sheet3.D1000', value: 500.5 },
    { address: '$Sheet3.E1000', value: 1000 },
    { address: '$Sheet3.F1000', value: 500.5 },
  ]
}
