import * as fs from 'fs'
import * as path from 'path'
import {CsvExporter, CsvImporter} from '../src/csv'

async function start() {
  if (process.argv.length < 4) {
    console.log('Usage:\nyarn ts-node bin/handsonengine-convert formulas.csv output.csv')
    process.exit(1)
  }

  const formulasCsvPath = path.resolve(process.cwd(), process.argv[2])
  const outputCsvPath = path.resolve(process.cwd(), process.argv[3])

  if (!fs.existsSync(formulasCsvPath)) {
    console.log(`File ${formulasCsvPath} does not exist.`)
    process.exit(1)
  }

  const formulasCsvString = fs.readFileSync(formulasCsvPath, { encoding: 'utf8' })
  const engine = new CsvImporter().importSheet(formulasCsvString)
  const exporter = new CsvExporter()
  const exportedCsvString = exporter.exportSheetByName(engine, 'Sheet1')

  fs.writeFileSync(outputCsvPath, exportedCsvString)
}

start()
