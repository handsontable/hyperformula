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
    FVSCHEDULE: 'ZW2',
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
    MIRR: 'QIKV',
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
    NPV: 'NBW',
    OCT2BIN: 'OKTINBIN',
    OCT2DEC: 'OKTINDEZ',
    OCT2HEX: 'OKTINHEX',
    ODD: 'UNGERADE',
    OFFSET: 'BEREICH.VERSCHIEBEN',
    OR: 'ODER',
    PDURATION: 'PDURATION',
    PI: 'PI',
    PMT: 'RMZ',
    PRODUCT: 'PRODUKT',
    POWER: 'POTENZ',
    PPMT: 'KAPZ',
    PROPER: 'GROSS2',
    PV: 'BW',
    RADIANS: 'BOGENMASS',
    RAND: 'ZUFALLSZAHL',
    RATE: 'ZINS',
    REPLACE: 'ERSETZEN',
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
    STDEVA: 'STABWA',
    'STDEV.P': 'STABW.N',
    STDEVPA: 'STABWNA',
    'STDEV.S': 'STABW.S',
    SUBSTITUTE: 'WECHSELN',
    SUBTOTAL: 'TEILERGEBNIS',
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
    VARA: 'VARIANZA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARIANZENA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'SVERWEIS',
    WEEKDAY: 'WOCHENTAG',
    WEEKNUM: 'KALENDERWOCHE',
    WORKDAY: 'ARBEITSTAG',
    'WORKDAY.INTL': 'ARBEITSTAG.INTL',
    XNPV: 'XKAPITALWERT',
    XOR: 'XODER',
    YEAR: 'JAHR',
    YEARFRAC: 'BRTEILJAHRE',
    ROMAN: 'RÖMISCH',
    ARABIC: 'ARABISCH',
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
    VAR: 'VARIANZ',
    VARP: 'VARIANZEN',
    STDEV: 'STABW',
    STDEVP: 'STABWN',
    FACT: 'FAKULTÄT',
    FACTDOUBLE: 'ZWEIFAKULTÄT',
    COMBIN: 'KOMBINATIONEN',
    COMBINA: 'KOMBINA',
    GCD: 'GGT',
    LCM: 'KGV',
    MROUND: 'VRUNDEN',
    MULTINOMIAL: 'POLYNOMIAL',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'ZUFALLSBEREICH',
    SERIESSUM: 'POTENZREIHE',
    SIGN: 'VORZEICHEN',
    SQRTPI: 'WURZELPI',
    SUMX2MY2: 'SUMMEX2MY2',
    SUMX2PY2: 'SUMMEX2PY2',
    SUMXMY2: 'SUMMEXMY2',
    'EXPON.DIST': 'EXPON.VERT',
    EXPONDIST: 'EXPONVERT',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.VERT',
    'GAMMA.INV': 'GAMMA.INV',
    GAMMADIST: 'GAMMAVERT',
    GAMMAINV: 'GAMMAINV',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.GENAU',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.VERT',
    BETADIST: 'BETAVERT',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOM.VERT',
    BINOMDIST: 'BINOMVERT',
    'BINOM.INV': 'BINOM.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'CHIVERT',
    CHIINV: 'CHIINV',
    'CHISQ.DIST': 'CHIQU.VERT',
    'CHISQ.DIST.RT': 'CHIQU.VERT.RE',
    'CHISQ.INV': 'CHIQU.INV',
    'CHISQ.INV.RT': 'CHIQU.INV.RE',
    'F.DIST': 'F.VERT',
    'F.DIST.RT': 'F.VERT.RE',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RE',
    FDIST: 'FVERT',
    FINV: 'FINV',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.VERT',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.VERT',
    'HYPGEOM.DIST': 'HYPGEOM.VERT',
    HYPGEOMDIST: 'HYPGEOMVERT',
    'T.DIST': 'T.VERT',
    'T.DIST.2T': 'T.VERT.2S',
    'T.DIST.RT': 'T.VERT.RE',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2S',
    TDIST: 'TVERT',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.VERT',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMVERT',
    'NORM.DIST': 'NORM.VERT',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'NORM.S.VERT',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORMVERT',
    NORMINV: 'NORMINV',
    NORMSDIST: 'STANDNORMVERT',
    NORMSINV: 'STANDNORMINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.VERT',
    NEGBINOMDIST: 'NEGBINOMVERT',
    LARGE: 'KGRÖSSTE',
    SMALL: 'KKLEINSTE',
    AVEDEV: 'MITTELABW',
  },
  langCode: 'deDE',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
