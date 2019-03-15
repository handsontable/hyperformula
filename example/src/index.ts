import { ParserWithCaching } from "./parser/ParserWithCaching"
import { Config } from "./Config"
import { HandsOnEngine } from "./HandsOnEngine"

function sheet() {
  const rows = 10000
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
        // `=MEDIAN(A1, A1:A${current}, C${current})`,
        `=MEDIAN(A1:A${current})`,
        `${current}`,
        // `=MEDIAN(C1, C1:C${current}, E${current})`,
        `=MEDIAN(C1:C${current})`,
        `${current}`,
        // `=MEDIAN(E1, E1:E${current}, A${current})`,
        `=MEDIAN(E1:E${current})`,
      ]
      dependent++
    } else {
      rowToPush = [
        `${current}`,
        // `=MEDIAN(A1, A1:A${current}, A1)`,
        `=MEDIAN(A1:A${current})`,
        `${current}`,
        // `=MEDIAN(C1, C1:C${current}, C1)`,
        `=MEDIAN(C1:C${current})`,
        `${current}`,
        // `=MEDIAN(E1, E1:E${current}, E1)`,
        `=MEDIAN(E1:E${current})`,
      ]
    }
    sheet.push(rowToPush)
    ++current
  }
  sheet.push(["Some random string"])

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
  const sheetMedian = sheet()
  // const sheetMedian = [
  //   ['43', '42', '41', '=MEDIAN(A1:C1)'],
  // ];
  HandsOnEngine.useWasm = true;
  const engine = HandsOnEngine.buildFromArray(wasminterpreter, sheetMedian)
  console.warn(engine.getCellValue('D1'))
  console.warn(engine.stats.snapshot());
  // won't typecheck if yourlib does not expose the run function
  // module.run();
});
