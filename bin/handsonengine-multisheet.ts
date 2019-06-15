import parse from 'csv-parse/lib/sync'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {Config, HandsOnEngine} from '../src'
import {CsvSheets, Sheets} from '../src/GraphBuilder'
import {Exporter} from '../src/csv'

export function validateArguments(inputDir: string) {
  const sheetsDir = path.resolve(process.cwd(), inputDir)
  const manifestPath = path.join(sheetsDir, 'manifest.txt')

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

export function load(inputDir: string, config: Config): Promise<Sheets> {
  validateArguments(inputDir)

  const sheetsDir = path.resolve(process.cwd(), inputDir)
  const manifestPath = path.join(sheetsDir, 'manifest.txt')

  const lineReader = readline.createInterface({
    input: fs.createReadStream(manifestPath),
    crlfDelay: Infinity,
  })

  const csvSheets: CsvSheets = {}

  lineReader.on('line', (line) => {
    const csv = fs.readFileSync(path.join(sheetsDir, line), { encoding: 'utf8' })
    const sheetName = line.split('.')[0]
    csvSheets[sheetName] = csv
  })

  return new Promise<Sheets>((resolve) => {
    lineReader.on('close', () => {
      const sheets = parseCsvSheets(csvSheets, config)
      resolve(sheets)
    })
  })
}

export function parseCsvSheets(csvSheets: CsvSheets, config: Config): Sheets {
  const sheets: Sheets = {}
  for (const key of Object.keys(csvSheets)) {
    sheets[key] = parse(csvSheets[key], { delimiter: config.csvDelimiter })
  }
  return sheets
}

export function save(engine: HandsOnEngine, outputDir: string) {
  const exporter = new Exporter()
  const sheets: CsvSheets = exporter.exportAllSheets(engine)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  for (const key of Object.keys(sheets)) {
    const outputPath = path.join(outputDir, key + '.csv')
    fs.writeFileSync(outputPath, sheets[key])
  }
}
