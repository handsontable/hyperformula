import * as fs from 'fs'
import * as path from 'path'
import * as readline from "readline";
import {CsvSheets} from "../src/GraphBuilder";
import {Config, HandsOnEngine} from "../src";
import ConfigGlobals = jest.ConfigGlobals;

if (process.argv.length < 4) {
  console.log('Usage:\nyarn ts-node bin/handsonengine-convert input_dir output.csv')
  process.exit(1)
}

const sheetsDir = path.resolve(process.cwd(), process.argv[2])
const manifestPath = path.join(sheetsDir, "manifest.txt")
const outputCsvPath = path.resolve(process.cwd(), process.argv[3])

function validateArguments() {
  if (!fs.existsSync(sheetsDir)) {
    console.error(`Directory ${sheetsDir} does not exist.`)
    process.exit(1)
  }

  if (!fs.lstatSync(sheetsDir).isDirectory()) {
    console.error(`${sheetsDir} is not a directory`)
    process.exit(1)
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not present`)
    process.exit(1)
  }
}

function load() {
  const config: Config = new Config({
    csvDelimiter: ";",
    functionArgSeparator: ","
  })

  const lineReader = readline.createInterface({
    input: fs.createReadStream(manifestPath),
    crlfDelay: Infinity
  })

  const sheets: CsvSheets = {}

  lineReader.on('line', (line) => {
    const csv = fs.readFileSync(path.join(sheetsDir, line), { encoding: 'utf8' })
    const sheetName = line.split(".")[0]
    sheets[sheetName] = csv
  })

  lineReader.on('close', () => {
    const engine = HandsOnEngine.buildFromMultiSheets(sheets, config)
    const exportedCsvString = engine.exportAsCsv('resp7')
    console.log(exportedCsvString)
  })
}


validateArguments()
load()
