import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import {HandsOnEngine} from '../src'
import {Sheets} from '../src'
import {CsvExporter, CsvImporter, CsvSheets} from '../src/csv'

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

export function load(inputDir: string, csvDelimiter: string): Promise<Sheets> {
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
      const sheets = new CsvImporter(csvDelimiter).csvSheetsToSheets(csvSheets)
      resolve(sheets)
    })
  })
}

export function save(engine: HandsOnEngine, outputDir: string) {
  const exporter = new CsvExporter()
  const sheets: CsvSheets = exporter.exportAllSheets(engine)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }
  for (const key of Object.keys(sheets)) {
    const outputPath = path.join(outputDir, key + '.csv')
    fs.writeFileSync(outputPath, sheets[key])
  }
}
