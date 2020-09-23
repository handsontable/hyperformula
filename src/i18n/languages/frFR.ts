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
    NAME: '#NOM?',
    NUM: '#NOMBRE!',
    REF: '#REF!',
    VALUE: '#VALEUR!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'ET',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'MOYENNE',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'MOYENNE.SI',
    BASE: 'BASE',
    BIN2DEC: 'BINDEC',
    BIN2HEX: 'BINHEX',
    BIN2OCT: 'BINOCT',
    BITAND: 'BITET',
    BITLSHIFT: 'BITDECALG',
    BITOR: 'BITOU',
    BITRSHIFT: 'BITDECALD',
    BITXOR: 'BITOUEXCLUSIF',
    CEILING: 'PLAFOND',
    CHAR: 'CAR',
    CHOOSE: 'CHOISIR',
    CLEAN: 'EPURAGE',
    CODE: 'CODE',
    COLUMNS: 'COLONNES',
    CONCATENATE: 'CONCATENER',
    CORREL: 'COEFFICIENT.CORRELATION',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'NB',
    COUNTA: 'NBVAL',
    COUNTBLANK: 'NB.VIDE',
    COUNTIF: 'NB.SI',
    COUNTIFS: 'NB.SI.ENS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'CUMUL.INTER',
    CUMPRINC: 'CUMUL.PRINCPER',
    DATE: 'DATE',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATEVAL',
    DAY: 'JOUR',
    DAYS360: 'JOURS360',
    DAYS: 'JOURS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DECBIN',
    DEC2HEX: 'DECHEX',
    DEC2OCT: 'DECOCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'DEGRES',
    DELTA: 'DELTA',
    DOLLARDE: 'PRIX.DEC',
    DOLLARFR: 'PRIX.FRAC',
    EDATE: 'MOIS.DECALER',
    EFFECT: "TAUX.EFFECTIF",
    EOMONTH: 'FIN.MOIS',
    ERF: 'ERF',
    ERFC: 'ERFC',
    EVEN: 'PAIR',
    EXP: 'EXP',
    FALSE: 'FAUX',
    FIND: 'TROUVE',
    FORMULATEXT: 'FORMULETEXTE',
    FV: 'VC',
    HEX2BIN: 'HEXBIN',
    HEX2DEC: 'HEXDEC',
    HEX2OCT: 'HEXOCT',
    HOUR: 'HEURE',
    IF: 'SI',
    IFERROR: 'SIERREUR',
    IFNA: 'SI.NON.DISP',
    INDEX: 'INDEX',
    INT: 'ENT',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'INTPER',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ESTVIDE',
    ISERR: 'ESTERR',
    ISERROR: 'ESTERREUR',
    ISEVEN: 'EST.PAIR',
    ISFORMULA: 'ESTFORMULE',
    ISLOGICAL: 'ESTLOGIQUE',
    ISNA: 'ESTNA',
    ISNONTEXT: 'ESTNONTEXTE',
    ISNUMBER: 'ESTNUM',
    ISODD: 'EST.IMPAIR',
    ISOWEEKNUM: 'NO.SEMAINE.ISO',
    ISPMT: 'ISPMT',
    ISREF: 'ESTREF',
    ISTEXT: 'ESTTEXTE',
    LEFT: 'GAUCHE',
    LEN: 'NBCAR',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    MATCH: 'EQUIV',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANE',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTE',
    MMULT: 'PRODUITMAT',
    MOD: 'MOD',
    MONTH: 'MOIS',
    NA: 'NA',
    NOMINAL: 'TAUX.NOMINAL',
    NOT: 'NON',
    NOW: 'MAINTENANT',
    NPER: 'NPM',
    OCT2BIN: 'OCTBIN',
    OCT2DEC: 'OCTDEC',
    OCT2HEX: 'OCTHEX',
    ODD: 'IMPAIR',
    OFFSET: 'DECALER',
    OR: 'OU',
    PI: 'PI',
    PMT: 'VPM',
    POWER: 'PUISSANCE',
    PPMT: 'PRINCPER',
    PROPER: 'NOMPROPRE',
    PV: 'VA',
    RADIANS: 'RADIANS',
    RAND: 'ALEA',
    RATE: 'TAUX',
    REPT: 'REPT',
    RIGHT: 'DROITE',
    ROUND: 'ARRONDI',
    ROUNDDOWN: 'ARRONDI.INF',
    ROUNDUP: 'ARRONDI.SUP',
    ROWS: 'LIGNES',
    RRI: 'TAUX.INT.EQUIV',
    SEARCH: 'CHERCHE',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECONDE',
    SHEET: 'FEUILLE',
    SHEETS: 'FEUILLES',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'AMORLIN',
    SPLIT: 'SPLIT',
    SQRT: 'RACINE',
    SUM: 'SOMME',
    SUMIF: 'SOMME.SI',
    SUMIFS: 'SOMME.SI.ENS',
    SUMPRODUCT: 'SOMMEPROD',
    SUMSQ: 'SOMME.CARRES',
    SWITCH: '',
    SYD: 'SYD',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'TAUX.ESCOMPTE.R',
    TBILLPRICE: 'PRIX.BON.TRESOR',
    TBILLYIELD: 'RENDEMENT.BON.TRESOR',
    TEXT: 'TEXTE',
    TIME: 'TEMPS',
    TIMEVALUE: 'TEMPSVAL',
    TODAY: 'AUJOURDHUI',
    TRANSPOSE: 'TRANSPOSE',
    TRIM: 'SUPPRESPACE',
    TRUE: 'VRAI',
    TRUNC: 'TRONQUE',
    VLOOKUP: 'RECHERCHEV',
    WEEKDAY: 'JOURSEM',
    WEEKNUM: 'NO.SEMAINE',
    XOR: 'OUX',
    YEAR: 'ANNEE',
    YEARFRAC: 'FRACTION.ANNEE',
  },
  langCode: 'frFR',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
