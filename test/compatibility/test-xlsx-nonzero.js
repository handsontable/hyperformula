#!/usr/bin/env node

/**
 * Node.js script to test XLSX import into HyperFormula
 * Verifies that all non-empty cells evaluate to non-zero numbers
 */

const ExcelJS = require('exceljs');
const { HyperFormula } = require('./commonjs/index.js');

class XlsxNonZeroTester {
  constructor() {
    this.results = {
      totalCells: 0,
      nonEmptyCells: 0,
      nonZeroCells: 0,
      failures: [],
      errors: []
    };
  }

  /**
   * Read XLSX workbook from file
   * @param {string} filename - Path to XLSX file
   * @returns {Promise<ExcelJS.Workbook>}
   */
  async readXlsxWorkbookFromFile(filename) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filename);
    return workbook;
  }

  /**
   * Convert XLSX workbook to JavaScript arrays compatible with HyperFormula
   * @param {ExcelJS.Workbook} workbook - ExcelJS workbook
   * @returns {Object} - Sheets data for HyperFormula
   */
  convertXlsxWorkbookToJavascriptArrays(workbook) {
    const workbookData = {};

    workbook.eachSheet((worksheet) => {
      const sheetData = [];
      let maxRow = 0;
      let maxCol = 0;

      // First pass: determine sheet dimensions
      worksheet.eachRow((row, rowNumber) => {
        maxRow = Math.max(maxRow, rowNumber);
        row.eachCell((cell, colNumber) => {
          maxCol = Math.max(maxCol, colNumber);
        });
      });

      // Second pass: populate data array with proper dimensions
      for (let r = 1; r <= maxRow; r++) {
        const rowData = [];
        for (let c = 1; c <= maxCol; c++) {
          const cell = worksheet.getCell(r, c);
          let cellData = null;
          
          if (cell.formula) {
            // Handle formulas
            cellData = `=${cell.formula}`;
          } else if (cell.value !== null && cell.value !== undefined) {
            // Handle values
            cellData = cell.value;
          }
          
          rowData.push(cellData);
        }
        sheetData.push(rowData);
      }

      workbookData[worksheet.name] = sheetData;
    });

    return workbookData;
  }

  /**
   * Test all non-empty cells to ensure they evaluate to non-zero numbers
   * @param {HyperFormula} hf - HyperFormula instance
   * @param {Object} sheetsData - Original sheets data
   */
  testNonZeroCells(hf, sheetsData) {
    const sheetNames = hf.getSheetNames();
    
    sheetNames.forEach((sheetName, sheetIndex) => {
      const sheetData = sheetsData[sheetName];
      const sheetDimensions = hf.getSheetDimensions(sheetIndex);
      
      console.log(`\nTesting sheet: ${sheetName} (${sheetDimensions.width}x${sheetDimensions.height})`);
      
      for (let row = 0; row < sheetData.length; row++) {
        for (let col = 0; col < sheetData[row].length; col++) {
          const originalValue = sheetData[row][col];
          this.results.totalCells++;
          
          // Skip empty cells
          if (originalValue === null || originalValue === undefined || originalValue === '') {
            continue;
          }
          
          this.results.nonEmptyCells++;
          
          try {
            const cellAddress = { sheet: sheetIndex, col, row };
            const evaluatedValue = hf.getCellValue(cellAddress);
            const cellReference = `${sheetName}!${this.columnToLetter(col + 1)}${row + 1}`;
            
            // Check if the evaluated value is a non-zero number
            if (typeof evaluatedValue === 'number' && evaluatedValue !== 0) {
              this.results.nonZeroCells++;
              console.log(`✓ ${cellReference}: ${originalValue} → ${evaluatedValue}`);
            } else if (typeof evaluatedValue === 'number' && evaluatedValue === 0) {
              this.results.failures.push({
                cell: cellReference,
                original: originalValue,
                evaluated: evaluatedValue,
                reason: 'Evaluates to zero'
              });
              console.log(`✗ ${cellReference}: ${originalValue} → ${evaluatedValue} (ZERO)`);
            } else if (evaluatedValue && evaluatedValue.type === 'ERROR') {
              this.results.errors.push({
                cell: cellReference,
                original: originalValue,
                error: evaluatedValue,
                reason: `Error: ${evaluatedValue.type}`
              });
              console.log(`⚠ ${cellReference}: ${originalValue} → ERROR: ${evaluatedValue.type}`);
            } else {
              this.results.failures.push({
                cell: cellReference,
                original: originalValue,
                evaluated: evaluatedValue,
                reason: `Not a number (type: ${typeof evaluatedValue})`
              });
              console.log(`✗ ${cellReference}: ${originalValue} → ${evaluatedValue} (NOT NUMBER)`);
            }
          } catch (error) {
            this.results.errors.push({
              cell: `${sheetName}!${this.columnToLetter(col + 1)}${row + 1}`,
              original: originalValue,
              error: error.message,
              reason: 'Evaluation error'
            });
            console.log(`⚠ Error evaluating ${sheetName}!${this.columnToLetter(col + 1)}${row + 1}: ${error.message}`);
          }
        }
      }
    });
  }

  /**
   * Convert column number to Excel letter (1 = A, 2 = B, etc.)
   * @param {number} num - Column number (1-based)
   * @returns {string} - Excel column letter
   */
  columnToLetter(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  /**
   * Print summary report
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY REPORT');
    console.log('='.repeat(60));
    
    console.log(`Total cells examined: ${this.results.totalCells}`);
    console.log(`Non-empty cells: ${this.results.nonEmptyCells}`);
    console.log(`Non-zero number cells: ${this.results.nonZeroCells}`);
    console.log(`Failed cells: ${this.results.failures.length}`);
    console.log(`Error cells: ${this.results.errors.length}`);
    
    const successRate = this.results.nonEmptyCells > 0 
      ? ((this.results.nonZeroCells / this.results.nonEmptyCells) * 100).toFixed(2)
      : 0;
    console.log(`Success rate: ${successRate}%`);
    
    if (this.results.failures.length > 0) {
      console.log('\nFAILED CELLS:');
      this.results.failures.forEach(failure => {
        console.log(`  ${failure.cell}: ${failure.original} → ${failure.evaluated} (${failure.reason})`);
      });
    }
    
    if (this.results.errors.length > 0) {
      console.log('\nERROR CELLS:');
      this.results.errors.forEach(error => {
        console.log(`  ${error.cell}: ${error.original} → ${error.reason}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Test passes if all non-empty cells evaluate to non-zero numbers
    const testPassed = this.results.nonEmptyCells > 0 && 
                      this.results.failures.length === 0 && 
                      this.results.errors.length === 0;
    
    if (testPassed) {
      console.log('✓ TEST PASSED: All non-empty cells evaluate to non-zero numbers');
      process.exit(0);
    } else {
      console.log('✗ TEST FAILED: Some cells do not evaluate to non-zero numbers');
      process.exit(1);
    }
  }

  /**
   * Main test runner
   * @param {string} filename - Path to XLSX file
   */
  async run(filename) {
    try {
      console.log(`Reading XLSX file: ${filename}`);
      const xlsxWorkbook = await this.readXlsxWorkbookFromFile(filename);
      
      console.log('Converting XLSX workbook to JavaScript arrays...');
      const sheetsAsJavascriptArrays = this.convertXlsxWorkbookToJavascriptArrays(xlsxWorkbook);
      
      console.log('Building HyperFormula instance...');
      const hf = HyperFormula.buildFromSheets(sheetsAsJavascriptArrays, { 
        licenseKey: 'gpl-v3',
        useStats: true 
      });
      
      console.log('Testing non-zero evaluation...');
      this.testNonZeroCells(hf, sheetsAsJavascriptArrays);
      
      this.printSummary();
      
    } catch (error) {
      console.error('Error during test execution:', error);
      process.exit(1);
    }
  }
}

// CLI interface
function printUsage() {
  console.log('Usage: node test-xlsx-nonzero.js <path-to-xlsx-file>');
  console.log('');
  console.log('This script:');
  console.log('1. Reads an XLSX file using ExcelJS');
  console.log('2. Imports it into HyperFormula');
  console.log('3. Verifies that all non-empty cells evaluate to non-zero numbers');
  console.log('');
  console.log('Examples:');
  console.log('  node test-xlsx-nonzero.js sample.xlsx');
  console.log('  node test-xlsx-nonzero.js /path/to/test-file.xlsx');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    printUsage();
    process.exit(1);
  }
  
  const filename = args[0];
  const tester = new XlsxNonZeroTester();
  await tester.run(filename);
}

// Check if we need to install dependencies
try {
  require('exceljs');
} catch (error) {
  console.error('ExcelJS is not installed. Please run:');
  console.error('npm install exceljs');
  process.exit(1);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = XlsxNonZeroTester;
