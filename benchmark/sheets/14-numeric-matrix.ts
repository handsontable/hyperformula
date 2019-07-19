export function sheet(rows: number = 10000, cols: number = 100) {
  const sheet = []

  let x = 0
  for (let i=0; i<rows; ++i) {
    const row = []
    for (let j=0; j<cols; ++j) {
      row.push("" + x)
      ++x
    }
    sheet.push(row)
  }

  return sheet
}
