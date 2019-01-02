/**
 * Mapping translating functions from different languages to English.
 */
interface IFunctions {
  [language: string]: {
    [functionName: string]: string,
  }
}

/** @inheritDoc */
export const Functions: IFunctions = {

  /** English translation */
  EN: {
    SUM: 'SUM',
    SUMIF: 'SUMIF',
    COUNTIF: 'COUNTIF',
    TRUE: 'TRUE',
    FALSE: 'FALSE',
    ACOS: 'ACOS',
    IF: 'IF',
    AND: 'AND',
    OR: 'OR',
    CONCATENATE: 'CONCATENATE',
    ISERROR: 'ISERROR',
    COLUMNS: 'COLUMNS',
    DATE: 'DATE',
    MONTH: 'MONTH',
    YEAR: 'YEAR',
    SPLIT: 'SPLIT',
    ISBLANK: 'ISBLANK',
    TEXT: 'TEXT',
  },
}
