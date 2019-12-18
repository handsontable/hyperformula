const { resolve } = require('path')
const assert = require('assert')

const [ /* node bin */, /* path to this script */, fileToCheck ] = process.argv;

(async function() {
  if (!fileToCheck) {
    throw Error('Missing file to check');
  }

  const { HyperFormula: Engine, Config } = require(resolve(fileToCheck));

  const engine = await Engine.buildFromArray([
    ['42', '=A1 + 2']
  ], new Config({ gpuMode: 'cpu' }))

  const valueA1 = engine.getCellValue({ sheet: 0, row: 0, col: 0 })
  const valueB1 = engine.getCellValue({ sheet: 0, row: 0, col: 1 })

  assert(valueA1 === 42)
  assert(valueB1 === 44)

  console.log(`Bundle check: \u001b[32m${fileToCheck}\u001b[0m OK`)
})()
