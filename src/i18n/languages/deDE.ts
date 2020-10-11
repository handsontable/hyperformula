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
    NA: '#NV',
    NAME: '#NAME?',
    NUM: '#ZAHL!',
    REF: '#BEZUG!',
    VALUE: '#WERT!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSHYP',
    ACOT: 'ARCCOTAN',
    ACOTH: 'ARCCOTANHYP',
    AND: 'UND',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINHYP',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANHYP',
    AVERAGE: 'MITTELWERT',
    AVERAGEA: 'MITTELWERTA',
    AVERAGEIF: 'MITTELWERTWENN',
    BASE: 'BASIS',
    BIN2DEC: 'BININDEZ',
    BIN2HEX: 'BININHEX',
    BIN2OCT: 'BININOKT',
    BITAND: 'BITUND',
    BITLSHIFT: 'BITLVERSCHIEB',
    BITOR: 'BITODER',
    BITRSHIFT: 'BITRVERSCHIEB',
    BITXOR: 'BITXODER',
    CEILING: 'OBERGRENZE',
    CHAR: 'ZEICHEN',
    CHOOSE: 'WAHL',
    CLEAN: 'SÄUBERN',
    CODE: 'CODE',
    COLUMN: 'SPALTE',
    COLUMNS: 'SPALTEN',
    CONCATENATE: 'VERKETTEN',
    CORREL: 'KORREL',
    COS: 'COS',
    COSH: 'COSHYP',
    COT: 'COTAN',
    COTH: 'COTANHYP',
    COUNT: 'ANZAHL',
    COUNTA: 'ANZAHL2',
    COUNTBLANK: 'ANZAHLLEEREZELLEN',
    COUNTIF: 'ZÄHLENWENN',
    COUNTIFS: 'ZÄHLENWENNS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'COSEC',
    CSCH: 'COSECHYP',
    CUMIPMT: 'KUMZINSZ',
    CUMPRINC: 'KUMKAPITAL',
    DATE: 'DATUM',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATWERT',
    DAY: 'TAG',
    DAYS360: 'TAGE360',
    DAYS: 'TAGE',
    DB: 'GDA2',
    DDB: 'GDA',
    DEC2BIN: 'DEZINBIN',
    DEC2HEX: 'DEZINHEX',
    DEC2OCT: 'DEZINOKT',
    DECIMAL: 'DEZIMAL',
    DEGREES: 'GRAD',
    DELTA: 'DELTA',
    DOLLARDE: 'NOTIERUNGDEZ',
    DOLLARFR: 'NOTIERUNGBRU',
    EDATE: 'EDATUM',
    EFFECT: "EFFEKTIV",
    EOMONTH: 'MONATSENDE',
    ERF: 'GAUSSFEHLER',
    ERFC: 'GAUSSFKOMPL',
    EVEN: 'GERADE',
    EXACT: 'IDENTISCH',
    EXP: 'EXP',
    FALSE: 'FALSCH',
    FIND: 'FINDEN',
    FORMULATEXT: 'FORMELTEKST',
    FV: 'ZW',
    HEX2BIN: 'HEXINBIN',
    HEX2DEC: 'HEXINDEZ',
    HEX2OCT: 'HEXINOKT',
    HLOOKUP: 'WVERWEIS',
    HOUR: 'STUNDE',
    IF: 'WENN',
    IFERROR: 'WENNFEHLER',
    IFNA: 'WENNNV',
    INDEX: 'INDEX',
    INT: 'GANZZAHL',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'ZINSZ',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ISTLEER',
    ISERR: 'ISTFEHL',
    ISERROR: 'ISTFEHLER',
    ISEVEN: 'ISTGERADE',
    ISFORMULA: 'ISTFORMEL',
    ISLOGICAL: 'ISTLOG',
    ISNA: 'ISTNV',
    ISNONTEXT: 'ISTKTEXT',
    ISNUMBER: 'ISTZAHL',
    ISODD: 'ISTUNGERADE',
    ISOWEEKNUM: 'ISOKALENDERWOCHE',
    ISPMT: 'ISPMT',
    ISREF: 'ISTBEZUG',
    ISTEXT: 'ISTTEXT',
    LEFT: 'LINKS',
    LEN: 'LÄNGE',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'KLEIN',
    MATCH: 'VERGLEICH',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'TEIL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTE',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MONAT',
    NA: 'NV',
    NETWORKDAYS: 'NETTOARBEITSTAGE',
    'NETWORKDAYS.INTL': 'NETTOARBEITSTAGE.INTL',
    NOMINAL: 'NOMINAL',
    NOT: 'NICHT',
    NOW: 'JETZT',
    NPER: 'ZZR',
    OCT2BIN: 'OKTINBIN',
    OCT2DEC: 'OKTINDEZ',
    OCT2HEX: 'OKTINHEX',
    ODD: 'UNGERADE',
    OFFSET: 'BEREICH.VERSCHIEBEN',
    OR: 'ODER',
    PI: 'PI',
    PMT: 'RMZ',
    SUBSTITUTE: 'WECHSELN',
    POWER: 'POTENZ',
    PPMT: 'KAPZ',
    PROPER: 'GROSS2',
    PV: 'BW',
    RADIANS: 'BOGENMASS',
    RAND: 'ZUFALLSZAHL',
    RATE: 'ZINS',
    REPT: 'WIEDERHOLEN',
    RIGHT: 'RECHTS',
    ROUND: 'RUNDEN',
    ROUNDDOWN: 'ABRUNDEN',
    ROUNDUP: 'AUFRUNDEN',
    ROW: 'ZEILE',
    ROWS: 'ZEILEN',
    RRI: 'ZSATZINVEST',
    SEARCH: 'SUCHEN',
    SEC: 'SEC',
    SECH: 'SECHYP',
    SECOND: 'SEKUNDE',
    SHEET: 'BLATT',
    SHEETS: 'BLÄTTER',
    SIN: 'SIN',
    SINH: 'SINHYP',
    SLN: 'LIA',
    SPLIT: 'SPLIT',
    SQRT: 'WURZEL',
    SUM: 'SUMME',
    SUMIF: 'SUMMEWENN',
    SUMIFS: 'SUMMEWENNS',
    SUMPRODUCT: 'SUMMENPRODUKT',
    SUMSQ: 'QUADRATESUMME',
    SWITCH: '',
    SYD: 'DIA',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANHYP',
    TBILLEQ: 'TBILLÄQUIV',
    TBILLPRICE: 'TBILLKURS',
    TBILLYIELD: 'TBILLRENDITE',
    TEXT: 'TEXT',
    TIME: 'ZEIT',
    TIMEVALUE: 'ZEITWERT',
    TODAY: 'HEUTE',
    TRANSPOSE: 'MTRANS',
    TRIM: 'GLÄTTEN',
    TRUE: 'WAHR',
    TRUNC: 'KÜRZEN',
    UNICHAR: 'UNIZEICHEN',
    UNICODE: 'UNICODE',
    UPPER: 'GROSS',
    VLOOKUP: 'SVERWEIS',
    WEEKDAY: 'WOCHENTAG',
    WEEKNUM: 'KALENDERWOCHE',
    WORKDAY: 'ARBEITSTAG',
    'WORKDAY.INTL': 'ARBEITSTAG.INTL',
    XOR: 'XODER',
    YEAR: 'JAHR',
    YEARFRAC: 'BRTEILJAHRE',
    REPLACE: 'ERSETZEN',
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
  langCode: 'deDE',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
