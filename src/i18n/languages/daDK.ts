/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIVISION/0!',
    ERROR: '#ERROR!',
    NA: '#I/T',
    NAME: '#NAVN?',
    NUM: '#NUMMER!',
    REF: '#REFERENCE!',
    VALUE: '#VÆRDI!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ARCCOT',
    ACOTH: 'ARCCOTH',
    AND: 'OG',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'MIDDEL',
    AVERAGEA: 'MIDDELV',
    AVERAGEIF: 'MIDDEL.HVIS',
    BASE: 'BASIS',
    BIN2DEC: 'BIN.TIL.DEC',
    BIN2HEX: 'BIN.TIL.HEX',
    BIN2OCT: 'BIN.TIL.OKT',
    BITAND: 'BITOG',
    BITLSHIFT: 'BITLSKIFT',
    BITOR: 'BITELLER',
    BITRSHIFT: 'BITRSKIFT',
    BITXOR: 'BITXELLER',
    CEILING: 'AFRUND.LOFT',
    CHAR: 'CHAR',
    CHOOSE: 'VÆLG',
    CLEAN: 'RENS',
    CODE: 'KODE',
    COLUMN: 'KOLONNE',
    COLUMNS: 'KOLONNER',
    CONCATENATE: 'SAMMENKÆDNING',
    CORREL: 'KORRELATION',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'TÆL',
    COUNTA: 'TÆLV',
    COUNTBLANK: 'ANTAL.BLANKE',
    COUNTIF: 'TÆL.HVIS',
    COUNTIFS: 'TÆL.HVISER',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'AKKUM.RENTE',
    CUMPRINC: 'AKKUM.HOVEDSTOL',
    DATE: 'DATO',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATOVÆRDI',
    DAY: 'DAG',
    DAYS360: 'DAGE360',
    DAYS: 'DAGE',
    DB: 'DB',
    DDB: 'DSA',
    DEC2BIN: 'DEC.TIL.BIN',
    DEC2HEX: 'DEC.TIL.HEX',
    DEC2OCT: 'DEC.TIL.OKT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'KR.DECIMAL',
    DOLLARFR: 'KR.BRØK',
    EDATE: 'EDATO',
    EFFECT: "EFFEKTIV.RENTE",
    EOMONTH: 'SLUT.PÅ.MÅNED',
    ERF: 'FEJLFUNK',
    ERFC: 'FEJLFUNK.KOMP',
    EVEN: 'LIGE',
    EXACT: 'EKSAKT',
    EXP: 'EKSP',
    FALSE: 'FALSE',
    FIND: 'FIND',
    FORMULATEXT: 'FORMELTEKST',
    FV: 'FV',
    HEX2BIN: 'HEX.TIL.BIN',
    HEX2DEC: 'HEX.TIL.DEC',
    HEX2OCT: 'HEX.TIL.OKT',
    HLOOKUP: 'VOPSLAG',
    HOUR: 'TIME',
    IF: 'HVIS',
    IFERROR: 'HVIS.FEJL',
    IFNA: 'HVISIT',
    INDEX: 'INDEKS',
    INT: 'HELTAL',
    IPMT: 'R.YDELSE',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ER.TOM',
    ISERR: 'ER.FJL',
    ISERROR: 'ER.FEJL',
    ISEVEN: 'ER.LIGE',
    ISFORMULA: 'ER.FORMEL',
    ISLOGICAL: 'ER.LOGISK',
    ISNA: 'ER.IKKE.TILGÆNGELIG',
    ISNONTEXT: 'ER.IKKE.TEKST',
    ISNUMBER: 'ER.TAL',
    ISODD: 'ER.ULIGE',
    ISOWEEKNUM: 'ISOUGE.NR',
    ISPMT: 'ISPMT',
    ISREF: 'ER.REFERENCE',
    ISTEXT: 'ER.TEKST',
    LEFT: 'VENSTRE',
    LEN: 'LÆNGDE',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'SMÅ.BOGSTAVER',
    MATCH: 'SAMMENLIGN',
    MAX: 'MAKS',
    MAXA: 'MAKSV',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'MIDT',
    MIN: 'MIN',
    MINA: 'MINV',
    MINUTE: 'MINUT',
    MMULT: 'MPRODUKT',
    MOD: 'REST',
    MONTH: 'MÅNED',
    NA: 'IKKE.TILGÆNGELIG',
    NOMINAL: 'NOMINEL',
    NOT: 'IKKE',
    NOW: 'NU',
    NPER: 'NPER',
    OCT2BIN: 'OKT.TIL.BIN',
    OCT2DEC: 'OKT.TIL.DEC',
    OCT2HEX: 'OKT.TIL.HEX',
    ODD: 'ULIGE',
    OFFSET: 'FORSKYDNING',
    OR: 'ELLER',
    PI: 'PI',
    PMT: 'YDELSE',
    PRODUCT: 'PRODUKT',
    POWER: 'POTENS',
    PPMT: 'H.YDELSE',
    PROPER: 'STORT.FORBOGSTAV',
    PV: 'NV',
    RADIANS: 'RADIANER',
    RAND: 'SLUMP',
    RATE: 'RENTE',
    REPLACE: 'ERSTAT',
    REPT: 'GENTAG',
    RIGHT: 'HØJRE',
    ROUND: 'AFRUND',
    ROUNDDOWN: 'RUND.NED',
    ROUNDUP: 'RUND.OP',
    ROW: 'RÆKKE',
    ROWS: 'RÆKKER',
    RRI: 'RRI',
    SEARCH: 'SØG',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'ARK',
    SHEETS: 'ARK.FLERE',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LA',
    SPLIT: 'SPLIT',
    SQRT: 'KVROD',
    'STDEV.P': 'STDAFV.P',
    'STDEV.S': 'STDAFV.S',
    SUBSTITUTE: 'UDSKIFT',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SUM',
    SUMIF: 'SUM.HVIS',
    SUMIFS: 'SUM.HVISER',
    SUMPRODUCT: 'SUMPRODUKT',
    SUMSQ: 'SUMKV',
    SWITCH: '',
    SYD: 'ÅRSAFSKRIVNING',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'STATSOBLIGATION',
    TBILLPRICE: 'STATSOBLIGATION.KURS',
    TBILLYIELD: 'STATSOBLIGATION.AFKAST',
    TEXT: 'TEKST',
    TIME: 'TID',
    TIMEVALUE: 'TIDSVÆRDI',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'FJERN.OVERFLØDIGE.BLANKE',
    TRUE: 'TRUE',
    TRUNC: 'AFKORT',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'STORE.BOGSTAVER',
    'VAR.P': 'VARIANS.P',
    'VAR.S': 'VARIANS.S',
    VLOOKUP: 'LOPSLAG',
    WEEKDAY: 'UGEDAG',
    WEEKNUM: 'UGE.NR',
    XOR: 'XELLER',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅR.BRØK',
  },
  langCode: 'daDK',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
