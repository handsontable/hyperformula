import {Config} from '../../src/Config'
import {ParserWithCaching} from '../../src/parser'
import {FunctionRegistry} from '../../src/interpreter/FunctionRegistry'
import {SheetMapping} from '../../src/DependencyGraph'
import {buildTranslationPackage} from '../../src/i18n'
import {enGB} from '../../src/i18n/languages'

export function buildEmptyParserWithCaching(config: Config, sheetMapping?: SheetMapping): ParserWithCaching {
  sheetMapping = sheetMapping || new SheetMapping(buildTranslationPackage(enGB))
  return new ParserWithCaching(config, new FunctionRegistry(config), sheetMapping.get)
}