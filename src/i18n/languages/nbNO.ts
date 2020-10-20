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
    NA: '#I/T',
    NAME: '#NAVN?',
    NUM: '#NUM!',
    REF: '#REF!',
    VALUE: '#VERDI!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'OG',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'GJENNOMSNITT',
    AVERAGEA: 'GJENNOMSNITTA',
    AVERAGEIF: 'GJENNOMSNITTHVIS',
    BASE: 'BASE',
    BIN2DEC: 'BINTILDES',
    BIN2HEX: 'BINTILHEKS',
    BIN2OCT: 'BINTILOKT',
    BITAND: 'BITOG',
    BITLSHIFT: 'BITVFORSKYV',
    BITOR: 'BITELLER',
    BITRSHIFT: 'BITHFORSKYV',
    BITXOR: 'BITEKSKLUSIVELLER',
    CEILING: 'AVRUND.GJELDENDE.MULTIPLUM',
    CHAR: 'TEGNKODE',
    CHOOSE: 'VELG',
    CLEAN: 'RENSK',
    CODE: 'KODE',
    COLUMN: 'KOLONNE',
    COLUMNS: 'KOLONNER',
    CONCATENATE: 'KJEDE.SAMMEN',
    CORREL: 'KORRELASJON',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'ANTALL',
    COUNTA: 'ANTALLA',
    COUNTBLANK: 'TELLBLANKE',
    COUNTIF: 'ANTALL.HVIS',
    COUNTIFS: 'ANTALL.HVIS.SETT',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'SAMLET.RENTE',
    CUMPRINC: 'SAMLET.HOVEDSTOL',
    DATE: 'DATO',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATOVERDI',
    DAY: 'DAG',
    DAYS360: 'DAGER360',
    DAYS: 'DAGER',
    DB: 'DAVSKR',
    DDB: 'DEGRAVS',
    DEC2BIN: 'DESTILBIN',
    DEC2HEX: 'DESTILHEKS',
    DEC2OCT: 'DESTILOKT',
    DECIMAL: 'DESIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'DOLLARDE',
    DOLLARFR: 'DOLLARBR',
    EDATE: 'DAG.ETTER',
    EFFECT: "EFFEKTIV.RENTE",
    EOMONTH: 'MÅNEDSSLUTT',
    ERF: 'FEILF',
    ERFC: 'FEILFK',
    EVEN: 'AVRUND.TIL.PARTALL',
    EXACT: 'EKSAKT',
    EXP: 'EKSP',
    FALSE: 'USANN',
    FIND: 'FINN',
    FORMULATEXT: 'FORMELTEKST',
    FV: 'SLUTTVERDI',
    FVSCHEDULE: 'SVPLAN',
    HEX2BIN: 'HEKSTILBIN',
    HEX2DEC: 'HEKSTILDES',
    HEX2OCT: 'HEKSTILOKT',
    HLOOKUP: 'FINN.KOLONNE',
    HOUR: 'TIME',
    IF: 'HVIS',
    IFERROR: 'HVISFEIL',
    IFNA: 'HVIS.IT',
    INDEX: 'INDEKS',
    INT: 'HELTALL',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'RAVDRAG',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ERTOM',
    ISERR: 'ERF',
    ISERROR: 'ERFEIL',
    ISEVEN: 'ERPARTALL',
    ISFORMULA: 'ERFORMEL',
    ISLOGICAL: 'ERLOGISK',
    ISNA: 'ERIT',
    ISNONTEXT: 'ERIKKETEKST',
    ISNUMBER: 'ERTALL',
    ISODD: 'ERODDE',
    ISOWEEKNUM: 'ISOUKENR',
    ISPMT: 'ER.AVDRAG',
    ISREF: 'ERREF',
    ISTEXT: 'ERTEKST',
    LEFT: 'VENSTRE',
    LEN: 'LENGDE',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'SMÅ',
    MATCH: 'SAMMENLIGNE',
    MAX: 'STØRST',
    MAXA: 'MAKSA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'DELTEKST',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTT',
    MIRR: 'MODIR',
    MMULT: 'MMULT',
    MOD: 'REST',
    MONTH: 'MÅNED',
    NA: 'IT',
    NETWORKDAYS: 'NETT.ARBEIDSDAGER',
    'NETWORKDAYS.INTL': 'NETT.ARBEIDSDAGER.INTL',
    NOMINAL: 'NOMINELL',
    NOT: 'IKKE',
    NOW: 'NÅ',
    NPER: 'PERIODER',
    NPV: 'NNV',
    OCT2BIN: 'OKTTILBIN',
    OCT2DEC: 'OKTTILDES',
    OCT2HEX: 'OKTTILHEKS',
    ODD: 'AVRUND.TIL.ODDETALL',
    OFFSET: 'FORSKYVNING',
    OR: 'ELLER',
    PDURATION: 'PVARIGHET',
    PI: 'PI',
    PMT: 'AVDRAG',
    PRODUCT: 'PRODUKT',
    POWER: 'OPPHØYD.I',
    PPMT: 'AMORT',
    PROPER: 'STOR.FORBOKSTAV',
    PV: 'NÅVERDI',
    RADIANS: 'RADIANER',
    RAND: 'TILFELDIG',
    RATE: 'RENTE',
    REPLACE: 'ERSTATT',
    REPT: 'GJENTA',
    RIGHT: 'HØYRE',
    ROUND: 'AVRUND',
    ROUNDDOWN: 'AVRUND.NED',
    ROUNDUP: 'AVRUND.OPP',
    ROW: 'RAD',
    ROWS: 'RADER',
    RRI: 'REALISERT.AVKASTNING',
    SEARCH: 'SØK',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'ARK',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LINAVS',
    SPLIT: 'SPLIT',
    SQRT: 'ROT',
    STDEVA: 'STDAVVIKA',
    'STDEV.P': 'STDAV.P',
    STDEVPA: 'STDAVVIKPA',
    'STDEV.S': 'STDAV.S',
    SUBSTITUTE: 'BYTT.UT',
    SUBTOTAL: 'DELSUM',
    SUM: 'SUMMER',
    SUMIF: 'SUMMERHVIS',
    SUMIFS: 'SUMMER.HVIS.SETT',
    SUMPRODUCT: 'SUMMERPRODUKT',
    SUMSQ: 'SUMMERKVADRAT',
    SWITCH: '',
    SYD: 'ÅRSAVS',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TBILLEKV',
    TBILLPRICE: 'TBILLPRIS',
    TBILLYIELD: 'TBILLAVKASTNING',
    TEXT: 'TEKST',
    TIME: 'TID',
    TIMEVALUE: 'TIDSVERDI',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'TRIMME',
    TRUE: 'SANN',
    TRUNC: 'AVKORT',
    UNICHAR: 'UNICODETEGN',
    UNICODE: 'UNICODE',
    UPPER: 'STORE',
    VARA: 'VARIANSA',
    'VAR.P': 'VARIANS.P',
    VARPA: 'VARIANSPA',
    'VAR.S': 'VARIANS.S',
    VLOOKUP: 'FINN.RAD',
    WEEKDAY: 'UKEDAG',
    WEEKNUM: 'UKENR',
    WORKDAY: 'ARBEIDSDAG',
    'WORKDAY.INTL': 'ARBEIDSDAG.INTL',
    XNPV: 'XNNV',
    XOR: 'EKSKLUSIVELLER',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅRDEL',
    ROMAN: 'ROMERTALL',
    ARABIC: 'ARABISK',
    'HF.ADD': 'HF.ADD',
    'HF.CONCAT': 'HF.CONCAT',
    'HF.DIVIDE': 'HF.DIVIDE',
    'HF.EQ': 'HF.EQ',
    'HF.GT': 'HF.GT',
    'HF.GTE': 'HF.GTE',
    'HF.LT': 'HF.LT',
    'HF.LTE': 'HF.LTE',
    'HF.MINUS': 'HF.MINUS',
    'HF.MULTIPLY': 'HF.MULTIPLY',
    'HF.NE': 'HF.NE',
    'HF.POW': 'HF.POW',
    'HF.UMINUS': 'HF.UMINUS',
    'HF.UNARY_PERCENT': 'HF.UNARY_PERCENT',
    'HF.UPLUS': 'HF.UPLUS',
    VAR: 'VARIANS',
    VARP: 'VARIANSP',
    STDEV: 'STDAV',
    STDEVP: 'STDAVP',
    FACT: 'FAKULTET',
    FACTDOUBLE: 'DOBBELFAKT',
    COMBIN: 'KOMBINASJON',
    COMBINA: 'KOMBINASJONA',
    GCD: 'SFF',
    LCM: 'MFM',
    MROUND: 'MRUND',
    MULTINOMIAL: 'MULTINOMINELL',
    QUOTIENT: 'KVOTIENT',
    RANDBETWEEN: 'TILFELDIGMELLOM',
    SERIESSUM: 'SUMMER.REKKE',
    SIGN: 'FORTEGN',
  },
  langCode: 'nbNO',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
