/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, SimpleCellAddress} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {Ast, AstNodeType, CellAddress, ParserWithCaching} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {Transformer} from './Transformer'

/**
 * Transformer for handling formula recalculation when a sheet is added.
 * Attempts to re-parse ERROR_WITH_RAW_INPUT nodes that contain references
 * to the newly added sheet.
 */
export class AddSheetTransformer extends Transformer {
  private parser?: ParserWithCaching
  private readonly quotedSheetNameLowercase: string
  private readonly unquotedSheetNameLowercase: string

  constructor(
    public readonly sheet: number,
    sheetName: string
  ) {
    super()
    this.unquotedSheetNameLowercase = this.isQuotedSheetName(sheetName) ? sheetName.slice(1, -1).toLocaleLowerCase() : sheetName.toLocaleLowerCase()
    this.quotedSheetNameLowercase = `'${this.unquotedSheetNameLowercase.replace(/'/g, "''")}'`
  }

  public isIrreversible(): boolean {
    return true
  }

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
    this.parser = parser
    for (const node of graph.arrayFormulaNodes()) {
      const [newAst] = this.transformSingleAst(node.getFormula(graph.lazilyTransformingAstService), node.getAddress(graph.lazilyTransformingAstService))
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
    }
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress>(_dependencyAddress: T, _formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return false
  }

  protected transformCellRange(_start: CellAddress, _end: CellAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformColumnRange(_start: ColumnAddress, _end: ColumnAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformRowRange(_start: RowAddress, _end: RowAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformAst(ast: Ast, address: SimpleCellAddress): Ast {
    if (ast.type === AstNodeType.ERROR_WITH_RAW_INPUT && this.containsSheetName(ast.rawInput)) {
      return this.attemptReparse(ast.rawInput, address, ast.leadingWhitespace)
    }

    // For all other nodes, use the standard traversal
    return super.transformAst(ast, address)
  }

  /**
   * Checks if the raw input contains a reference to the newly added sheet.
   * Handles both quoted and unquoted sheet name formats.
   */
  private containsSheetName(rawInput: string): boolean {
    const lowerInput = rawInput.toLowerCase()

    return lowerInput.includes(`${this.unquotedSheetNameLowercase}!`)
        || lowerInput.includes(`${this.quotedSheetNameLowercase}!`)
  }

  /**
   * Attempts to re-parse the raw input. If parsing succeeds and produces
   * a valid reference (not an error), returns the new AST. Otherwise,
   * returns the original error node.
   */
  private attemptReparse(rawInput: string, formulaAddress: SimpleCellAddress, leadingWhitespace?: string): Ast {
    if (!this.parser) {
      // Parser not available, return error node unchanged
      return {
        type: AstNodeType.ERROR_WITH_RAW_INPUT,
        rawInput,
        error: new CellError(ErrorType.REF),
        leadingWhitespace,
      }
    }

    try {
      // Re-parse the raw input as a complete formula (prepend '=' if needed)
      const formulaToParse = rawInput.startsWith('=') ? rawInput : `=${rawInput}`
      const parsingResult = this.parser.parse(formulaToParse, formulaAddress)
      const newAst = parsingResult.ast

      // Check if parsing produced an error node
      if (newAst.type === AstNodeType.ERROR || newAst.type === AstNodeType.ERROR_WITH_RAW_INPUT) {
        // Still an error, keep the original error node
        return {
          type: AstNodeType.ERROR_WITH_RAW_INPUT,
          rawInput,
          error: new CellError(ErrorType.REF),
          leadingWhitespace,
        }
      }

      // Parsing succeeded! Return the new AST, preserving whitespace
      return {
        ...newAst,
        leadingWhitespace: leadingWhitespace ?? newAst.leadingWhitespace,
      }
    } catch (e) {
      // Parsing failed, return error node unchanged
      return {
        type: AstNodeType.ERROR_WITH_RAW_INPUT,
        rawInput,
        error: new CellError(ErrorType.REF),
        leadingWhitespace,
      }
    }
  }

  private isQuotedSheetName(sheetName: string): boolean {
    return sheetName.startsWith("'") && sheetName.endsWith("'")
  }
}
