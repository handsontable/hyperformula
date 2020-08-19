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
    ATAN: 'ARCTAN',
    ATAN2: 'ARCTAN2',
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
    DAYS: 'DAYS',
    DB: 'DB',
    DDB: 'DEGAVSKR',
    DAYS360: 'DAGAR360',
    DEC2BIN: 'DEC.TILL.BIN',
    DEC2HEX: 'DEC.TILL.HEX',
    DEC2OCT: 'DEC.TILL.OKT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'DECTAL',
    DOLLARFR: 'BRÅK',
    EFFECT: "EFFRÄNTA",
    EDATE: 'EDATUM',
    EOMONTH: 'SLUTMÅNAD',
    ERF: 'FELF',
    ERFC: 'FELFK',
    EVEN: 'JÄMN',
    EXP: 'EXP',
    FALSE: 'FALSKT',
    FIND: 'HITTA',
    FORMULATEXT: 'FORMELTEXT',
    FV: 'SLUTVÄRDE',
    HOUR: 'TIMME',
    IF: 'OM',
    IFERROR: 'OMFEL',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'HELTAL',
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
    ISPMT: 'RALÅN',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISREF: 'ÄRREF',
    ISTEXT: 'ÄRTEXT',
    LEFT: 'VÄNSTER',
    LEN: 'LÄNGD',
    LN: 'LN',
    LOG: 'LOG',
    LOG10: 'LOG10',
    MATCH: 'PASSA',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUT',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MÅNAD',
    NA: 'SAKNAS',
    NOMINAL: 'NOMRÄNTA',
    NOW: 'NU',
    NOT: 'ICKE',
    NPER: 'PERIODER',
    ODD: 'UDDA',
    OFFSET: 'FÖRSKJUTNING',
    OR: 'ELLER',
    PI: 'PI',
    PMT: 'BETALNING',
    POWER: 'UPPHÖJT.TILL',
    PPMT: 'AMORT',
    PROPER: 'INITIAL',
    RADIANS: 'RADIANER',
    RAND: 'SLUMP',
    RATE: 'RÄNTA',
    REPT: 'REP',
    RIGHT: 'HÖGER',
    ROUND: 'AVRUNDA',
    ROUNDDOWN: 'AVRUNDA.NEDÅT',
    ROUNDUP: 'AVRUNDA.UPPÅT',
    ROWS: 'RADER',
    SEARCH: 'SÖK',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEETS: 'SHEETS',
    SHEET: 'SHEET',
    SIN: 'SIN',
    SINH: 'SINH',
    SPLIT: 'SPLIT',
    SQRT: 'ROT',
    SUM: 'SUMMA',
    SUMIF: 'SUMMA.OM',
    SUMIFS: 'SUMMA.OMF',
    SUMPRODUCT: 'PRODUKTSUMMA',
    SUMSQ: 'KVADRATSUMMA',
    SWITCH: '',
    TAN: 'TAN',
    TANH: 'TANH',
    TEXT: 'TEXT',
    TIME: 'KLOCKSLAG',
    TIMEVALUE: 'TIDVÄRDE',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONERA',
    TRIM: 'RENSA',
    TRUE: 'SANT',
    TRUNC: 'AVKORTA',
    VLOOKUP: 'LETARAD',
    WEEKDAY: 'VECKODAG',
    WEEKNUM: 'VECKONR',
    XOR: 'XOR',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅRDEL',
    PV: 'NUVÄRDE',
    RRI: 'RRI',
    SLN: 'LINAVSKR',
  },
  langCode: 'svSE',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
