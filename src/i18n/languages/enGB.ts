/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/A',
    NAME: '#NAME?',
    NUM: '#NUM!',
    REF: '#REF!',
    VALUE: '#VALUE!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'AND',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'AVERAGE',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'AVERAGEIF',
    BASE: 'BASE',
    BIN2DEC: 'BIN2DEC',
    BIN2HEX: 'BIN2HEX',
    BIN2OCT: 'BIN2OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'CEILING',
    CHAR: 'CHAR',
    CHOOSE: 'CHOOSE',
    CLEAN: 'CLEAN',
    CODE: 'CODE',
    COLUMNS: 'COLUMNS',
    CONCATENATE: 'CONCATENATE',
    CORREL: 'CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'COUNT',
    COUNTA: 'COUNTA',
    COUNTBLANK: 'COUNTBLANK',
    COUNTIF: 'COUNTIF',
    COUNTIFS: 'COUNTIFS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'CUMIPMT',
    CUMPRINC: 'CUMPRINC',
    DATE: 'DATE',
    DATEDIF: 'DATEDIF',
    DATEVALUE: 'DATEVALUE',
    DAY: 'DAY',
    DAYS360: 'DAYS360',
    DAYS: 'DAYS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC2BIN',
    DEC2HEX: 'DEC2HEX',
    DEC2OCT: 'DEC2OCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'DEGREES',
    DELTA: 'DELTA',
    DOLLARDE: 'DOLLARDE',
    DOLLARFR: 'DOLLARFR',
    EDATE: 'EDATE',
    EFFECT: 'EFFECT',
    EOMONTH: 'EOMONTH',
    ERF: 'ERF',
    ERFC: 'ERFC',
    EVEN: 'EVEN',
    EXP: 'EXP',
    FALSE: 'FALSE',
    FIND: 'FIND',
    FORMULATEXT: 'FORMULATEXT',
    FV: 'FV',
    HEX2DEC: 'HEX2DEC',
    HEX2OCT: 'HEX2OCT',
    HEX2BIN: 'HEX2BIN',
    HOUR: 'HOUR',
    IF: 'IF',
    IFERROR: 'IFERROR',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'INT',
    IPMT: 'IPMT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ISBLANK',
    ISERR: 'ISERR',
    ISERROR: 'ISERROR',
    ISEVEN: 'ISEVEN',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'ISLOGICAL',
    ISNA: 'ISNA',
    ISNONTEXT: 'ISNONTEXT',
    ISNUMBER: 'ISNUMBER',
    ISODD: 'ISODD',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'ISPMT',
    ISREF: 'ISREF',
    ISTEXT: 'ISTEXT',
    LEFT: 'LEFT',
    LEN: 'LEN',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    MATCH: 'MATCH',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTE',
    MMULT: 'MMULT',
    MOD: 'MOD',
    MONTH: 'MONTH',
    NA: 'NA',
    NOMINAL: 'NOMINAL',
    NOT: 'NOT',
    NOW: 'NOW',
    NPER: 'NPER',
    OCT2DEC: 'OCT2DEC',
    OCT2HEX: 'OCT2HEX',
    OCT2BIN: 'OCT2BIN',
    ODD: 'ODD',
    OFFSET: 'OFFSET',
    OR: 'OR',
    PI: 'PI',
    PMT: 'PMT',
    POWER: 'POWER',
    PPMT: 'PPMT',
    PROPER: 'PROPER',
    PV: 'PV',
    RADIANS: 'RADIANS',
    RAND: 'RAND',
    RATE: 'RATE',
    REPT: 'REPT',
    RIGHT: 'RIGHT',
    ROUND: 'ROUND',
    ROUNDDOWN: 'ROUNDDOWN',
    ROUNDUP: 'ROUNDUP',
    ROWS: 'ROWS',
    RRI : 'RRI',
    SEARCH: 'SEARCH',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECOND',
    SHEET: 'SHEET',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'SLN',
    SPLIT: 'SPLIT',
    SQRT: 'SQRT',
    SUM: 'SUM',
    SUMIF: 'SUMIF',
    SUMIFS: 'SUMIFS',
    SUMPRODUCT: 'SUMPRODUCT',
    SUMSQ: 'SUMSQ',
    SWITCH: 'SWITCH',
    SYD: 'SYD',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TBILLEQ',
    TBILLPRICE: 'TBILLPRICE',
    TBILLYIELD: 'TBILLYIELD',
    TEXT: 'TEXT',
    TIME: 'TIME',
    TIMEVALUE: 'TIMEVALUE',
    TODAY: 'TODAY',
    TRANSPOSE: 'TRANSPOSE',
    TRIM: 'TRIM',
    TRUE: 'TRUE',
    TRUNC: 'TRUNC',
    VLOOKUP: 'VLOOKUP',
    WEEKDAY: 'WEEKDAY',
    WEEKNUM: 'WEEKNUM',
    XOR: 'XOR',
    YEAR: 'YEAR',
    YEARFRAC: 'YEARFRAC',
  },
  langCode: 'enGB',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
