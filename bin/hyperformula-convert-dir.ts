import * as path from 'path'
import {Config, HyperFormula} from '../src'
import {load, save, validateArguments} from './hyperformula-multisheet'

async function start() {
  if (process.argv.length < 4) {
    console.log('Usage:\nyarn ts-node bin/hyperformula-convert-dir inputdir outputdir')
    process.exit(1)
  }

  const inputDir = path.resolve(process.cwd(), process.argv[2])
  const outputDir = path.resolve(process.cwd(), process.argv[3])

  validateArguments(inputDir)

  const sheets = await load(inputDir, ',')
  const config = new Config({ gpuMode: 'cpu' })
  const engine = HyperFormula.buildFromSheets(sheets, config)
  save(engine, outputDir)
}

start()
