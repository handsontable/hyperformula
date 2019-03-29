import { ParserWithCaching } from "./parser/ParserWithCaching"
import { Config } from "./Config"
import { HandsOnEngine } from "./HandsOnEngine"

function sheet() {
  const rows = 4000
  const divider = 10

  console.warn(`Rows: ${rows}`)
  let dependent = 0
  const sheet = []
  let current = 1
  while (current <= rows) {
    let rowToPush
    if (current % divider === 0) {
      rowToPush = [
        `${current}`,
        `=MEDIAN(A1:A${rows})`,
        `${current}`,
        // `=MEDIAN(C1, C1:C${current}, E${current})`,
        `=MEDIAN(C1:C${rows})`,
        `${current}`,
        // `=MEDIAN(E1, E1:E${current}, A${current})`,
        `=MEDIAN(E1:E${rows})`,
      ]
      dependent++
    } else {
      rowToPush = [
        `${current}`,
        // `=MEDIAN(A1, A1:A${current}, A1)`,
        `=MEDIAN(A1:A${rows})`,
        `${current}`,
        // `=MEDIAN(C1, C1:C${current}, C1)`,
        `=MEDIAN(C1:C${rows})`,
        `${current}`,
        // `=MEDIAN(E1, E1:E${current}, E1)`,
        `=MEDIAN(E1:E${rows})`,
      ]
    }
    sheet.push(rowToPush)
    ++current
  }
  sheet.push(["Some random string"])

  return sheet
}


function sumSheetFn() {
  const rows = 40000

  console.warn(`Rows: ${rows}`)
  const sheet = []
  sheet.push([
    `=SUM(A2:A${rows})`,
    `=SUM(B2:B${rows})`,
    `=SUM(C2:C${rows})`,
    `=SUM(D2:D${rows})`,
    `=SUM(E2:E${rows})`,

    `=SUM(F2:F${rows})`,
    `=SUM(G2:G${rows})`,
    `=SUM(H2:H${rows})`,
    `=SUM(I2:I${rows})`,
    `=SUM(J2:J${rows})`,
  ])
  let current = 2
  while (current <= rows) {
    let rowToPush = [
      `${current}`,
      `${current}`,
      `${current}`,
      `${current}`,
      `${current}`,

      `${current}`,
      `${current}`,
      `${current}`,
      `${current}`,
      `${current}`,
    ]
    sheet.push(rowToPush)
    ++current
  }

  return sheet
}

import("../wasminterpreter/pkg/interpreter").then(wasminterpreter => {
  console.warn(wasminterpreter)
  wasminterpreter.greet("John")
  const config = new Config();
  const parser = new ParserWithCaching(config)
  const formula = "=42"
  const { ast, dependencies } = parser.parse(formula, { col: 0, row: 0 })
  // const engine = new HandsOnEngine()
  console.warn(formula)
  console.warn(ast)
  // const sheetMedian = sheet()
  const s = sumSheetFn()
  // const sheetMedian = [
  //   ['43', '42', '41', '=MEDIAN(A1:C1)'],
  // ];
  // HandsOnEngine.useWasm = true;
  console.warn(`Using wasm: ${HandsOnEngine.useWasm}`)
  const engine = HandsOnEngine.buildFromArray(wasminterpreter, s)
  console.warn(engine.getCellValue('D1'))
  console.warn(engine.stats.snapshot());
  // won't typecheck if yourlib does not expose the run function
  // module.run();
});
