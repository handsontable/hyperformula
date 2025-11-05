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
  private readonly quotedSheetName: string
  private readonly unquotedSheetName: string

  constructor(
    public readonly sheet: number,
    private readonly sheetName: string
  ) {
    super()
    // Prepare both quoted and unquoted forms for matching
    this.unquotedSheetName = sheetName
    this.quotedSheetName = `'${sheetName.replace(/'/g, "''")}'`
  }

  public isIrreversible() {
    return true
  }

  public performEagerTransformations(graph: DependencyGraph, parser: ParserWithCaching): void {
    this.parser = parser
    for (const node of graph.arrayFormulaNodes()) {
      const [newAst, newAddress] = this.transformSingleAst(node.getFormula(graph.lazilyTransformingAstService), node.getAddress(graph.lazilyTransformingAstService))
      const cachedAst = parser.rememberNewAst(newAst)
      node.setFormula(cachedAst)
      node.setAddress(newAddress)
    }
  }

  public transformSingleAst(ast: Ast, address: SimpleCellAddress): [Ast, SimpleCellAddress] {
    const newAst = this.transformAst(ast, address)
    const newAddress = this.fixNodeAddress(address)
    return [newAst, newAddress]
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, _formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return false
  }

  protected transformCellRange(start: CellAddress, _end: CellAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformColumnRange(start: ColumnAddress, _end: ColumnAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformRowRange(start: RowAddress, _end: RowAddress, _formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return false
  }

  protected transformAst(ast: Ast, address: SimpleCellAddress): Ast {
    // Handle ERROR_WITH_RAW_INPUT nodes that might reference the new sheet
    if (ast.type === AstNodeType.ERROR_WITH_RAW_INPUT) {
      if (ast.error?.type === ErrorType.REF && this.containsSheetName(ast.rawInput)) {
        return this.attemptReparse(ast.rawInput, address, ast.leadingWhitespace)
      }
      return ast
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
    const lowerUnquoted = this.unquotedSheetName.toLowerCase()
    const lowerQuoted = this.quotedSheetName.toLowerCase()

    // Check for unquoted sheet name followed by '!'
    if (lowerInput.includes(`${lowerUnquoted}!`)) {
      return true
    }

    // Check for quoted sheet name followed by '!'
    if (lowerInput.includes(`${lowerQuoted}!`)) {
      return true
    }

    return false
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
}
