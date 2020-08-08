export function sheet(rows: number = 20000) {
  const sheet = []
  sheet.push(['1', '2', '3', '0', '0'])

  let prev = 1

  while (prev < rows) {
    const rowToPush = [
      `${prev + 1}`,
      '2',
      '=3*5',
      `=A${prev}+D${prev}`,
      `=OR(FALSE(), ISEVEN(MEDIAN(A${prev},B${prev},C${prev},D${prev})))`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}