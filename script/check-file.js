const { resolve } = require('path')
const assert = require('assert')

const [ /* node bin */, /* path to this script */, fileToCheck ] = process.argv;

if (!fileToCheck) {
  throw Error('Missing file to check');
}

try {
  const { HyperFormula } = require(resolve(fileToCheck));

  const engine = HyperFormula.buildFromArray([
    ['42', '=A1 + 2']
  ], { gpuMode: 'cpu', licenseKey: 'non-commercial-and-evaluation' })

  const valueA1 = engine.getCellValue({ sheet: 0, row: 0, col: 0 })
  const valueB1 = engine.getCellValue({ sheet: 0, row: 0, col: 1 })

  assert(valueA1 === 42)
  assert(valueB1 === 44)

  console.log(`Bundle check: \u001b[1;37m${fileToCheck}\u001b[0m \u001b[0;32mOK\u001b[0m`)
} catch (ex) {
  console.log(`Bundle check: \u001b[1;37m${fileToCheck}\u001b[0m \u001b[0;31mERROR\u001b[0m`)

  throw ex;
}
