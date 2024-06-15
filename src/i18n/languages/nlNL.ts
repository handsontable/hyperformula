/**
 * @license
 * Copyright (c) 2024 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DELING.DOOR.0!',
    ERROR: '#ERROR!',
    NA: '#N/B',
    NAME: '#NAAM?',
    NUM: '#GETAL!',
    REF: '#VERW!',
    SPILL: '#OVERLOOP!',
    VALUE: '#WAARDE!',
  },
  functions: {
    FILTER: 'FILTER',
    ADDRESS: 'ADRES',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
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
    COLUMN: 'KOLOM',
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
    EXACT: 'GELIJK',
    EXP: 'EXP',
    FALSE: 'ONWAAR',
    FIND: 'VIND.ALLES',
    FORMULATEXT: 'FORMULETEKST',
    FV: 'TW',
    FVSCHEDULE: 'TOEK.WAARDE2',
    HEX2BIN: 'HEX.N.BIN',
    HEX2DEC: 'HEX.N.DEC',
    HEX2OCT: 'HEX.N.OCT',
    HLOOKUP: 'HORIZ.ZOEKEN',
    HOUR: 'UUR',
    HYPERLINK: 'HYPERLINK',
    IF: 'ALS',
    IFERROR: 'ALS.FOUT',
    IFNA: 'ALS.NB',
    IFS: 'ALS.VOORWAARDEN',
    INDEX: 'INDEX',
    INT: 'INTEGER',
    INTERVAL: 'INTERVAL', //FIXME
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
    LOWER: 'KLEINE.LETTERS',
    MATCH: 'VERGELIJKEN',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXIFS: 'MAX.ALS.VOORWAARDEN',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'DEEL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MIN.ALS.VOORWAARDEN',
    MINUTE: 'MINUUT',
    MIRR: 'GIR',
    MMULT: 'PRODUCTMAT',
    MOD: 'REST',
    MONTH: 'MAAND',
    NA: 'NB',
    NETWORKDAYS: 'NETTO.WERKDAGEN',
    'NETWORKDAYS.INTL': 'NETWERKDAGEN.INTL',
    NOMINAL: 'NOMINALE.RENTE',
    NOT: 'NIET',
    NOW: 'NU',
    NPER: 'NPER',
    NPV: 'NHW',
    OCT2BIN: 'OCT.N.BIN',
    OCT2DEC: 'OCT.N.DEC',
    OCT2HEX: 'OCT.N.HEX',
    ODD: 'ONEVEN',
    OFFSET: 'VERSCHUIVING',
    OR: 'OF',
    PDURATION: 'PDUUR',
    PI: 'PI',
    PMT: 'BET',
    PRODUCT: 'PRODUCT',
    POWER: 'MACHT',
    PPMT: 'PBET',
    PROPER: 'BEGINLETTERS',
    PV: 'HW',
    RADIANS: 'RADIALEN',
    RAND: 'ASELECT',
    RATE: 'RENTE',
    REPLACE: 'VERVANGEN',
    REPT: 'HERHALING',
    RIGHT: 'RECHTS',
    ROUND: 'AFRONDEN',
    ROUNDDOWN: 'AFRONDEN.NAAR.BENEDEN',
    ROUNDUP: 'AFRONDEN.NAAR.BOVEN',
    ROW: 'RIJ',
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
    STDEVA: 'STDEVA',
    'STDEV.P': 'STDEV.P',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'STDEV.S',
    SUBSTITUTE: 'SUBSTITUEREN',
    SUBTOTAL: 'SUBTOTAAL',
    SUM: 'SOM',
    SUMIF: 'SOM.ALS',
    SUMIFS: 'SOMMEN.ALS',
    SUMPRODUCT: 'SOMPRODUCT',
    SUMSQ: 'KWADRATENSOM',
    SWITCH: '',
    SYD: 'SYD',
    T: 'T',
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
    UNICHAR: 'UNITEKEN',
    UNICODE: 'UNICODE',
    UPPER: 'HOOFDLETTERS',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'VERT.ZOEKEN',
    WEEKDAY: 'WEEKDAG',
    WEEKNUM: 'WEEKNUMMER',
    WORKDAY: 'WERKDAG',
    'WORKDAY.INTL': 'WERKDAG.INTL',
    XLOOKUP: 'X.ZOEKEN',
    XNPV: 'NHW2',
    XOR: 'EX.OF',
    YEAR: 'JAAR',
    YEARFRAC: 'JAAR.DEEL',
    ROMAN: 'ROMEINS',
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
    VAR: 'VAR',
    VARP: 'VARP',
    STDEV: 'STDEV',
    STDEVP: 'STDEVP',
    FACT: 'FACULTEIT',
    FACTDOUBLE: 'DUBBELE.FACULTEIT',
    COMBIN: 'COMBINATIES',
    COMBINA: 'COMBIN.A',
    GCD: 'GGD',
    LCM: 'KGV',
    MROUND: 'AFRONDEN.N.VEELVOUD',
    MULTINOMIAL: 'MULTINOMIAAL',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'ASELECTTUSSEN',
    SERIESSUM: 'SOM.MACHTREEKS',
    SIGN: 'POS.NEG',
    SQRTPI: 'WORTEL.PI',
    SUMX2MY2: 'SOM.X2MINY2',
    SUMX2PY2: 'SOM.X2PLUSY2',
    SUMXMY2: 'SOM.XMINY.2',
    'EXPON.DIST': 'EXPON.VERD.N',
    EXPONDIST: 'EXPON.VERD',
    FISHER: 'FISHER',
    FISHERINV: 'FISHER.INV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.VERD.N',
    'GAMMA.INV': 'GAMMA.INV.N',
    GAMMADIST: 'GAMMA.VERD',
    GAMMAINV: 'GAMMA.INV',
    GAMMALN: 'GAMMA.LN',
    'GAMMALN.PRECISE': 'GAMMA.LN.NAUWKEURIG',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.VERD',
    BETADIST: 'BETAVERD',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOM.VERD',
    BINOMDIST: 'BINOMIALE.VERD',
    'BINOM.INV': 'BINOMIALE.INV',
    BESSELI: 'BESSEL.I',
    BESSELJ: 'BESSEL.J',
    BESSELK: 'BESSEL.K',
    BESSELY: 'BESSEL.Y',
    CHIDIST: 'CHI.KWADRAAT',
    CHIINV: 'CHI.KWADRAAT.INV',
    'CHISQ.DIST': 'CHIKW.VERD',
    'CHISQ.DIST.RT': 'CHIKW.VERD.RECHTS',
    'CHISQ.INV': 'CHIKW.INV',
    'CHISQ.INV.RT': 'CHIKW.INV.RECHTS',
    'F.DIST': 'F.VERD',
    'F.DIST.RT': 'F.VERD.RECHTS',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RECHTS',
    FDIST: 'F.VERDELING',
    FINV: 'F.INVERSE',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.VERD',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.VERD',
    'HYPGEOM.DIST': 'HYPGEOM.VERD',
    HYPGEOMDIST: 'HYPERGEO.VERD',
    'T.DIST': 'T.DIST',
    'T.DIST.2T': 'T.VERD.2T',
    'T.DIST.RT': 'T.VERD.RECHTS',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'T.VERD',
    TINV: 'TINV',
    LOGINV: 'LOG.NORM.INV',
    'LOGNORM.DIST': 'LOGNORM.VERD',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOG.NORM.VERD',
    'NORM.DIST': 'NORM.VERD.N',
    'NORM.INV': 'NORM.INV.N',
    'NORM.S.DIST': 'NORM.S.VERD',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORM.VERD',
    NORMINV: 'NORM.INV',
    NORMSDIST: 'STAND.NORM.VERD',
    NORMSINV: 'STAND.NORM.INV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.VERD',
    NEGBINOMDIST: 'NEG.BINOM.VERD',
    COMPLEX: 'COMPLEX',
    IMABS: 'C.ABS',
    IMAGINARY: 'C.IM.DEEL',
    IMARGUMENT: 'C.ARGUMENT',
    IMCONJUGATE: 'C.TOEGEVOEGD',
    IMCOS: 'C.COS',
    IMCOSH: 'C.COSH',
    IMCOT: 'C.COT',
    IMCSC: 'C.COSEC',
    IMCSCH: 'C.COSECH',
    IMDIV: 'C.QUOTIENT',
    IMEXP: 'C.EXP',
    IMLN: 'C.LN',
    IMLOG10: 'C.LOG10',
    IMLOG2: 'C.LOG2',
    IMPOWER: 'C.MACHT',
    IMPRODUCT: 'C.PRODUCT',
    IMREAL: 'C.REEEL.DEEL',
    IMSEC: 'C.SEC',
    IMSECH: 'C.SECH',
    IMSIN: 'C.SIN',
    IMSINH: 'C.SINH',
    IMSQRT: 'C.WORTEL',
    IMSUB: 'C.VERSCHIL',
    IMSUM: 'C.SOM',
    IMTAN: 'C.TAN',
    LARGE: 'GROOTSTE',
    SMALL: 'KLEINSTE',
    AVEDEV: 'GEM.DEVIATIE',
    CONFIDENCE: 'BETROUWBAARHEID',
    'CONFIDENCE.NORM': 'VERTROUWELIJKHEID.NORM',
    'CONFIDENCE.T': 'VERTROUWELIJKHEID.T',
    DEVSQ: 'DEV.KWAD',
    GEOMEAN: 'MEETK.GEM',
    HARMEAN: 'HARM.GEM',
    CRITBINOM: 'CRIT.BINOM',
    PEARSON: 'PEARSON',
    RSQ: 'R.KWADRAAT',
    STANDARDIZE: 'NORMALISEREN',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'Z.TOETS',
    'F.TEST': 'F.TEST',
    FTEST: 'F.TOETS',
    STEYX: 'STAND.FOUT.YX',
    SLOPE: 'RICHTING',
    COVAR: 'COVARIANTIE',
    'COVARIANCE.P': 'COVARIANTIE.P',
    'COVARIANCE.S': 'COVARIANTIE.S',
    'CHISQ.TEST': 'CHIKW.TEST',
    CHITEST: 'CHI.TOETS',
    'T.TEST': 'T.TEST',
    TTEST: 'T.TOETS',
    SKEW: 'SCHEEFHEID',
    'SKEW.P': 'SCHEEFHEID.P',
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
    'CEILING.MATH': 'AFRONDEN.BOVEN.WISK',
    FLOOR: 'AFRONDEN.BENEDEN',
    'FLOOR.MATH': 'AFRONDEN.BENEDEN.WISK',
    'CEILING.PRECISE': 'CEILING.PRECISE', //FIXME
    'FLOOR.PRECISE': 'FLOOR.PRECISE', //FIXME
    'ISO.CEILING': 'ISO.CEILING', //FIXME
  },
  langCode: 'nlNL',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
