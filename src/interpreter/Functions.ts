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
    MEDIAN: 'MEDIAN',
  },
  /** Polish translation */
  PL: {
    SUM: 'SUMA',
    SUMIF: 'SUMAJEZELI',
    COUNTIF: 'LICZJEZELI',
    TRUE: 'PRAWDA',
    FALSE: 'FALSZ',
    ACOS: 'ACOS',
    IF: 'JEZELI',
    AND: 'ORAZ',
    OR: 'LUB',
    CONCATENATE: 'ZLACZTEKSTY',
    ISERROR: 'CZYBLAD',
    COLUMNS: 'LICZBAKOLUMN',
    DATE: 'DATA',
    MONTH: 'MIESIAC',
    YEAR: 'ROK',
    SPLIT: 'PODZIELTEKST',
    ISBLANK: 'CZYPUSTA',
    TEXT: 'TEKST',
    MEDIAN: 'MEDIANA',
  },
}
