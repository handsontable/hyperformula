var HandsOnEngine = require("../lib/minified-full.js").HandsOnEngine
var assert = require('assert')

var engine = HandsOnEngine.buildFromArray([
  ['42', '=A1 + 2']
])
var valueA1 = engine.getCellValue('A1')
var valueB1 = engine.getCellValue('B1')

assert(valueA1 == 42)
assert(valueB1 == 44)
console.log("OK")
