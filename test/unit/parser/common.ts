import { AlwaysDense } from '../../../src'
import {Config} from '../../../src/Config'
import {AddressMapping, SheetMapping} from '../../../src/DependencyGraph'
import {buildTranslationPackage} from '../../../src/i18n'
import {enGB} from '../../../src/i18n/languages'
import {FunctionRegistry} from '../../../src/interpreter/FunctionRegistry'
import {ParserWithCaching} from '../../../src/parser'

export function buildEmptyParserWithCaching(config: Config, sheetMapping?: SheetMapping, addressMapping?: AddressMapping): ParserWithCaching {
  sheetMapping = sheetMapping || new SheetMapping(buildTranslationPackage(enGB))
  addressMapping = addressMapping || new AddressMapping(new AlwaysDense())
  return new ParserWithCaching(config, new FunctionRegistry(config), sheetMapping, addressMapping)
}
