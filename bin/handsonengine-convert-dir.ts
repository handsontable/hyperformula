import {validateArguments, save, load} from './handsonengine-multisheet'
import {HandsOnEngine, Config} from '../src'
import * as path from 'path'

async function start() {
  if (process.argv.length < 4) {
    console.log('Usage:\nyarn ts-node bin/handsonengine-convert-dir inputdir outputdir')
    process.exit(1)
  }

  const inputDir = path.resolve(process.cwd(), process.argv[2])
  const outputDir = path.resolve(process.cwd(), process.argv[3])

  validateArguments(inputDir)

  const sheets = await load(inputDir, ",")
  const engine = HandsOnEngine.buildFromSheets(sheets, new Config({ matrixDetection: false, gpuMode: 'cpu' }))
  save(engine, outputDir)
}

start()
