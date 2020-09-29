/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#JAKO/0!',
    ERROR: '#ERROR!',
    NA: '#PUUTTUU!',
    NAME: '#NIMI?',
    NUM: '#LUKU!',
    REF: '#VIITTAUS!',
    VALUE: '#ARVO!',
  },
  functions: {
    ABS: 'ITSEISARVO',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'JA',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'KESKIARVO',
    AVERAGEA: 'KESKIARVOA',
    AVERAGEIF: 'KESKIARVO.JOS',
    BASE: 'PERUS',
    BIN2DEC: 'BINDES',
    BIN2HEX: 'BINHEKSA',
    BIN2OCT: 'BINOKT',
    BITAND: 'BITTI.JA',
    BITLSHIFT: 'BITTI.SIIRTO.V',
    BITOR: 'BITTI.TAI',
    BITRSHIFT: 'BITTI.SIIRTO.O',
    BITXOR: 'BITTI.EHDOTON.TAI',
    CEILING: 'PYÖRISTÄ.KERR.YLÖS',
    CHAR: 'MERKKI',
    CHOOSE: 'VALITSE.INDEKSI',
    CLEAN: 'SIIVOA',
    CODE: 'KOODI',
    COLUMNS: 'SARAKKEET',
    CONCATENATE: 'KETJUTA',
    CORREL: 'KORRELAATIO',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'LASKE',
    COUNTA: 'LASKE.A',
    COUNTBLANK: 'LASKE.TYHJÄT',
    COUNTIF: 'LASKE.JOS',
    COUNTIFS: 'LASKE.JOS.JOUKKO',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'KOSEK',
    CSCH: 'KOSEKH',
    CUMIPMT: 'MAKSETTU.KORKO',
    CUMPRINC: 'MAKSETTU.LYHENNYS',
    DATE: 'PÄIVÄYS',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'PÄIVÄYSARVO',
    DAY: 'PÄIVÄ',
    DAYS360: 'PÄIVÄT360',
    DAYS: 'PV',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DESBIN',
    DEC2HEX: 'DESHEKSA',
    DEC2OCT: 'DESOKT',
    DECIMAL: 'DESIMAALI',
    DEGREES: 'ASTEET',
    DELTA: 'SAMA.ARVO',
    DOLLARDE: 'VALUUTTA.DES',
    DOLLARFR: 'VALUUTTA.MURTO',
    EDATE: 'PÄIVÄ.KUUKAUSI',
    EFFECT: "KORKO.EFEKT",
    EOMONTH: 'KUUKAUSI.LOPPU',
    ERF: 'VIRHEFUNKTIO',
    ERFC: 'VIRHEFUNKTIO.KOMPLEMENTTI',
    EVEN: 'PARILLINEN',
    EXACT: 'VERTAA',
    EXP: 'EKSPONENTTI',
    FALSE: 'EPÄTOSI',
    FIND: 'ETSI',
    FORMULATEXT: 'KAAVA.TEKSTI',
    FV: 'TULEVA.ARVO',
    HEX2BIN: 'HEKSABIN',
    HEX2DEC: 'HEKSADES',
    HEX2OCT: 'HEKSAOKT',
    HOUR: 'TUNNIT',
    IF: 'JOS',
    IFERROR: 'JOSVIRHE',
    IFNA: 'JOSPUUTTUU',
    INDEX: 'INDEKSI',
    INT: 'KOKONAISLUKU',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'IPMT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ONTYHJÄ',
    ISERR: 'ONVIRH',
    ISERROR: 'ONVIRHE',
    ISEVEN: 'ONPARILLINEN',
    ISFORMULA: 'ONKAAVA',
    ISLOGICAL: 'ONTOTUUS',
    ISNA: 'ONPUUTTUU',
    ISNONTEXT: 'ONEI_TEKSTI',
    ISNUMBER: 'ONLUKU',
    ISODD: 'ONPARITON',
    ISOWEEKNUM: 'VIIKKO.ISO.NRO',
    ISPMT: 'ISPMT',
    ISREF: 'ONVIITT',
    ISTEXT: 'ONTEKSTI',
    LEFT: 'VASEN',
    LEN: 'PITUUS',
    LN: 'LUONNLOG',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'PIENET',
    MATCH: 'VASTINE',
    MAX: 'MAKS',
    MAXA: 'MAKSA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAANI',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'POIMI.TEKSTI',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUUTIT',
    MMULT: 'MKERRO',
    MOD: 'JAKOJ',
    MONTH: 'KUUKAUSI',
    NA: 'PUUTTUU',
    NETWORKDAYS: 'TYÖPÄIVÄT',
    'NETWORKDAYS.INTL': 'TYÖPÄIVÄT.KANSVÄL',
    NOMINAL: 'KORKO.VUOSI',
    NOT: 'EI',
    NOW: 'NYT',
    NPER: 'NJAKSO',
    OCT2BIN: 'OKTBIN',
    OCT2DEC: 'OKTDES',
    OCT2HEX: 'OKTHEKSA',
    ODD: 'PARITON',
    OFFSET: 'SIIRTYMÄ',
    OR: 'TAI',
    PI: 'PII',
    PMT: 'MAKSU',
    SUBSTITUTE: 'VAIHDA',
    POWER: 'POTENSSI',
    PPMT: 'PPMT',
    PROPER: 'ERISNIMI',
    PV: 'NA',
    RADIANS: 'RADIAANIT',
    RAND: 'SATUNNAISLUKU',
    RATE: 'KORKO',
    REPT: 'TOISTA',
    RIGHT: 'OIKEA',
    ROUND: 'PYÖRISTÄ',
    ROUNDDOWN: 'PYÖRISTÄ.DES.ALAS',
    ROUNDUP: 'PYÖRISTÄ.DES.YLÖS',
    ROWS: 'RIVIT',
    RRI: 'TOT.ROI',
    SEARCH: 'KÄY.LÄPI',
    SEC: 'SEK',
    SECH: 'SEKH',
    SECOND: 'SEKUNNIT',
    SHEET: 'TAULUKKO',
    SHEETS: 'TAULUKOT',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'STP',
    SPLIT: 'SPLIT',
    SQRT: 'NELIÖJUURI',
    SUM: 'SUMMA',
    SUMIF: 'SUMMA.JOS',
    SUMIFS: 'SUMMA.JOS.JOUKKO',
    SUMPRODUCT: 'TULOJEN.SUMMA',
    SUMSQ: 'NELIÖSUMMA',
    SWITCH: '',
    SYD: 'VUOSIPOISTO',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'OBLIG.TUOTTOPROS',
    TBILLPRICE: 'OBLIG.HINTA',
    TBILLYIELD: 'OBLIG.TUOTTO',
    TEXT: 'TEKSTI',
    TIME: 'AIKA',
    TIMEVALUE: 'AIKA_ARVO',
    TODAY: 'TÄMÄ.PÄIVÄ',
    TRANSPOSE: 'TRANSPONOI',
    TRIM: 'POISTA.VÄLIT',
    TRUE: 'TOSI',
    TRUNC: 'KATKAISE',
    UNICHAR: 'UNICODEMERKKI',
    UNICODE: 'UNICODE',
    UPPER: 'ISOT',
    VLOOKUP: 'PHAKU',
    WEEKDAY: 'VIIKONPÄIVÄ',
    WEEKNUM: 'VIIKKO.NRO',
    XOR: 'EHDOTON.TAI',
    YEAR: 'VUOSI',
    YEARFRAC: 'VUOSI.OSA',
    REPLACE: 'KORVAA',
  },
  langCode: 'fiFI',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
