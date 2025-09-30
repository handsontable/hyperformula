import { CellValue, Workbook, Worksheet } from 'exceljs'
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
  hf: RawCellContent,
  source: RawCellContent,
}

interface SheetsDiff {
  [sheetName: string]: CellDiff[],
}

/**
 * Utility class for comparing values with proper equality logic
 */
class ValueComparator {
  private readonly nullLikeValues: unknown[] = [0, '', false, null, undefined]

  /**
   * Creates an instance of ValueComparator.
   * @param {number} [epsilon=Number.EPSILON] - The tolerance used for floating point comparisons.
   */
  constructor(private epsilon: number = Number.EPSILON) {}

  /**
   * Determines if two values are equal
   * @param {unknown} rawValA - First value to compare
   * @param {unknown} rawValB - Second value to compare
   * @returns {boolean} true if values are equal, false otherwise
   */
  areEqual(rawValA: unknown, rawValB: unknown): boolean {
    const valA = this.normalize(rawValA)
    const valB = this.normalize(rawValB)

    // Handle number comparison with potential floating point precision issues
    if (typeof valA === 'number' && typeof valB === 'number') {
      if (isNaN(valA) && isNaN(valB)) return true
      return Math.abs(valA - valB) < this.epsilon
    }

    // Handle object comparison (dates, etc.)
    if (typeof valA === 'object' && typeof valB === 'object') {
      return JSON.stringify(valA) === JSON.stringify(valB)
    }

    return valA === valB
  }

  /**
   * Normalizes values for comparison (converts null-like values to 0, extracts error values)
   * @param {unknown} val - Value to normalize
   * @returns {unknown} Normalized value
   */
  normalize(val: unknown): unknown {
    if (val instanceof DetailedCellError) {
      // console.error('HF Error:', val.value, val.message)
      return val.value
    }

    if (this.nullLikeValues.includes(val)) {
      return 0
    }

    return val
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
    // console.error('Read formulas:', readFormulas)
    const [hfFormulas, hfValues] = evaluateSheet(readFormulas)

    const diffFormulas = compareSheets(hfFormulas, readFormulas)
    const diffValues = compareSheets(hfValues, readValues, valueComparator)

    const hasFormulaDiffs = Object.keys(diffFormulas).length > 0
    const hasValueDiffs = Object.keys(diffValues).length > 0

    if (hasFormulaDiffs) {
      console.log('Diff formulas:', diffFormulas)
    }

    if (hasValueDiffs) {
      console.log('Diff values:', diffValues)
    }

    if (hasFormulaDiffs || hasValueDiffs) {
      process.exit(1)
    }

    process.exit(0)
  } catch (error: unknown) {
    console.error('Error:', error)
    process.exit(1)
  }
}

/**
 * Compares two sheets and returns the differences
 */
function compareSheets(hfCollection: Sheets, sourceCollection: Sheets, comparator?: ValueComparator): SheetsDiff {
  const allSheetNames = new Set([...Object.keys(hfCollection), ...Object.keys(sourceCollection)])

  const allSheetsDiff = Array.from(allSheetNames).reduce<SheetsDiff>((acc, sheetName: string) => {
    const sheetDiff = compareSingleSheet(hfCollection[sheetName] || [], sourceCollection[sheetName] || [], comparator)

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
function compareSingleSheet(hfData: RawCellContent[][], sourceData: RawCellContent[][], comparator?: ValueComparator): CellDiff[] {
  const compare = comparator ? comparator.areEqual.bind(comparator) : (a: unknown, b: unknown) => a === b

  const maxRows = Math.max(hfData.length, sourceData.length)
  const sheetDiff = [] as CellDiff[]

  for (let row = 0; row < maxRows; row++) {
    const maxCols = Math.max(hfData[row]?.length ?? 0, sourceData[row]?.length ?? 0)

    for (let col = 0; col < maxCols; col++) {
      const hfCell = hfData[row]?.[col] ?? null
      const sourceCell = sourceData[row]?.[col] ?? null

      if (!compare(hfCell, sourceCell)) {
        sheetDiff.push({
          row,
          col,
          hf: hfCell,
          source: sourceCell
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
 * Clears formulas from _xlfn. prefix
 */
function clearFormulas(formulas: Sheets): Sheets {
  return Object.entries(formulas).reduce<Sheets>((acc, [sheetName, sheet]) => {
    acc[sheetName] = sheet.map((row) => row.map((cell) => typeof cell === 'string' ? cell.replace('_xlfn.', '') : cell))
    return acc
  }, {})
}

/**
 * Reads formulas and values from an Excel file
 */
async function readFormulasAndValuesFromXlsxFile(filename: string): Promise<[Sheets, Sheets]> {
  const workbook = await readXlsxWorkbookFromFile(filename)
  const [formulas, values] = convertXlsxWorkbookToFormulasAndValuesArrays(workbook)
  const cleanFormulas = clearFormulas(formulas)
  return [cleanFormulas, values]
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

    const dimensions = worksheet.dimensions
    if (!dimensions) {
      workbookData[worksheet.name] = sheetData
      readValues[worksheet.name] = sheetReadValues
      return
    }

    for (let rowNum = dimensions.top; rowNum <= dimensions.bottom; rowNum++) {
      const rowData: RawCellContent[] = []
      const rowReadValues: RawCellContent[] = []

      for (let colNum = dimensions.left; colNum <= dimensions.right; colNum++) {
        const cell = worksheet.getCell(rowNum, colNum)

        const cellData = cell.formula ? `=${cell.formula}` : cell.value as RawCellContent
        const cellValue = readCellValue(cell.value)

        rowData.push(cellData)
        rowReadValues.push(cellValue)
      }

      sheetData.push(rowData)
      sheetReadValues.push(rowReadValues)
    }

    workbookData[worksheet.name] = sheetData
    readValues[worksheet.name] = sheetReadValues
  })

  return [workbookData, readValues]
}

/**
 * Extracts the actual cell value from an Excel cell value object
 * @param {CellValue} cellValueObject - The Excel cell value object to extract from
 * @returns {RawCellContent} The extracted cell value
 */
function readCellValue(cellValueObject: CellValue): RawCellContent {
  if (!cellValueObject) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line
  return cellValueObject.result?.error ?? cellValueObject.result ?? (cellValueObject.formula != null ? 0 : cellValueObject)
}

void run()
