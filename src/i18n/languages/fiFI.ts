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
    ATAN: 'ATAN',
    ATAN2: 'ATAN2',
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
    DAY: 'PÄIVÄ',
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
    EFFECT: "KORKO.EFEKT",
    EOMONTH: 'KUUKAUSI.LOPPU',
    ERF: 'VIRHEFUNKTIO',
    ERFC: 'VIRHEFUNKTIO.KOMPLEMENTTI',
    EVEN: 'PARILLINEN',
    EXP: 'EKSPONENTTI',
    FALSE: 'EPÄTOSI',
    FIND: 'ETSI',
    FORMULATEXT: 'KAAVA.TEKSTI',
    FV: 'TULEVA.ARVO',
    IF: 'JOS',
    IFERROR: 'JOSVIRHE',
    IFNA: 'JOSPUUTTUU',
    INDEX: 'INDEKSI',
    INT: 'KOKONAISLUKU',
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
    ISPMT: 'ISPMT',
    ISREF: 'ONVIITT',
    ISTEXT: 'ONTEKSTI',
    LEFT: 'VASEN',
    LEN: 'PITUUS',
    LN: 'LUONNLOG',
    LOG: 'LOG',
    LOG10: 'LOG10',
    MATCH: 'VASTINE',
    MAX: 'MAKS',
    MAXA: 'MAKSA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAANI',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MMULT: 'MKERRO',
    MOD: 'JAKOJ',
    MONTH: 'KUUKAUSI',
    NA: 'PUUTTUU',
    NOMINAL: 'KORKO.VUOSI',
    NOT: 'EI',
    NPER: 'NJAKSO',
    ODD: 'PARITON',
    OFFSET: 'SIIRTYMÄ',
    OR: 'TAI',
    PI: 'PII',
    PMT: 'MAKSU',
    POWER: 'POTENSSI',
    PPMT: 'PPMT',
    PROPER: 'ERISNIMI',
    RADIANS: 'RADIAANIT',
    RAND: 'SATUNNAISLUKU',
    REPT: 'TOISTA',
    RIGHT: 'OIKEA',
    ROUND: 'PYÖRISTÄ',
    ROUNDDOWN: 'PYÖRISTÄ.DES.ALAS',
    ROUNDUP: 'PYÖRISTÄ.DES.YLÖS',
    ROWS: 'RIVIT',
    SEARCH: 'KÄY.LÄPI',
    SEC: 'SEK',
    SECH: 'SEKH',
    SHEETS: 'TAULUKOT',
    SHEET: 'TAULUKKO',
    SIN: 'SIN',
    SINH: 'SINH',
    SPLIT: 'SPLIT',
    SQRT: 'NELIÖJUURI',
    SUM: 'SUMMA',
    SUMIF: 'SUMMA.JOS',
    SUMIFS: 'SUMMA.JOS.JOUKKO',
    SUMPRODUCT: 'TULOJEN.SUMMA',
    SUMSQ: 'NELIÖSUMMA',
    SWITCH: '',
    TAN: 'TAN',
    TANH: 'TANH',
    TEXT: 'TEKSTI',
    TRANSPOSE: 'TRANSPONOI',
    TRIM: 'POISTA.VÄLIT',
    TRUE: 'TOSI',
    TRUNC: 'KATKAISE',
    VLOOKUP: 'PHAKU',
    XOR: 'EHDOTON.TAI',
    YEAR: 'VUOSI',
  },
  langCode: 'fiFI',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
