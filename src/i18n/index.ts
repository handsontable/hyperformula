export type TranslationSet = Record<string, string>

export interface TranslationPackage {
  functions: TranslationSet,
}

export const enGB: TranslationPackage = {
  functions: {
    ACOS: 'ACOS',
    AND: 'AND',
    COLUMNS: 'COLUMNS',
    CONCATENATE: 'CONCATENATE',
    COUNTIF: 'COUNTIF',
    COUNTUNIQUE: 'COUNTUNIQUE',
    DATE: 'DATE',
    EXP: 'EXP',
    FALSE: 'FALSE',
    IF: 'IF',
    ISBLANK: 'ISBLANK',
    ISERROR: 'ISERROR',
    MAX: 'MAX',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MMULT: 'MMULT',
    MONTH: 'MONTH',
    OR: 'OR',
    RAND: 'RAND',
    SPLIT: 'SPLIT',
    SUM: 'SUM',
    SUMIF: 'SUMIF',
    SUMPRODUCT: 'SUMPRODUCT',
    TEXT: 'TEXT',
    TRANSPOSE: 'TRANSPOSE',
    TRUE: 'TRUE',
    YEAR: 'YEAR',
  },
}

export const plPL: TranslationPackage = {
  functions: {
    ACOS: 'ACOS',
    AND: 'ORAZ',
    COLUMNS: 'LICZBAKOLUMN',
    CONCATENATE: 'ZLACZTEKST',
    COUNTIF: 'LICZJEZELI',
    COUNTUNIQUE: 'COUNTUNIQUE',
    DATE: 'DATA',
    EXP: 'EXP',
    FALSE: 'FALSZ',
    IF: 'JEZELI',
    ISBLANK: 'CZYPUSTA',
    ISERROR: 'CZYBLAD',
    MAX: 'MAKS',
    MAXPOOL: 'MAKS.Z.PULI',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANA.Z.PULI',
    MIN: 'MIN',
    MMULT: 'MACIERZ.ILOCZYN',
    MONTH: 'MIESIAC',
    OR: 'LUB',
    RAND: 'LOSUJ',
    SPLIT: 'PODZIELTEKST',
    SUM: 'SUMA',
    SUMIF: 'SUMAJEZELI',
    SUMPRODUCT: 'SUMA.ILOCZYNOW',
    TEXT: 'TEKST',
    TRANSPOSE: 'TRANSPONUJ',
    TRUE: 'PRAWDA',
    YEAR: 'ROK',
  },
}

export const extendFunctions = (pkg: TranslationPackage, additionalFunctionTranslations: TranslationSet): TranslationPackage => {
  return {
    functions: Object.assign({}, pkg.functions, additionalFunctionTranslations)
  }
}
