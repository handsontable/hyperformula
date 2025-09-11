import { Cell, Row, Workbook, Worksheet } from 'exceljs'
import { ConfigParams, DetailedCellError, HyperFormula, RawCellContent, SerializedNamedExpression, Sheets } from '../../src'

const HF_CONFIG: Partial<ConfigParams> = {
  licenseKey: 'gpl-v3',
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  currencySymbol: ['$', 'USD'],
  localeLang: 'en-US',
  accentSensitive: true,
  useArrayArithmetic: true,
  ignoreWhiteSpace: 'any',
  evaluateNullToZero: true,
  leapYear1900: true,
  nullDate: { year: 1899, month: 12, day: 31 },
}

const NAMED_EXPRESSIONS: SerializedNamedExpression[] = [
  { name: 'TRUE', expression: '=TRUE()' },
  { name: 'FALSE', expression: '=FALSE()' },
]

interface CellDiff {
  row: number,
  col: number,
  sheetA: RawCellContent,
  sheetB: RawCellContent,
}

interface SheetsDiff {
  [sheetName: string]: CellDiff[],
}

/**
 * Utility class for comparing values with proper equality logic
 */
class ValueComparator {
  /**
   * Creates an instance of ValueComparator.
   * @param {number} [epsilon=Number.EPSILON] - The tolerance used for floating point comparisons.
   */
  constructor(private epsilon: number = Number.EPSILON) {}

  /**
   * Determines if two values are equal
   * @param {unknown} valA - First value to compare
   * @param {unknown} valB - Second value to compare
   * @returns {boolean} true if values are equal, false otherwise
   */
  areEqual(valA: unknown, valB: unknown): boolean {
    if (valA == null && valB == null) return true

    // Handle number comparison with potential floating point precision issues
    if (typeof valA === 'number' && typeof valB === 'number') {
      if (isNaN(valA) && isNaN(valB)) return true
      return Math.abs(valA - valB) < this.epsilon
    }

    // Handle error comparison
    if (valA instanceof DetailedCellError) {
      valA = { error: valA.value }
    }

    if (valB instanceof DetailedCellError) {
      valB = { error: valB.type }
    }

    // Handle object comparison (dates, etc.)
    if (typeof valA === 'object' && typeof valB === 'object') {
      return JSON.stringify(valA) === JSON.stringify(valB)
    }

    return valA === valB
  }
}

/**
 * Main function to read Excel file and process it with HyperFormula
 */
async function run(): Promise<void> {
  try {
    const valueComparator = new ValueComparator(0.000000001)
    const filename = process.argv[2]

    if (!filename) {
      console.error('Usage: ts-node read-excel-file.ts <path-to-excel-file>')
      process.exit(1)
    }

    const [readFormulas, readValues] = await readFormulasAndValuesFromXlsxFile(filename)
    const [hfFormulas, hfValues] = evaluateSheet(readFormulas)

    const diffFormulas = compareSheets(hfFormulas, readFormulas)
    const diffValues = compareSheets(hfValues, readValues, valueComparator)

    console.log('Diff formulas:', diffFormulas)
    console.log('Diff values:', diffValues)
  } catch (error: unknown) {
    console.error('Error:', error)
    process.exit(1)
  }
}

/**
 * Compares two sheets and returns the differences
 */
function compareSheets(sheetCollectionA: Sheets, sheetCollectionB: Sheets, comparator?: ValueComparator): SheetsDiff {
  const allSheetNames = new Set([...Object.keys(sheetCollectionA), ...Object.keys(sheetCollectionB)])

  const allSheetsDiff = Array.from(allSheetNames).reduce<SheetsDiff>((acc, sheetName: string) => {
    const sheetDiff = compareSingleSheet(sheetCollectionA[sheetName] || [], sheetCollectionB[sheetName] || [], comparator)

    if (sheetDiff.length > 0) {
      acc[sheetName] = sheetDiff
    }

    return acc
  }, {})

  return allSheetsDiff
}

/**
 * Compares two single sheet data arrays and returns the differences
 */
function compareSingleSheet(sheetAData: RawCellContent[][], sheetBData: RawCellContent[][], comparator?: ValueComparator): CellDiff[] {
  const compare = comparator ? comparator.areEqual.bind(comparator) : (a: unknown, b: unknown) => a === b

  const maxRows = Math.max(sheetAData.length, sheetBData.length)
  const sheetDiff = [] as CellDiff[]

  for (let row = 0; row < maxRows; row++) {
    const maxCols = Math.max(sheetAData[row]?.length ?? 0, sheetBData[row]?.length ?? 0)

    for (let col = 0; col < maxCols; col++) {
      const cellA = sheetAData[row]?.[col] ?? null
      const cellB = sheetBData[row]?.[col] ?? null

      if (!compare(cellA, cellB)) {
        sheetDiff.push({
          row,
          col,
          sheetA: cellA,
          sheetB: cellB
        })
      }
    }
  }

  return sheetDiff
}

/**
 * Evaluates formulas using HyperFormula and returns computed values
 */
function evaluateSheet(formulas: Sheets): [Sheets, Sheets] {
  const hf = HyperFormula.buildFromSheets(formulas, HF_CONFIG, NAMED_EXPRESSIONS)
  return [hf.getAllSheetsSerialized() as Sheets, hf.getAllSheetsValues() as Sheets]
}

/**
 * Reads formulas and values from an Excel file
 */
async function readFormulasAndValuesFromXlsxFile(filename: string): Promise<[Sheets, Sheets]> {
  const workbook = await readXlsxWorkbookFromFile(filename)
  return convertXlsxWorkbookToFormulasAndValuesArrays(workbook)
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
function convertXlsxWorkbookToFormulasAndValuesArrays(workbook: Workbook): [Sheets, Sheets] {
  const workbookData: Sheets = {}
  const readValues: Sheets = {}

  workbook.eachSheet((worksheet: Worksheet) => {
    const sheetData: RawCellContent[][] = []
    const sheetReadValues: RawCellContent[][] = []

    worksheet.eachRow((row: Row) => {
      const rowData: RawCellContent[] = []
      const rowReadValues: RawCellContent[] = []

      row.eachCell((cell: Cell) => {
        const cellData = cell.formula ? `=${cell.formula}` : cell.value as RawCellContent
        const cellValue = (cell.value && typeof cell.value === 'object' && 'result' in cell.value && cell.value.result != null
          ? cell.value.result
          : cell.value && typeof cell.value === 'object' && 'formula' in cell.value && cell.value.formula != null
            ? 0
            : cell.value) as RawCellContent
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

void run()
