/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DELING.DOOR.0!',
    ERROR: '#ERROR!',
    NA: '#N/B',
    NAME: '#NAAM?',
    NUM: '#GETAL!',
    REF: '#VERW!',
    VALUE: '#WAARDE!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'BOOGCOS',
    ACOSH: 'BOOGCOSH',
    ACOT: 'BOOGCOT',
    ACOTH: 'BOOGCOTH',
    AND: 'EN',
    ASIN: 'BOOGSIN',
    ASINH: 'BOOGSINH',
    ATAN2: 'BOOGTAN2',
    ATAN: 'BOOGTAN',
    ATANH: 'BOOGTANH',
    AVERAGE: 'GEMIDDELDE',
    AVERAGEA: 'GEMIDDELDEA',
    AVERAGEIF: 'GEMIDDELDE.ALS',
    BASE: 'BASIS',
    BIN2DEC: 'BIN.N.DEC',
    BIN2HEX: 'BIN.N.HEX',
    BIN2OCT: 'BIN.N.OCT',
    BITAND: 'BIT.EN',
    BITLSHIFT: 'BIT.VERSCHUIF.LINKS',
    BITOR: 'BIT.OF',
    BITRSHIFT: 'BIT.VERSCHUIF.RECHTS',
    BITXOR: 'BIT.EX.OF',
    CEILING: 'AFRONDEN.BOVEN',
    CHAR: 'TEKEN',
    CHOOSE: 'KIEZEN',
    CLEAN: 'WISSEN.CONTROL',
    CODE: 'CODE',
    COLUMNS: 'KOLOMMEN',
    CONCATENATE: 'TEKST.SAMENVOEGEN',
    CORREL: 'CORRELATIE',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'AANTAL',
    COUNTA: 'AANTALARG',
    COUNTBLANK: 'AANTAL.LEGE.CELLEN',
    COUNTIF: 'AANTAL.ALS',
    COUNTIFS: 'AANTALLEN.ALS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'COSEC',
    CSCH: 'COSECH',
    CUMIPMT: 'CUM.RENTE',
    CUMPRINC: 'CUM.HOOFDSOM',
    DATE: 'DATUM',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATUMWAARDE',
    DAY: 'DAG',
    DAYS360: 'DAGEN360',
    DAYS: 'DAGEN',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC.N.BIN',
    DEC2HEX: 'DEC.N.HEX',
    DEC2OCT: 'DEC.N.OCT',
    DECIMAL: 'DECIMAAL',
    DEGREES: 'GRADEN',
    DELTA: 'DELTA',
    DOLLARDE: 'EURO.DE',
    DOLLARFR: 'EURO.BR',
    EDATE: 'ZELFDE.DAG',
    EFFECT: "EFFECT.RENTE",
    EOMONTH: 'LAATSTE.DAG',
    ERF: 'FOUTFUNCTIE',
    ERFC: 'FOUT.COMPLEMENT',
    EVEN: 'EVEN',
    EXP: 'EXP',
    FALSE: 'ONWAAR',
    FIND: 'VIND.ALLES',
    FORMULATEXT: 'FORMULETEKST',
    FV: 'TW',
    HOUR: 'UUR',
    IF: 'ALS',
    IFERROR: 'ALS.FOUT',
    IFNA: 'ALS.NB',
    INDEX: 'INDEX',
    INT: 'INTEGER',
    IPMT: 'IBET',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ISLEEG',
    ISERR: 'ISFOUT2',
    ISERROR: 'ISFOUT',
    ISEVEN: 'IS.EVEN',
    ISFORMULA: 'ISFORMULE',
    ISLOGICAL: 'ISLOGISCH',
    ISNA: 'ISNB',
    ISNONTEXT: 'ISGEENTEKST',
    ISNUMBER: 'ISGETAL',
    ISODD: 'IS.ONEVEN',
    ISOWEEKNUM: 'ISO.WEEKNUMMER',
    ISPMT: 'ISBET',
    ISREF: 'ISVERWIJZING',
    ISTEXT: 'ISTEKST',
    LEFT: 'LINKS',
    LEN: 'PITUUS',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    MATCH: 'VERGELIJKEN',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUUT',
    MMULT: 'PRODUCTMAT',
    MOD: 'REST',
    MONTH: 'MAAND',
    NA: 'NB',
    NOMINAL: 'NOMINALE.RENTE',
    NOT: 'NIET',
    NOW: 'NU',
    NPER: 'NPER',
    ODD: 'ONEVEN',
    OFFSET: 'VERSCHUIVING',
    OR: 'OF',
    PI: 'PI',
    PMT: 'BET',
    POWER: 'MACHT',
    PPMT: 'PBET',
    PROPER: 'BEGINLETTERS',
    PV: 'HW',
    RADIANS: 'RADIALEN',
    RAND: 'ASELECT',
    RATE: 'RENTE',
    REPT: 'HERHALING',
    RIGHT: 'RECHTS',
    ROUND: 'AFRONDEN',
    ROUNDDOWN: 'AFRONDEN.NAAR.BENEDEN',
    ROUNDUP: 'AFRONDEN.NAAR.BOVEN',
    ROWS: 'RIJEN',
    RRI: 'RRI',
    SEARCH: 'VIND.SPEC',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECONDE',
    SHEET: 'BLAD',
    SHEETS: 'BLADEN',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LIN.AFSCHR',
    SPLIT: 'SPLIT',
    SQRT: 'WORTEL',
    SUM: 'SOM',
    SUMIF: 'SOM.ALS',
    SUMIFS: 'SOMMEN.ALS',
    SUMPRODUCT: 'SOMPRODUCT',
    SUMSQ: 'KWADRATENSOM',
    SWITCH: '',
    SYD: 'SYD',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'SCHATK.OBL',
    TBILLPRICE: 'SCHATK.PRIJS',
    TBILLYIELD: 'SCHATK.REND',
    TEXT: 'TEKST',
    TIME: 'TIJD',
    TIMEVALUE: 'TIJDWAARDE',
    TODAY: 'VANDAAG',
    TRANSPOSE: 'TRANSPONEREN',
    TRIM: 'SPATIES.WISSEN',
    TRUE: 'WAAR',
    TRUNC: 'GEHEEL',
    VLOOKUP: 'VERT.ZOEKEN',
    WEEKDAY: 'WEEKDAG',
    WEEKNUM: 'WEEKNUMMER',
    XOR: 'EX.OF',
    YEAR: 'JAAR',
    YEARFRAC: 'JAAR.DEEL',
  },
  langCode: 'nlNL',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
