import { ExpectedValue} from '../benchmark'

export function sheet(rows: number = 100000) {
  const sheet = []
  sheet.push(['100', '200', '300', '400', '500'])

  let prev = 1
  while (prev < rows) {
    sheet.push([
      `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + A${prev}`, // always 100
      `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + B${prev}`, // always 200
      `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + C${prev}`, // always 300
      `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + D${prev}`, // always 400
      `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + E${prev}`, // always 500
    ])

    prev++
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    {address: 'A10', value: 100},
    {address: 'B100', value: 200},
    {address: 'C1000', value: 300},
    {address: 'D10000', value: 400},
    {address: 'E100000', value: 500},
  ]
}
