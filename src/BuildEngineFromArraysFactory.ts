import {HyperFormula, LazilyTransformingAstService} from './'
import {CellContentParser} from './CellContentParser'
import {buildColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {Config, ConfigParams} from './Config'
import {DateHelper} from './DateHelper'
import {DependencyGraph} from './DependencyGraph'
import {GraphBuilder, Sheet, Sheets} from './GraphBuilder'
import {buildLexerConfig, ParserWithCaching, Unparser} from './parser'
import {Evaluator} from './Evaluator'
import {Statistics, StatType} from './statistics/Statistics'
import {collatorFromConfig} from './StringHelper'
import {UndoRedo} from './UndoRedo'
import {NumberLiteralHelper} from './NumberLiteralHelper'

export class BuildEngineFromArraysFactory {
  private buildWithConfig(sheets: Sheets, config: Config): HyperFormula {
    const stats = new Statistics()

    stats.start(StatType.BUILD_ENGINE_TOTAL)

    const lazilyTransformingAstService = new LazilyTransformingAstService(stats)
    const dependencyGraph = DependencyGraph.buildEmpty(lazilyTransformingAstService, config, stats)
    const columnIndex = buildColumnSearchStrategy(dependencyGraph, config, stats)
    const sheetMapping = dependencyGraph.sheetMapping
    const addressMapping = dependencyGraph.addressMapping
    for (const sheetName in sheets) {
      const sheetId = sheetMapping.addSheet(sheetName)
      addressMapping.autoAddSheet(sheetId, sheets[sheetName])
    }

    const parser = new ParserWithCaching(config, sheetMapping.get)
    const unparser = new Unparser(config, buildLexerConfig(config), sheetMapping.fetchDisplayName)
    const dateHelper = new DateHelper(config)
    const numberLiteralHelper = new NumberLiteralHelper(config)
    const collator = collatorFromConfig(config)
    const cellContentParser = new CellContentParser(config, dateHelper, numberLiteralHelper)

    const undoRedo = new UndoRedo()

    stats.measure(StatType.GRAPH_BUILD, () => {
      const graphBuilder = new GraphBuilder(dependencyGraph, columnIndex, parser, cellContentParser, config, stats)
      graphBuilder.buildGraph(sheets)
    })

    lazilyTransformingAstService.parser = parser
    lazilyTransformingAstService.undoRedo = undoRedo

    const evaluator = new Evaluator(dependencyGraph, columnIndex, config, stats, dateHelper, numberLiteralHelper, collator)
    evaluator.run()

    stats.end(StatType.BUILD_ENGINE_TOTAL)

    const engine = new HyperFormula(
      config,
      stats,
      dependencyGraph,
      columnIndex,
      parser,
      unparser,
      cellContentParser,
      evaluator,
      lazilyTransformingAstService,
      undoRedo,
    )

    return engine
  }

  public buildFromSheets(sheets: Sheets, configInput?: Partial<ConfigParams>): HyperFormula {
    const config = new Config(configInput)
    return this.buildWithConfig(sheets, config)
  }

  public buildFromSheet(sheet: Sheet, configInput?: Partial<ConfigParams>): HyperFormula {
    const config = new Config(configInput)
    const newsheetprefix = config.language.interface.NEW_SHEET_PREFIX + '1'
    return this.buildWithConfig({[newsheetprefix]: sheet}, config)
  }
}
