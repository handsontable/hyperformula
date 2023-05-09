/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#JAKO/0!',
    ERROR: '#ERROR!',
    NA: '#PUUTTUU!',
    NAME: '#NIMI?',
    NUM: '#LUKU!',
    REF: '#VIITTAUS!',
    SPILL: '#LEVITTYMINEN!',
    VALUE: '#ARVO!',
  },
  functions: {
    FILTER: 'FILTER',
    'ARRAY_CONSTRAIN': 'ARRAY_CONSTRAIN',
    ARRAYFORMULA: 'ARRAYFORMULA',
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
    COLUMN: 'SARAKE',
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
    FVSCHEDULE: 'TULEVA.ARVO.ERIKORKO',
    HEX2BIN: 'HEKSABIN',
    HEX2DEC: 'HEKSADES',
    HEX2OCT: 'HEKSAOKT',
    HLOOKUP: 'VHAKU',
    HOUR: 'TUNNIT',
    HYPERLINK: 'HYPERLINKKI',
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
    MAXIFS: 'MAKS.JOS',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAANI',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'POIMI.TEKSTI',
    MIN: 'MIN',
    MINA: 'MINA',
    MINIFS: 'MIN.JOS',
    MINUTE: 'MINUUTIT',
    MIRR: 'MSISÄINEN',
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
    NPV: 'NNA',
    OCT2BIN: 'OKTBIN',
    OCT2DEC: 'OKTDES',
    OCT2HEX: 'OKTHEKSA',
    ODD: 'PARITON',
    OFFSET: 'SIIRTYMÄ',
    OR: 'TAI',
    PDURATION: 'KESTO.JAKSO',
    PI: 'PII',
    PMT: 'MAKSU',
    PRODUCT: 'TULO',
    POWER: 'POTENSSI',
    PPMT: 'PPMT',
    PROPER: 'ERISNIMI',
    PV: 'NA',
    RADIANS: 'RADIAANIT',
    RAND: 'SATUNNAISLUKU',
    RATE: 'KORKO',
    REPLACE: 'KORVAA',
    REPT: 'TOISTA',
    RIGHT: 'OIKEA',
    ROUND: 'PYÖRISTÄ',
    ROUNDDOWN: 'PYÖRISTÄ.DES.ALAS',
    ROUNDUP: 'PYÖRISTÄ.DES.YLÖS',
    ROW: 'RIVI',
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
    STDEVA: 'KESKIHAJONTAA',
    'STDEV.P': 'KESKIHAJONTA.P',
    STDEVPA: 'KESKIHAJONTAPA',
    'STDEV.S': 'KESKIHAJONTA.S',
    SUBSTITUTE: 'VAIHDA',
    SUBTOTAL: 'VÄLISUMMA',
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
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'PHAKU',
    WEEKDAY: 'VIIKONPÄIVÄ',
    WEEKNUM: 'VIIKKO.NRO',
    WORKDAY: 'TYÖPÄIVÄ',
    'WORKDAY.INTL': 'TYÖPÄIVÄ.KANSVÄL',
    XNPV: 'NNA.JAKSOTON',
    XOR: 'EHDOTON.TAI',
    YEAR: 'VUOSI',
    YEARFRAC: 'VUOSI.OSA',
    ROMAN: 'ROMAN',
    ARABIC: 'ARABIA',
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
    STDEV: 'KESKIHAJONTA',
    STDEVP: 'KESKIHAJONTAP',
    FACT: 'KERTOMA',
    FACTDOUBLE: 'KERTOMA.OSA',
    COMBIN: 'KOMBINAATIO',
    COMBINA: 'KOMBINAATIOA',
    GCD: 'SUURIN.YHT.TEKIJÄ',
    LCM: 'PIENIN.YHT.JAETTAVA',
    MROUND: 'PYÖRISTÄ.KERR',
    MULTINOMIAL: 'MULTINOMI',
    QUOTIENT: 'OSAMÄÄRÄ',
    RANDBETWEEN: 'SATUNNAISLUKU.VÄLILTÄ',
    SERIESSUM: 'SARJA.SUMMA',
    SIGN: 'ETUMERKKI',
    SQRTPI: 'NELIÖJUURI.PII',
    SUMX2MY2: 'NELIÖSUMMIEN.EROTUS',
    SUMX2PY2: 'NELIÖSUMMIEN.SUMMA',
    SUMXMY2: 'EROTUSTEN.NELIÖSUMMA',
    'EXPON.DIST': 'EKSPONENTIAALI.JAKAUMA',
    EXPONDIST: 'EKSPONENTIAALIJAKAUMA',
    FISHER: 'FISHER',
    FISHERINV: 'FISHER.KÄÄNT',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.JAKAUMA',
    'GAMMA.INV': 'GAMMA.JAKAUMA.KÄÄNT',
    GAMMADIST: 'GAMMAJAKAUMA',
    GAMMAINV: 'GAMMAJAKAUMA.KÄÄNT',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.TARKKA',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BEETA.JAKAUMA',
    BETADIST: 'BEETAJAKAUMA',
    'BETA.INV': 'BEETA.KÄÄNT',
    BETAINV: 'BEETAJAKAUMA.KÄÄNT',
    'BINOM.DIST': 'BINOMI.JAKAUMA',
    BINOMDIST: 'BINOMIJAKAUMA',
    'BINOM.INV': 'BINOMIJAKAUMA.KÄÄNT',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'CHIJAKAUMA',
    CHIINV: 'CHIJAKAUMA.KÄÄNT',
    'CHISQ.DIST': 'CHINELIÖ.JAKAUMA',
    'CHISQ.DIST.RT': 'CHINELIÖ.JAKAUMA.OH',
    'CHISQ.INV': 'CHINELIÖ.KÄÄNT',
    'CHISQ.INV.RT': 'CHINELIÖ.KÄÄNT.OH',
    'F.DIST': 'F.JAKAUMA',
    'F.DIST.RT': 'F.JAKAUMA.OH',
    'F.INV': 'F.KÄÄNT',
    'F.INV.RT': 'F.KÄÄNT.OH',
    FDIST: 'FJAKAUMA',
    FINV: 'FJAKAUMA.KÄÄNT',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.JAKAUMA',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.JAKAUMA',
    'HYPGEOM.DIST': 'HYPERGEOM_JAKAUMA',
    HYPGEOMDIST: 'HYPERGEOM.JAKAUMA',
    'T.DIST': 'T.JAKAUMA',
    'T.DIST.2T': 'T.JAKAUMA.2S',
    'T.DIST.RT': 'T.JAKAUMA.OH',
    'T.INV': 'T.KÄÄNT',
    'T.INV.2T': 'T.KÄÄNT.2S',
    TDIST: 'TJAKAUMA',
    TINV: 'TJAKAUMA.KÄÄNT',
    LOGINV: 'LOGNORM.JAKAUMA.KÄÄNT',
    'LOGNORM.DIST': 'LOGNORM_JAKAUMA',
    'LOGNORM.INV': 'LOGNORM.KÄÄNT',
    LOGNORMDIST: 'LOGNORM.JAKAUMA',
    'NORM.DIST': 'NORMAALI.JAKAUMA',
    'NORM.INV': 'NORMAALI.JAKAUMA.KÄÄNT',
    'NORM.S.DIST': 'NORM_JAKAUMA.NORMIT',
    'NORM.S.INV': 'NORM_JAKAUMA.KÄÄNT',
    NORMDIST: 'NORM.JAKAUMA',
    NORMINV: 'NORM.JAKAUMA.KÄÄNT',
    NORMSDIST: 'NORM.JAKAUMA.NORMIT',
    NORMSINV: 'NORM.JAKAUMA.NORMIT.KÄÄNT',
    PHI: 'FII',
    'NEGBINOM.DIST': 'BINOMI.JAKAUMA.NEG',
    NEGBINOMDIST: 'BINOMIJAKAUMA.NEG',
    COMPLEX: 'KOMPLEKSI',
    IMABS: 'KOMPLEKSI.ABS',
    IMAGINARY: 'KOMPLEKSI.IMAG',
    IMARGUMENT: 'KOMPLEKSI.ARG',
    IMCONJUGATE: 'KOMPLEKSI.KONJ',
    IMCOS: 'KOMPLEKSI.COS',
    IMCOSH: 'KOMPLEKSI.COSH',
    IMCOT: 'KOMPLEKSI.COT',
    IMCSC: 'KOMPLEKSI.KOSEK',
    IMCSCH: 'KOMPLEKSI.KOSEKH',
    IMDIV: 'KOMPLEKSI.OSAM',
    IMEXP: 'KOMPLEKSI.EKSP',
    IMLN: 'KOMPLEKSI.LN',
    IMLOG10: 'KOMPLEKSI.LOG10',
    IMLOG2: 'KOMPLEKSI.LOG2',
    IMPOWER: 'KOMPLEKSI.POT',
    IMPRODUCT: 'KOMPLEKSI.TULO',
    IMREAL: 'KOMPLEKSI.REAALI',
    IMSEC: 'KOMPLEKSI.SEK',
    IMSECH: 'KOMPLEKSI.SEKH',
    IMSIN: 'KOMPLEKSI.SIN',
    IMSINH: 'KOMPLEKSI.SINH',
    IMSQRT: 'KOMPLEKSI.NELIÖJ',
    IMSUB: 'KOMPLEKSI.EROTUS',
    IMSUM: 'KOMPLEKSI.SUM',
    IMTAN: 'KOMPLEKSI.TAN',
    LARGE: 'SUURI',
    SMALL: 'PIENI',
    AVEDEV: 'KESKIPOIKKEAMA',
    CONFIDENCE: 'LUOTTAMUSVÄLI',
    'CONFIDENCE.NORM': 'LUOTTAMUSVÄLI.NORM',
    'CONFIDENCE.T': 'LUOTTAMUSVÄLI.T',
    DEVSQ: 'OIKAISTU.NELIÖSUMMA',
    GEOMEAN: 'KESKIARVO.GEOM',
    HARMEAN: 'KESKIARVO.HARM',
    CRITBINOM: 'BINOMIJAKAUMA.KRIT',
    PEARSON: 'PEARSON',
    RSQ: 'PEARSON.NELIÖ',
    STANDARDIZE: 'NORMITA',
    'Z.TEST': 'Z.TESTI',
    ZTEST: 'ZTESTI',
    'F.TEST': 'F.TESTI',
    FTEST: 'FTESTI',
    STEYX: 'KESKIVIRHE',
    SLOPE: 'KULMAKERROIN',
    COVAR: 'KOVARIANSSI',
    'COVARIANCE.P': 'KOVARIANSSI.P',
    'COVARIANCE.S': 'KOVARIANSSI.S',
    'CHISQ.TEST': 'CHINELIÖ.TESTI',
    CHITEST: 'CHITESTI',
    'T.TEST': 'T.TESTI',
    TTEST: 'TTESTI',
    SKEW: 'JAKAUMAN.VINOUS',
    'SKEW.P': 'JAKAUMAN.VINOUS.POP',
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
    'CEILING.MATH': 'PYÖRISTÄ.KERR.YLÖS.MATEMAATTINEN',
    FLOOR: 'PYÖRISTÄ.KERR.ALAS',
    'FLOOR.MATH': 'PYÖRISTÄ.KERR.ALAS.MATEMAATTINEN',
    'CEILING.PRECISE': 'CEILING.PRECISE', //FIXME
    'FLOOR.PRECISE': 'FLOOR.PRECISE', //FIXME
    'ISO.CEILING': 'ISO.CEILING', //FIXME
  },
  langCode: 'fiFI',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
