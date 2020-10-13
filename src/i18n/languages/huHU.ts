/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#ZÉRÓOSZTÓ!',
    ERROR: '#ERROR!',
    NA: '#HIÁNYZIK',
    NAME: '#NÉV?',
    NUM: '#SZÁM!',
    REF: '#HIV!',
    VALUE: '#ÉRTÉK!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ARCCOT',
    ACOTH: 'ARCCOTH',
    AND: 'ÉS',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'ÁTLAG',
    AVERAGEA: 'ÁTLAGA',
    AVERAGEIF: 'ÁTLAGHA',
    BASE: 'ALAP',
    BIN2DEC: 'BIN.DEC',
    BIN2HEX: 'BIN.HEX',
    BIN2OCT: 'BIN.OKT',
    BITAND: 'BIT.ÉS',
    BITLSHIFT: 'BIT.BAL.ELTOL',
    BITOR: 'BIT.VAGY',
    BITRSHIFT: 'BIT.JOBB.ELTOL',
    BITXOR: 'BIT.XVAGY',
    CEILING: 'PLAFON',
    CHAR: 'KARAKTER',
    CHOOSE: 'VÁLASZT',
    CLEAN: 'TISZTÍT',
    CODE: 'KÓD',
    COLUMN: 'OSZLOP',
    COLUMNS: 'OSZLOPOK',
    CONCATENATE: 'ÖSSZEFŰZ',
    CORREL: 'KORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'DARAB',
    COUNTA: 'DARAB2',
    COUNTBLANK: 'DARABÜRES',
    COUNTIF: 'DARABTELI',
    COUNTIFS: 'DARABHATÖBB',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'ÖSSZES.KAMAT',
    CUMPRINC: 'ÖSSZES.TŐKERÉSZ',
    DATE: 'DÁTUM',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DÁTUMÉRTÉK',
    DAY: 'NAP',
    DAYS360: 'DAYS360',
    DAYS: 'NAPOK',
    DB: 'DB',
    DDB: 'KCSA',
    DEC2BIN: 'DEC.BIN',
    DEC2HEX: 'DEC.HEX',
    DEC2OCT: 'DEC.OKT',
    DECIMAL: 'TIZEDES',
    DEGREES: 'FOK',
    DELTA: 'DELTA',
    DOLLARDE: 'FORINT.DEC',
    DOLLARFR: 'FORINT.TÖRT',
    EDATE: 'KALK.DÁTUM',
    EFFECT: "TÉNYLEGES",
    EOMONTH: 'HÓNAP.UTOLSÓ.NAP',
    ERF: 'HIBAF',
    ERFC: 'HIBAF.KOMPLEMENTER',
    EVEN: 'PÁROS',
    EXACT: 'AZONOS',
    EXP: 'KITEVŐ',
    FALSE: 'HAMIS',
    FIND: 'SZÖVEG.TALÁL',
    FORMULATEXT: 'KÉPLETSZÖVEG',
    FV: 'JBÉ',
    HEX2BIN: 'HEX.BIN',
    HEX2DEC: 'HEX.DEC',
    HEX2OCT: 'HEX.OKT',
    HLOOKUP: 'VKERES',
    HOUR: 'ÓRA',
    IF: 'HA',
    IFERROR: 'HAHIBA',
    IFNA: 'HAHIÁNYZIK',
    INDEX: 'INDEX',
    INT: 'INT',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'RRÉSZLET',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÜRES',
    ISERR: 'HIBA.E',
    ISERROR: 'HIBÁS',
    ISEVEN: 'PÁROSE',
    ISFORMULA: 'KÉPLET',
    ISLOGICAL: 'LOGIKAI',
    ISNA: 'NINCS',
    ISNONTEXT: 'NEM.SZÖVEG',
    ISNUMBER: 'SZÁM',
    ISODD: 'PÁRATLANE',
    ISOWEEKNUM: 'ISO.HÉT.SZÁMA',
    ISPMT: 'LRÉSZLETKAMAT',
    ISREF: 'HIVATKOZÁS',
    ISTEXT: 'SZÖVEG.E',
    LEFT: 'BAL',
    LEN: 'HOSSZ',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'KISBETŰ',
    MATCH: 'HOL.VAN',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIÁN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'KÖZÉP',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'PERCEK',
    MMULT: 'MSZORZAT',
    MOD: 'MARADÉK',
    MONTH: 'HÓNAP',
    NA: 'HIÁNYZIK',
    NETWORKDAYS: 'ÖSSZ.MUNKANAP',
    'NETWORKDAYS.INTL': 'ÖSSZ.MUNKANAP.INTL',
    NOMINAL: 'NÉVLEGES',
    NOT: 'NEM',
    NOW: 'MOST',
    NPER: 'PER.SZÁM',
    OCT2BIN: 'OKT.BIN',
    OCT2DEC: 'OKT.DEC',
    OCT2HEX: 'OKT.HEX',
    ODD: 'PÁRATLAN',
    OFFSET: 'ELTOLÁS',
    OR: 'VAGY',
    PI: 'PI',
    PMT: 'RÉSZLET',
    SUBSTITUTE: 'HELYETTE',
    POWER: 'HATVÁNY',
    PPMT: 'PRÉSZLET',
    PROPER: 'TNÉV',
    PV: 'MÉ',
    RADIANS: 'RADIÁN',
    RAND: 'VÉL',
    RATE: 'RÁTA',
    REPT: 'SOKSZOR',
    RIGHT: 'JOBB',
    ROUND: 'KEREKÍTÉS',
    ROUNDDOWN: 'KEREK.LE',
    ROUNDUP: 'KEREK.FEL',
    ROW: 'SOR',
    ROWS: 'SOROK',
    RRI: 'MR',
    SEARCH: 'SZÖVEG.KERES',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'MPERC',
    SHEET: 'LAP',
    SHEETS: 'LAPOK',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LCSA',
    SPLIT: 'SPLIT',
    SQRT: 'GYÖK',
    SUM: 'SZUM',
    SUMIF: 'SZUMHA',
    SUMIFS: 'SZUMHATÖBB',
    SUMPRODUCT: 'SZORZATÖSSZEG',
    SUMSQ: 'NÉGYZETÖSSZEG',
    SWITCH: '',
    SYD: 'ÉSZÖ',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'KJEGY.EGYENÉRT',
    TBILLPRICE: 'KJEGY.ÁR',
    TBILLYIELD: 'KJEGY.HOZAM',
    TEXT: 'SZÖVEG',
    TIME: 'IDŐ',
    TIMEVALUE: 'IDŐÉRTÉK',
    TODAY: 'MA',
    TRANSPOSE: 'TRANSZPONÁLÁS',
    TRIM: 'KIMETSZ',
    TRUE: 'IGAZ',
    TRUNC: 'CSONK',
    UNICHAR: 'UNIKARAKTER',
    UNICODE: 'UNICODE',
    UPPER: 'NAGYBETŰS',
    VLOOKUP: 'FKERES',
    WEEKDAY: 'HÉT.NAPJA',
    WEEKNUM: 'HÉT.SZÁMA',
    WORKDAY: 'KALK.MUNKANAP',
    'WORKDAY.INTL': 'KALK.MUNKANAP.INTL',
    XOR: 'XVAGY',
    YEAR: 'ÉV',
    YEARFRAC: 'TÖRTÉV',
    REPLACE: 'CSERE',
    ROMAN: 'RÓMAI',
  },
  langCode: 'huHU',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
