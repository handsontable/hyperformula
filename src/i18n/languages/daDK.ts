/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIVISION/0!',
    ERROR: '#ERROR!',
    NA: '#I/T',
    NAME: '#NAVN?',
    NUM: '#NUMMER!',
    REF: '#REFERENCE!',
    VALUE: '#VÆRDI!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ARCCOT',
    ACOTH: 'ARCCOTH',
    AND: 'OG',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTAN2',
    ATAN: 'ARCTAN',
    ATANH: 'ARCTANH',
    AVERAGE: 'MIDDEL',
    AVERAGEA: 'MIDDELV',
    AVERAGEIF: 'MIDDEL.HVIS',
    BASE: 'BASIS',
    BIN2DEC: 'BIN.TIL.DEC',
    BIN2HEX: 'BIN.TIL.HEX',
    BIN2OCT: 'BIN.TIL.OKT',
    BITAND: 'BITOG',
    BITLSHIFT: 'BITLSKIFT',
    BITOR: 'BITELLER',
    BITRSHIFT: 'BITRSKIFT',
    BITXOR: 'BITXELLER',
    CEILING: 'AFRUND.LOFT',
    CHAR: 'CHAR',
    CHOOSE: 'VÆLG',
    CLEAN: 'RENS',
    CODE: 'KODE',
    COLUMN: 'KOLONNE',
    COLUMNS: 'KOLONNER',
    CONCATENATE: 'SAMMENKÆDNING',
    CORREL: 'KORRELATION',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'TÆL',
    COUNTA: 'TÆLV',
    COUNTBLANK: 'ANTAL.BLANKE',
    COUNTIF: 'TÆL.HVIS',
    COUNTIFS: 'TÆL.HVISER',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'AKKUM.RENTE',
    CUMPRINC: 'AKKUM.HOVEDSTOL',
    DATE: 'DATO',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATOVÆRDI',
    DAY: 'DAG',
    DAYS360: 'DAGE360',
    DAYS: 'DAGE',
    DB: 'DB',
    DDB: 'DSA',
    DEC2BIN: 'DEC.TIL.BIN',
    DEC2HEX: 'DEC.TIL.HEX',
    DEC2OCT: 'DEC.TIL.OKT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRADER',
    DELTA: 'DELTA',
    DOLLARDE: 'KR.DECIMAL',
    DOLLARFR: 'KR.BRØK',
    EDATE: 'EDATO',
    EFFECT: "EFFEKTIV.RENTE",
    EOMONTH: 'SLUT.PÅ.MÅNED',
    ERF: 'FEJLFUNK',
    ERFC: 'FEJLFUNK.KOMP',
    EVEN: 'LIGE',
    EXACT: 'EKSAKT',
    EXP: 'EKSP',
    FALSE: 'FALSE',
    FIND: 'FIND',
    FORMULATEXT: 'FORMELTEKST',
    FV: 'FV',
    FVSCHEDULE: 'FVTABEL',
    HEX2BIN: 'HEX.TIL.BIN',
    HEX2DEC: 'HEX.TIL.DEC',
    HEX2OCT: 'HEX.TIL.OKT',
    HLOOKUP: 'VOPSLAG',
    HOUR: 'TIME',
    IF: 'HVIS',
    IFERROR: 'HVIS.FEJL',
    IFNA: 'HVISIT',
    INDEX: 'INDEKS',
    INT: 'HELTAL',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'R.YDELSE',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ER.TOM',
    ISERR: 'ER.FJL',
    ISERROR: 'ER.FEJL',
    ISEVEN: 'ER.LIGE',
    ISFORMULA: 'ER.FORMEL',
    ISLOGICAL: 'ER.LOGISK',
    ISNA: 'ER.IKKE.TILGÆNGELIG',
    ISNONTEXT: 'ER.IKKE.TEKST',
    ISNUMBER: 'ER.TAL',
    ISODD: 'ER.ULIGE',
    ISOWEEKNUM: 'ISOUGE.NR',
    ISPMT: 'ISPMT',
    ISREF: 'ER.REFERENCE',
    ISTEXT: 'ER.TEKST',
    LEFT: 'VENSTRE',
    LEN: 'LÆNGDE',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'SMÅ.BOGSTAVER',
    MATCH: 'SAMMENLIGN',
    MAX: 'MAKS',
    MAXA: 'MAKSV',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'MIDT',
    MIN: 'MIN',
    MINA: 'MINV',
    MINUTE: 'MINUT',
    MIRR: 'MIA',
    MMULT: 'MPRODUKT',
    MOD: 'REST',
    MONTH: 'MÅNED',
    NA: 'IKKE.TILGÆNGELIG',
    NETWORKDAYS: 'ANTAL.ARBEJDSDAGE',
    'NETWORKDAYS.INTL': 'ANTAL.ARBEJDSDAGE.INTL',
    NOMINAL: 'NOMINEL',
    NOT: 'IKKE',
    NOW: 'NU',
    NPER: 'NPER',
    NPV: 'NUTIDSVÆRDI',
    OCT2BIN: 'OKT.TIL.BIN',
    OCT2DEC: 'OKT.TIL.DEC',
    OCT2HEX: 'OKT.TIL.HEX',
    ODD: 'ULIGE',
    OFFSET: 'FORSKYDNING',
    OR: 'ELLER',
    PDURATION: 'PVARIGHED',
    PI: 'PI',
    PMT: 'YDELSE',
    PRODUCT: 'PRODUKT',
    POWER: 'POTENS',
    PPMT: 'H.YDELSE',
    PROPER: 'STORT.FORBOGSTAV',
    PV: 'NV',
    RADIANS: 'RADIANER',
    RAND: 'SLUMP',
    RATE: 'RENTE',
    REPLACE: 'ERSTAT',
    REPT: 'GENTAG',
    RIGHT: 'HØJRE',
    ROUND: 'AFRUND',
    ROUNDDOWN: 'RUND.NED',
    ROUNDUP: 'RUND.OP',
    ROW: 'RÆKKE',
    ROWS: 'RÆKKER',
    RRI: 'RRI',
    SEARCH: 'SØG',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUND',
    SHEET: 'ARK',
    SHEETS: 'ARK.FLERE',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'LA',
    SPLIT: 'SPLIT',
    SQRT: 'KVROD',
    STDEVA: 'STDAFVV',
    'STDEV.P': 'STDAFV.P',
    STDEVPA: 'STDAFVPV',
    'STDEV.S': 'STDAFV.S',
    SUBSTITUTE: 'UDSKIFT',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SUM',
    SUMIF: 'SUM.HVIS',
    SUMIFS: 'SUM.HVISER',
    SUMPRODUCT: 'SUMPRODUKT',
    SUMSQ: 'SUMKV',
    SWITCH: '',
    SYD: 'ÅRSAFSKRIVNING',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'STATSOBLIGATION',
    TBILLPRICE: 'STATSOBLIGATION.KURS',
    TBILLYIELD: 'STATSOBLIGATION.AFKAST',
    TEXT: 'TEKST',
    TIME: 'TID',
    TIMEVALUE: 'TIDSVÆRDI',
    TODAY: 'IDAG',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'FJERN.OVERFLØDIGE.BLANKE',
    TRUE: 'TRUE',
    TRUNC: 'AFKORT',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'STORE.BOGSTAVER',
    VARA: 'VARIANSV',
    'VAR.P': 'VARIANS.P',
    VARPA: 'VARIANSPV',
    'VAR.S': 'VARIANS.S',
    VLOOKUP: 'LOPSLAG',
    WEEKDAY: 'UGEDAG',
    WEEKNUM: 'UGE.NR',
    WORKDAY: 'ARBEJDSDAG',
    'WORKDAY.INTL': 'ARBEJDSDAG.INTL',
    XNPV: 'NETTO.NUTIDSVÆRDI',
    XOR: 'XELLER',
    YEAR: 'ÅR',
    YEARFRAC: 'ÅR.BRØK',
    ROMAN: 'ROMERTAL',
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
    STDEV: 'STDAFV',
    STDEVP: 'STDAFVP',
    FACT: 'FAKULTET',
    FACTDOUBLE: 'DOBBELT.FAKULTET',
    COMBIN: 'KOMBIN',
    COMBINA: 'KOMBINA',
    GCD: 'STØRSTE.FÆLLES.DIVISOR',
    LCM: 'MINDSTE.FÆLLES.MULTIPLUM',
    MROUND: 'MAFRUND',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'KVOTIENT',
    RANDBETWEEN: 'SLUMPMELLEM',
    SERIESSUM: 'SERIESUM',
    SIGN: 'FORTEGN',
    SQRTPI: 'KVRODPI',
    SUMX2MY2: 'SUMX2MY2',
    SUMX2PY2: 'SUMX2PY2',
    SUMXMY2: 'SUMXMY2',
    'EXPON.DIST': 'EKSP.FORDELING',
    EXPONDIST: 'EKSPFORDELING',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.FORDELING',
    'GAMMA.INV': 'GAMMA.INV',
    GAMMADIST: 'GAMMAFORDELING',
    GAMMAINV: 'GAMMAINV',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.PRECISE',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.FORDELING',
    BETADIST: 'BETAFORDELING',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOMIAL.FORDELING',
    BINOMDIST: 'BINOMIALFORDELING',
    'BINOM.INV': 'BINOMIAL.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'CHIFORDELING',
    CHIINV: 'CHIINV',
    'CHISQ.DIST': 'CHI2.FORDELING',
    'CHISQ.DIST.RT': 'CHI2.FORD.RT',
    'CHISQ.INV': 'CHI2.INV',
    'CHISQ.INV.RT': 'CHI2.INV.RT',
    'F.DIST': 'F.FORDELING',
    'F.DIST.RT': 'F.FORDELING.RT',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RT',
    FDIST: 'FFORDELING',
    FINV: 'FINV',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.FORDELING',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.FORDELING',
    'HYPGEOM.DIST': 'HYPGEO.FORDELING',
    HYPGEOMDIST: 'HYPGEOFORDELING',
    'T.DIST': 'T.FORDELING',
    'T.DIST.2T': 'T.FORDELING.2T',
    'T.DIST.RT': 'T.FORDELING.RT',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'TFORDELING',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.FORDELING',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMFORDELING',
    'NORM.DIST': 'NORMAL.FOR§DELING',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'STANDARD.NORM.FORDELING',
    'NORM.S.INV': 'STANDARD.NORM.INV',
    NORMDIST: 'NORMFORDELING',
    NORMINV: 'NORMINV',
    NORMSDIST: 'STANDARDNORMFORDELING',
    NORMSINV: 'STANDARDNORMINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.FORDELING',
    NEGBINOMDIST: 'NEGBINOMFORDELING',
    LARGE: 'STØRSTE',
    SMALL: 'MINDSTE',
    AVEDEV: 'MAD',
    CONFIDENCE: 'KONFIDENSINTERVAL',
    'CONFIDENCE.NORM': 'KONFIDENS.NORM',
    'CONFIDENCE.T': 'KONFIDENST',
    DEVSQ: 'SAK',
    GEOMEAN: 'GEOMIDDELVÆRDI',
    HARMEAN: 'HARMIDDELVÆRDI',
    CRITBINOM: 'KRITBINOM',
    PEARSON: 'PEARSON',
    RSQ: 'FORKLARINGSGRAD',
    STANDARDIZE: 'STANDARDISER',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'ZTEST',
    'F.TEST': 'F.TEST',
    FTEST: 'FTEST',
    STEYX: 'STFYX',
    SLOPE: 'STIGNING',
    COVAR: 'KOVARIANS',
    'COVARIANCE.P': 'KOVARIANS.P',
    'COVARIANCE.S': 'KOVARIANS.S',
    'CHISQ.TEST': 'CHI2.TEST',
    CHITEST: 'CHITEST',
    'T.TEST': 'T.TEST',
    TTEST: 'TTEST',
    SKEW: 'SKEW',
    'SKEW.P': 'SKEW.P',
    WEIBULLDIST: 'WEIBULLDIST', //FIXME
    VARS: 'VARS', //FIXME
    TINV2T: 'TINV2T', //FIXME
    TDISTRT: 'TDISTRT', //FIXME
    TDIST2T: 'TDIST2T', //FIXME
    STDEVS: 'STDEVS', //FIXME
    FINVRT: 'FINVRT', //FIXME
    FDISTRT: 'FDISTRT', //FIXME
    CHIDISTRT: 'CHIDISTRT', //FIXME
    CHIINVRT: 'CHIINVRT', //FIXME
    COVARIANCEP: 'COVARIANCEP', //FIXME
    COVARIANCES: 'COVARIANCES', //FIXME
    LOGNORMINV: 'LOGNORMINV', //FIXME
    POISSONDIST: 'POISSONDIST', //FIXME
    SKEWP: 'SKEWP', //FIXME
  },
  langCode: 'daDK',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
