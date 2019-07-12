
export function sheet() {
  const rows = 100000

  const sheet = []
  sheet.push(['1', '2', '3', '5', `=SUM(A1:D${rows})`])

  let prev = 1

  while (prev < rows) {
    const rowToPush = [
      '1',
      '2',
      '3',
      '5',
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}
