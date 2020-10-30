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
    NA: '#N/D',
    NAME: '#NOME?',
    NUM: '#NUM!',
    REF: '#RIF!',
    VALUE: '#VALORE!',
  },
  functions: {
    ABS: 'ASS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ARCCOT',
    ACOTH: 'ARCCOTH',
    AND: 'E',
    ASIN: 'ARCSEN',
    ASINH: 'ARCSENH',
    ATAN2: 'ARCTAN.2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'MEDIA',
    AVERAGEA: 'MEDIA.VALORI',
    AVERAGEIF: 'MEDIA.SE',
    BASE: 'BASE',
    BIN2DEC: 'BINARIO.DECIMALE',
    BIN2HEX: 'BINARIO.HEX',
    BIN2OCT: 'BINARIO.OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BIT.SPOSTA.SX',
    BITOR: 'BITOR',
    BITRSHIFT: 'BIT.SPOSTA.DX',
    BITXOR: 'BITXOR',
    CEILING: 'ARROTONDA.ECCESSO',
    CHAR: 'CODICE.CARATT',
    CHOOSE: 'SCEGLI',
    CLEAN: 'LIBERA',
    CODE: 'CODICE',
    COLUMN: 'RIF.COLONNA',
    COLUMNS: 'COLONNE',
    CONCATENATE: 'CONCATENA',
    CORREL: 'CORRELAZIONE',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONTA.NUMERI',
    COUNTA: 'CONTA.VALORI',
    COUNTBLANK: 'CONTA.VUOTE',
    COUNTIF: 'CONTA.SE',
    COUNTIFS: 'CONTA.PIÙ.SE',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'INT.CUMUL',
    CUMPRINC: 'CAP.CUM',
    DATE: 'DATA',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATA.VALORE',
    DAY: 'GIORNO',
    DAYS360: 'GIORNO360',
    DAYS: 'GIORNI',
    DB: 'AMMORT.FISSO',
    DDB: 'AMMORT',
    DEC2BIN: 'DECIMALE.BINARIO',
    DEC2HEX: 'DECIMALE.HEX',
    DEC2OCT: 'DECIMALE.OCT',
    DECIMAL: 'DECIMALE',
    DEGREES: 'GRADI',
    DELTA: 'DELTA',
    DOLLARDE: 'VALUTA.DEC',
    DOLLARFR: 'VALUTA.FRAZ',
    EDATE: 'DATA.MESE',
    EFFECT: "EFFETTIVO",
    EOMONTH: 'FINE.MESE',
    ERF: 'FUNZ.ERRORE',
    ERFC: 'FUNZ.ERRORE.COMP',
    EVEN: 'PARI',
    EXACT: 'IDENTICO',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'TROVA',
    FORMULATEXT: 'TESTO.FORMULA',
    FV: 'VAL.FUT',
    FVSCHEDULE: 'VAL.FUT.CAPITALE',
    HEX2BIN: 'HEX.BINARIO',
    HEX2DEC: 'HEX.DECIMALE',
    HEX2OCT: 'HEX.OCT',
    HLOOKUP: 'CERCA.ORIZZ',
    HOUR: 'ORA',
    IF: 'SE',
    IFERROR: 'SE.ERRORE',
    IFNA: 'SE.NON.DISP.',
    INDEX: 'INDICE',
    INT: 'INT',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'INTERESSI',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'VAL.VUOTO',
    ISERR: 'VAL.ERR',
    ISERROR: 'VAL.ERRORE',
    ISEVEN: 'VAL.PARI',
    ISFORMULA: 'VAL.FORMULA',
    ISLOGICAL: 'VAL.LOGICO',
    ISNA: 'VAL.NON.DISP',
    ISNONTEXT: 'VAL.NON.TESTO',
    ISNUMBER: 'VAL.NUMERO',
    ISODD: 'VAL.DISPARI',
    ISOWEEKNUM: 'NUM.SETTIMANA.ISO',
    ISPMT: 'INTERESSE.RATA',
    ISREF: 'VAL.RIF',
    ISTEXT: 'VAL.TESTO',
    LEFT: 'SINISTRA',
    LEN: 'LUNGHEZZA',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINUSC',
    MATCH: 'CONFRONTA',
    MAX: 'MAX',
    MAXA: 'MAX.VALORI',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'STRINGA.ESTRAI',
    MIN: 'MIN',
    MINA: 'MIN.VALORI',
    MINUTE: 'MINUTO',
    MIRR: 'TIR.VAR',
    MMULT: 'MATR.PRODOTTO',
    MOD: 'RESTO',
    MONTH: 'MESE',
    NA: 'NON.DISP',
    NETWORKDAYS: 'GIORNI.LAVORATIVI.TOT',
    'NETWORKDAYS.INTL': 'GIORNI.LAVORATIVI.TOT.INTL',
    NOMINAL: 'NOMINALE',
    NOT: 'NON',
    NOW: 'ADESSO',
    NPER: 'NUM.RATE',
    NPV: 'VAN',
    OCT2BIN: 'OCT.BINARIO',
    OCT2DEC: 'OCT.DECIMALE',
    OCT2HEX: 'OCT.HEX',
    ODD: 'DISPARI',
    OFFSET: 'SCARTO',
    OR: 'O',
    PDURATION: 'DURATA.P',
    PI: 'PI.GRECO',
    PMT: 'RATA',
    PRODUCT: 'PRODOTTO',
    POWER: 'POTENZA',
    PPMT: 'P.RATA',
    PROPER: 'MAIUSC.INIZ',
    PV: 'VA',
    RADIANS: 'RADIANTI',
    RAND: 'CASUALE',
    RATE: 'TASSO',
    REPLACE: 'RIMPIAZZA',
    REPT: 'RIPETI',
    RIGHT: 'DESTRA',
    ROUND: 'ARROTONDA',
    ROUNDDOWN: 'ARROTONDA.PER.DIF',
    ROUNDUP: 'ARROTONDA.PER.ECC',
    ROW: 'RIF.RIGA',
    ROWS: 'RIGHE',
    RRI: 'RIT.INVEST.EFFETT',
    SEARCH: 'RICERCA',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SECONDO',
    SHEET: 'FOGLIO',
    SHEETS: 'FOGLI',
    SIN: 'SEN',
    SINH: 'SENH',
    SLN: 'AMMORT.COST',
    SPLIT: 'SPLIT',
    SQRT: 'RADQ',
    STDEVA: 'DEV.ST.VALORI',
    'STDEV.P': 'DEV.ST.P',
    STDEVPA: 'DEV.ST.POP.VALORI',
    'STDEV.S': 'DEV.ST.C',
    SUBSTITUTE: 'SOSTITUISCI',
    SUBTOTAL: 'SUBTOTALE',
    SUM: 'SOMMA',
    SUMIF: 'SOMMA.SE',
    SUMIFS: 'SOMMA.PIÙ.SE',
    SUMPRODUCT: 'MATR.SOMMA.PRODOTTO',
    SUMSQ: 'SOMMA.Q',
    SWITCH: '',
    SYD: 'AMMORT.ANNUO',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'BOT.EQUIV',
    TBILLPRICE: 'BOT.PREZZO',
    TBILLYIELD: 'BOT.REND',
    TEXT: 'TESTO',
    TIME: 'ORARIO',
    TIMEVALUE: 'ORARIO.VALORE',
    TODAY: 'OGGI',
    TRANSPOSE: 'MATR.TRASPOSTA',
    TRIM: 'ANNULLA.SPAZI',
    TRUE: 'VERO',
    TRUNC: 'TRONCA',
    UNICHAR: 'CARATT.UNI',
    UNICODE: 'UNICODE',
    UPPER: 'MAIUSC',
    VARA: 'VAR.VALORI',
    'VAR.P': 'VAR.P',
    VARPA: 'VAR.POP.VALORI',
    'VAR.S': 'VAR.C',
    VLOOKUP: 'CERCA.VERT',
    WEEKDAY: 'GIORNO.SETTIMANA',
    WEEKNUM: 'NUM.SETTIMANA',
    WORKDAY: 'GIORNO.LAVORATIVO',
    'WORKDAY.INTL': 'GIORNO.LAVORATIVO.INTL',
    XNPV: 'VAN.X',
    XOR: 'XOR',
    YEAR: 'ANNO',
    YEARFRAC: 'FRAZIONE.ANNO',
    ROMAN: 'ROMANO',
    ARABIC: 'ARABO',
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
    VAR: 'VAR',
    VARP: 'VAR.POP',
    STDEV: 'DEV.ST',
    STDEVP: 'DEV.ST.POP',
    FACT: 'FATTORIALE',
    FACTDOUBLE: 'FATT.DOPPIO',
    COMBIN: 'COMBINAZIONE',
    COMBINA: 'COMBINAZIONE.VALORI',
    GCD: 'MCD',
    LCM: 'MCM',
    MROUND: 'ARROTONDA.MULTIPLO',
    MULTINOMIAL: 'MULTINOMIALE',
    QUOTIENT: 'QUOZIENTE',
    RANDBETWEEN: 'CASUALE.TRA',
    SERIESSUM: 'SOMMA.SERIE',
    SIGN: 'SEGNO',
    SQRTPI: 'RADQ.PI.GRECO',
    SUMX2MY2: 'SOMMA.DIFF.Q',
    SUMX2PY2: 'SOMMA.SOMMA.Q',
    SUMXMY2: 'SOMMA.Q.DIFF',
    'EXPON.DIST': 'DISTRIB.EXP.N',
    EXPONDIST: 'DISTRIB.EXP',
    FISHER: 'FISHER',
    FISHERINV: 'INV.FISHER',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'DISTRIB.GAMMA.N',
    'GAMMA.INV': 'INV.GAMMA.N',
    GAMMADIST: 'DISTRIB.GAMMA',
    GAMMAINV: 'INV.GAMMA',
    GAMMALN: 'LN.GAMMA',
    'GAMMALN.PRECISE': 'LN.GAMMA.PRECISA',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'DISTRIB.BETA.N',
    BETADIST: 'DISTRIB.BETA',
    'BETA.INV': 'INV.BETA.N',
    BETAINV: 'INV.BETA',
    'BINOM.DIST': 'DISTRIB.BINOM.N',
    BINOMDIST: 'DISTRIB.BINOM',
    'BINOM.INV': 'INV.BINOM',
    BESSELI: 'BESSEL.I',
    BESSELJ: 'BESSEL.J',
    BESSELK: 'BESSEL.K',
    BESSELY: 'BESSEL.Y',
    CHIDIST: 'DISTRIB.CHI',
    CHIINV: 'INV.CHI',
    'CHISQ.DIST': 'DISTRIB.CHI.QUAD',
    'CHISQ.DIST.RT': 'DISTRIB.CHI.QUAD.DS',
    'CHISQ.INV': 'INV.CHI.QUAD',
    'CHISQ.INV.RT': 'INV.CHI.QUAD.DS',
    'F.DIST': 'DISTRIBF',
    'F.DIST.RT': 'DISTRIB.F.DS',
    'F.INV': 'INVF',
    'F.INV.RT': 'INV.F.DS',
    FDIST: 'DISTRIB.F',
    FINV: 'INV.F',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'DISTRIB.WEIBULL',
    POISSON: 'POISSON',
    'POISSON.DIST': 'DISTRIB.POISSON',
  },
  langCode: 'itIT',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
