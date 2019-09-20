import {half} from '../cruds/operations'

export function simpleSorted(rows: number) {
  const sheet = []

  let prev = 1
  while (prev < rows + 1) {
    sheet.push([prev.toString()])
    prev++
  }

  sheet.push([`=VLOOKUP(1, A1:B${rows}, 1, TRUE())`, `=VLOOKUP(${Math.floor(rows / 2)}, A1:B${rows}, 1, TRUE())`, `=VLOOKUP(${rows}, A1:B${rows}, 1, TRUE())`])

  return sheet
}

export function topdown(rows: number, vlookupLines: number) {
  const sheet = []

  let prev = 1
  while (prev <= rows) {
    sheet.push([(rows - prev + 1).toString()])
    prev++
  }

  for (let i = 0; i < vlookupLines; ++i) {
    sheet.push([`=VLOOKUP(1, A1:B${rows}, 1, false())`])
  }

  return sheet
}

export function randomVlookups(rows: number, cols: number, vlookupLines: number) {
  const sheet = []

  for (let i = 0; i < rows; ++i) {
    const row = []
    for (let j = 0; j < cols; ++j) {
      row.push(rand(1, rows).toString())
    }
    sheet.push(row)
  }

  for (let i = 0; i < vlookupLines; ++i) {
    const row = []
    for (let j = 0; j < cols; ++j) {
      const columnLetter = String.fromCharCode(65 + j).toUpperCase()
      row.push(`=VLOOKUP(${rand(1, rows).toString()}, ${columnLetter}1:${columnLetter}${rows}, 1, false())`)
    }
    sheet.push(row)
  }

  return sheet
}

export function repeating2(rows: number, differentValues: number, vlookupLines: number) {
  const cols = 6
  const sheet = []

  for (let i = 0; i < rows; ++i) {
    const row = []
    for (let j = 0; j < cols; ++j) {
      row.push((i % differentValues).toString())
    }
    sheet.push(row)
  }

  for (let x = 0; x < differentValues; ++x) {
    const row = []
    for (let j = 0; j < half(cols); ++j) {
      const columnLetter = String.fromCharCode(65 + j).toUpperCase()
      row.push(`=VLOOKUP(${x}, ${columnLetter}1:${columnLetter}${rows}, 1, false())`)
    }
    sheet.push(row)
  }
  return sheet
}

export function repeating(rows: number, differentValues: number, vlookupLines: number) {
  const sheet = []
  const half = Math.floor(rows / 2)

  for (let i = 0; i < half; ++i) {
    sheet.push([`=A${(rows - i)}`])
  }

  for (let i = half; i < rows; ++i) {
    sheet.push([(i % differentValues).toString()])
  }

  for (let i = 0; i < vlookupLines; ++i) {
    const row = []
    for (let i = 0; i < differentValues; ++i) {
      row.push(`=VLOOKUP(${i}, A1:A${rows}, 1, false())`)
    }
    sheet.push(row)
  }

  return sheet
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
