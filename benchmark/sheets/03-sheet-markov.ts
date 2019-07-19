import { ExpectedValue} from '../benchmark'

export function sheet(rows: number = 100000) {
  const X = [
    ['0.5', '0.1', '0.4'],
    ['0.2', '0.7', '0.1'],
    ['0.3', '0.3', '0.4'],
  ]

  const sheet = []
  sheet.push(['0', '1', '0', '0'])

  let prev = 1

  while (prev < rows) {
    let rowToPush = [
      `${prev}`,
      `=B${prev}*$E$2 + C${prev}*$E$3 + D${prev}*$E$4`,
      `=B${prev}*$F$2 + C${prev}*$F$3 + D${prev}*$F$4`,
      `=B${prev}*$G$2 + C${prev}*$G$3 + D${prev}*$G$4`,
    ]
    if (prev <= X.length) {
      rowToPush = rowToPush.concat(X[prev - 1])
    }

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: 'B2', value: 0.5 },
    { address: 'C2', value: 0.1 },
    { address: 'D2', value: 0.4 },
    { address: 'B900', value: 0.32608695652173900000 },
    { address: 'C900', value: 0.39130434782608700000 },
    { address: 'D900', value: 0.28260869565217400000 },
  ]
}
