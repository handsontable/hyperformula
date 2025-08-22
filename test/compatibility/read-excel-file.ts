import { Cell, Row, Workbook, Worksheet } from 'exceljs'
import { HyperFormula, RawCellContent } from '../../src'

interface SheetData {
  [sheetName: string]: RawCellContent[][],
}

/**
 * Main function to read Excel file and process it with HyperFormula
 */
async function run(): Promise<void> {
  try {
    // Get filename from command line arguments
    const filename = process.argv[2]

    if (!filename) {
      console.error('Usage: ts-node read-excel-file.ts <path-to-excel-file>')
      process.exit(1)
    }

    const xlsxWorkbook = await readXlsxWorkbookFromFile(filename)
    const [workbookData, readValues] = convertXlsxWorkbookToJavascriptArrays(xlsxWorkbook)
    const hf = HyperFormula.buildFromSheets(workbookData, { licenseKey: 'gpl-v3' })

    console.log('Formulas:', hf.getSheetSerialized(0))
    console.log('Computed Values:  ', hf.getSheetValues(0))
    console.log('Read values:  ', readValues.Sheet1)
  } catch (error: unknown) {
    console.error('Error:', error)
    process.exit(1)
  }
}

/**
 * Reads an Excel workbook from file
 */
async function readXlsxWorkbookFromFile(filename: string): Promise<Workbook> {
  const workbook = new Workbook()
  await workbook.xlsx.readFile(filename)
  return workbook
}

/**
 * Converts Excel workbook to JavaScript arrays format
 */
function convertXlsxWorkbookToJavascriptArrays(workbook: Workbook): [SheetData, SheetData] {
  const workbookData: SheetData = {}
  const readValues: SheetData = {}

  workbook.eachSheet((worksheet: Worksheet) => {
    const sheetData: RawCellContent[][] = []
    const sheetReadValues: RawCellContent[][] = []

    worksheet.eachRow((row: Row) => {
      const rowData: RawCellContent[] = []
      const rowReadValues: RawCellContent[] = []

      row.eachCell((cell: Cell) => {
        const cellData = cell.formula ? `=${cell.formula}` : cell.value as RawCellContent
        const cellValue = (cell.value && typeof cell.value === 'object' && 'result' in cell.value && cell.value.result != null ? cell.value.result : cell.value) as RawCellContent
        rowData.push(cellData)
        rowReadValues.push(cellValue)
      })

      sheetData.push(rowData)
      sheetReadValues.push(rowReadValues)
    })

    workbookData[worksheet.name] = sheetData
    readValues.Sheet1 = sheetReadValues
  })

  return [workbookData, readValues]
}

// Execute the main function
void run()
