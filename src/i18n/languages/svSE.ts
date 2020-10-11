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
    NA: '#SAKNAS!',
    NAME: '#NAMN?',
    NUM: '#OGILTIGT!',
    REF: '#REFERENS!',
    VALUE: '#VÄRDEFEL!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'OCH',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'MEDEL',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'MEDEL.OM',
    BASE: 'BASE',
    BIN2DEC: 'BIN.TILL.DEC',
    BIN2HEX: 'BIN.TILL.HEX',
    BIN2OCT: 'BIN.TILL.OKT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'RUNDA.UPP',
    CHAR: 'TECKENKOD',
    CHOOSE: 'VÄLJ',
    CLEAN: 'STÄDA',
    CODE: 'KOD',
    COLUMN: 'KOLUMN',
    COLUMNS: 'KOLUMNER',
    CONCATENATE: 'SAMMANFOGA',
    CORREL: 'KORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'ANTAL',
    COUNTA: 'ANTALV',
    COUNTBLANK: 'ANTAL.TOMMA',
    COUNTIF: 'ANTAL.OM',
    COUNTIFS: 'ANTAL.OMF',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'KUMRÄNTA',
    CUMPRINC: 'KUMPRIS',
    DATE: 'DATUM',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATUMVÄRDE',
    DAY: 'DAG',
    DAYS360: 'DAGAR360',
    DAYS: 'DAYS',
    DB: 'DB',
    DDB: 'DEGAVSKR',
    DEC2BIN: 'DEC.TILL.BIN',
    DEC2HEX: 'DEC.TILL.HEX',
    DEC2OCT: 'DEC.TILL.OKT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'DECTAL',
    DOLLARFR: 'BRÅK',
    EDATE: 'EDATUM',
    EFFECT: "EFFRÄNTA",
    EOMONTH: 'SLUTMÅNAD',
    ERF: 'FELF',
    ERFC: 'FELFK',
    EVEN: 'JÄMN',
    EXACT: 'EXAKT',
    EXP: 'EXP',
    FALSE: 'FALSKT',
    FIND: 'HITTA',
    FORMULATEXT: 'FORMELTEXT',
    FV: 'SLUTVÄRDE',
    HEX2BIN: 'HEX.TILL.BIN',
    HEX2DEC: 'HEX.TILL.DEC',
    HEX2OCT: 'HEX.TILL.OKT',
    HLOOKUP: 'LETAKOLUMN',
    HOUR: 'TIMME',
    IF: 'OM',
    IFERROR: 'OMFEL',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'HELTAL',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'RBETALNING',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÄRTOM',
    ISERR: 'ÄRF',
    ISERROR: 'ÄRFEL',
    ISEVEN: 'ÄRJÄMN',
    ISFORMULA: 'ISFORMEL',
    ISLOGICAL: 'ÄRLOGISK',
    ISNA: 'ÄRSAKNAD',
    ISNONTEXT: 'ÄREJTEXT',
    ISNUMBER: 'ÄRTAL',
    ISODD: 'ÄRUDDA',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'RALÅN',
    ISREF: 'ÄRREF',
    ISTEXT: 'ÄRTEXT',
    LEFT: 'VÄNSTER',
    LEN: 'LÄNGD',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'GEMENER',
    MATCH: 'PASSA',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXTEXT',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUT',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MÅNAD',
    NA: 'SAKNAS',
    NETWORKDAYS: 'NETTOARBETSDAGAR',
    'NETWORKDAYS.INTL': 'NETTOARBETSDAGAR.INT',
    NOMINAL: 'NOMRÄNTA',
    NOT: 'ICKE',
    NOW: 'NU',
    NPER: 'PERIODER',
    OCT2BIN: 'OKT.TILL.BIN',
    OCT2DEC: 'OKT.TILL.DEC',
    OCT2HEX: 'OKT.TILL.HEX',
    ODD: 'UDDA',
    OFFSET: 'FÖRSKJUTNING',
    OR: 'ELLER',
    PI: 'PI',
    PMT: 'BETALNING',
    SUBSTITUTE: 'BYT.UT',
    POWER: 'UPPHÖJT.TILL',
    PPMT: 'AMORT',
    PROPER: 'INITIAL',
    PV: 'NUVÄRDE',
    RADIANS: 'RADIANER',
    RAND: 'SLUMP',
    RATE: 'RÄNTA',
    REPT: 'REP',
    RIGHT: 'HÖGER',
    ROUND: 'AVRUNDA',
    ROUNDDOWN: 'AVRUNDA.NEDÅT',
    ROUNDUP: 'AVRUNDA.UPPÅT',
    ROW: 'RAD',
    ROWS: 'RADER',
    RRI: 'RRI',
    SEARCH: 'SÖK',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'SHEET',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LINAVSKR',
    SPLIT: 'SPLIT',
    SQRT: 'ROT',
    SUM: 'SUMMA',
    SUMIF: 'SUMMA.OM',
    SUMIFS: 'SUMMA.OMF',
    SUMPRODUCT: 'PRODUKTSUMMA',
    SUMSQ: 'KVADRATSUMMA',
    SWITCH: '',
    SYD: 'ÅRSAVSKR',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'SSVXEKV',
    TBILLPRICE: 'SSVXPRIS',
    TBILLYIELD: 'SSVXRÄNTA',
    TEXT: 'TEXT',
    TIME: 'KLOCKSLAG',
    TIMEVALUE: 'TIDVÄRDE',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONERA',
    TRIM: 'RENSA',
    TRUE: 'SANT',
    TRUNC: 'AVKORTA',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'VERSALER',
    VLOOKUP: 'LETARAD',
    WEEKDAY: 'VECKODAG',
    WEEKNUM: 'VECKONR',
    WORKDAY: 'ARBETSDAGAR',
    'WORKDAY.INTL': 'ARBETSDAGAR.INT',
    XOR: 'XOR',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅRDEL',
    REPLACE: 'ERSÄTT',
    ADD: 'ADD',
    CONCAT: 'CONCAT',
    DIVIDE: 'DIVIDE',
    EQ: 'EQ',
    GT: 'GT',
    GEQ: 'GEQ',
    LT: 'LT',
    LEQ: 'LEQ',
    MINUS: 'MINUS',
    MULTIPLY: 'MULTIPLY',
    NE: 'NE',
    POW: 'POW',
    UMINUS: 'UMINUS',
    UNARY_PERCENT: 'UNARY_PERCENT',
    UPLUS: 'UPLUS',
  },
  langCode: 'svSE',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
