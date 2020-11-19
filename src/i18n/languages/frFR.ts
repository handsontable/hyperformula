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
    COLUMN: 'COLONNE',
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
    EXACT: 'EXACT',
    EXP: 'EXP',
    FALSE: 'FAUX',
    FIND: 'TROUVE',
    FORMULATEXT: 'FORMULETEXTE',
    FV: 'VC',
    FVSCHEDULE: 'VC.PAIEMENTS',
    HEX2BIN: 'HEXBIN',
    HEX2DEC: 'HEXDEC',
    HEX2OCT: 'HEXOCT',
    HLOOKUP: 'RECHERCHEH',
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
    LOWER: 'MINUSCULE',
    MATCH: 'EQUIV',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANE',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'STXT',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTE',
    MIRR: 'TRIM',
    MMULT: 'PRODUITMAT',
    MOD: 'MOD',
    MONTH: 'MOIS',
    NA: 'NA',
    NETWORKDAYS: 'NB.JOURS.OUVRES',
    'NETWORKDAYS.INTL': 'NB.JOURS.OUVRES.INTL',
    NOMINAL: 'TAUX.NOMINAL',
    NOT: 'NON',
    NOW: 'MAINTENANT',
    NPER: 'NPM',
    NPV: 'VAN',
    OCT2BIN: 'OCTBIN',
    OCT2DEC: 'OCTDEC',
    OCT2HEX: 'OCTHEX',
    ODD: 'IMPAIR',
    OFFSET: 'DECALER',
    OR: 'OU',
    PDURATION: 'PDUREE',
    PI: 'PI',
    PMT: 'VPM',
    PRODUCT: 'PRODUIT',
    POWER: 'PUISSANCE',
    PPMT: 'PRINCPER',
    PROPER: 'NOMPROPRE',
    PV: 'VA',
    RADIANS: 'RADIANS',
    RAND: 'ALEA',
    RATE: 'TAUX',
    REPLACE: 'REMPLACER',
    REPT: 'REPT',
    RIGHT: 'DROITE',
    ROUND: 'ARRONDI',
    ROUNDDOWN: 'ARRONDI.INF',
    ROUNDUP: 'ARRONDI.SUP',
    ROW: 'LIGNE',
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
    STDEVA: 'STDEVA',
    'STDEV.P': 'ECARTYPE.PEARSON',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'ECARTYPE.STANDARD',
    SUBSTITUTE: 'SUBSTITUE',
    SUBTOTAL: 'SOUS.TOTAL',
    SUM: 'SOMME',
    SUMIF: 'SOMME.SI',
    SUMIFS: 'SOMME.SI.ENS',
    SUMPRODUCT: 'SOMMEPROD',
    SUMSQ: 'SOMME.CARRES',
    SWITCH: '',
    SYD: 'SYD',
    T: 'T',
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
    UNICHAR: 'UNICAR',
    UNICODE: 'UNICODE',
    UPPER: 'MAJUSCULE',
    VARA: 'VARA',
    'VAR.P': 'VAR.P.N',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'RECHERCHEV',
    WEEKDAY: 'JOURSEM',
    WEEKNUM: 'NO.SEMAINE',
    WORKDAY: 'SERIE.JOUR.OUVRE',
    'WORKDAY.INTL': 'SERIE.JOUR.OUVRE.INTL',
    XNPV: 'VAN.PAIEMENTS',
    XOR: 'OUX',
    YEAR: 'ANNEE',
    YEARFRAC: 'FRACTION.ANNEE',
    ROMAN: 'ROMAIN',
    ARABIC: 'ARABE',
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
    VARP: 'VAR.P',
    STDEV: 'ECARTYPE',
    STDEVP: 'ECARTYPEP',
    FACT: 'FACT',
    FACTDOUBLE: 'FACTDOUBLE',
    COMBIN: 'COMBIN',
    COMBINA: 'COMBINA',
    GCD: 'PGCD',
    LCM: 'PPCM',
    MROUND: 'ARRONDI.AU.MULTIPLE',
    MULTINOMIAL: 'MULTINOMIALE',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'ALEA.ENTRE.BORNES',
    SERIESSUM: 'SOMME.SERIES',
    SIGN: 'SIGNE',
    SQRTPI: 'RACINE.PI',
    SUMX2MY2: 'SOMME.X2MY2',
    SUMX2PY2: 'SOMME.X2PY2',
    SUMXMY2: 'SOMME.XMY2',
    'EXPON.DIST': 'LOI.EXPONENTIELLE.N',
    EXPONDIST: 'LOI.EXPONENTIELLE',
    FISHER: 'FISHER',
    FISHERINV: 'FISHER.INVERSE',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'LOI.GAMMA.N',
    'GAMMA.INV': 'LOI.GAMMA.INVERSE.N',
    GAMMADIST: 'LOI.GAMMA',
    GAMMAINV: 'LOI.GAMMA.INVERSE',
    GAMMALN: 'LNGAMMA',
    'GAMMALN.PRECISE': 'LNGAMMA.PRECIS',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'LOI.BETA.N',
    BETADIST: 'LOI.BETA',
    'BETA.INV': 'BETA.INVERSE.N',
    BETAINV: 'BETA.INVERSE',
    'BINOM.DIST': 'LOI.BINOMIALE.N',
    BINOMDIST: 'LOI.BINOMIALE',
    'BINOM.INV': 'LOI.BINOMIALE.INVERSE',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'LOI.KHIDEUX',
    CHIINV: 'KHIDEUX.INVERSE',
    'CHISQ.DIST': 'LOI.KHIDEUX.N',
    'CHISQ.DIST.RT': 'LOI.KHIDEUX.DROITE',
    'CHISQ.INV': 'LOI.KHIDEUX.INVERSE',
    'CHISQ.INV.RT': 'LOI.KHIDEUX.INVERSE.DROITE',
    'F.DIST': 'LOI.F.N',
    'F.DIST.RT': 'LOI.F.DROITE',
    'F.INV': 'INVERSE.LOI.F.N',
    'F.INV.RT': 'INVERSE.LOI.F.DROITE',
    FDIST: 'LOI.F.',
    FINV: 'INVERSE.LOI.F.',
    WEIBULL: 'LOI.WEIBULL',
    'WEIBULL.DIST': 'LOI.WEIBULL.N',
    POISSON: 'LOI.POISSON',
    'POISSON.DIST': 'LOI.POISSON.N',
    'HYPGEOM.DIST': 'LOI.HYPERGEOMETRIQUE.N',
    HYPGEOMDIST: 'LOI.HYPERGEOMETRIQUE',
    'T.DIST': 'LOI.STUDENT.N',
    'T.DIST.2T': 'LOI.STUDENT.BILATERALE',
    'T.DIST.RT': 'LOI.STUDENT.DROITE',
    'T.INV': 'LOI.STUDENT.INVERSE.N',
    'T.INV.2T': 'LOI.STUDENT.INVERSE.BILATERALE',
    TDIST: 'LOI.STUDENT',
    TINV: 'LOI.STUDENT.INVERSE',
    LOGINV: 'LOI.LOGNORMALE.INVERSE',
    'LOGNORM.DIST': 'LOI.LOGNORMALE.N',
    'LOGNORM.INV': 'LOI.LOGNORMALE.INVERSE.N',
    LOGNORMDIST: 'LOI.LOGNORMALE',
    'NORM.DIST': 'LOI.NORMALE.N',
    'NORM.INV': 'LOI.NORMALE.INVERSE.N',
    'NORM.S.DIST': 'LOI.NORMALE.STANDARD.N',
    'NORM.S.INV': 'LOI.NORMALE.STANDARD.INVERSE.N',
    NORMDIST: 'LOI.NORMALE',
    NORMINV: 'LOI.NORMALE.INVERSE',
    NORMSDIST: 'LOI.NORMALE.STANDARD',
    NORMSINV: 'LOI.NORMALE.STANDARD.INVERSE',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'LOI.BINOMIALE.NEG.N',
    NEGBINOMDIST: 'LOI.BINOMIALE.NEG',
    LARGE: 'GRANDE.VALEUR',
    SMALL: 'PETITE.VALEUR',
    AVEDEV: 'ECART.MOYEN',
    CONFIDENCE: 'INTERVALLE.CONFIANCE',
    'CONFIDENCE.NORM': 'INTERVALLE.CONFIANCE.NORMAL',
    'CONFIDENCE.T': 'INTERVALLE.CONFIANCE.STUDENT',
    DEVSQ: 'SOMME.CARRES.ECARTS',
    GEOMEAN: 'MOYENNE.GEOMETRIQUE',
    HARMEAN: 'MOYENNE.HARMONIQUE',
    CRITBINOM: 'CRITERE.LOI.BINOMIALE',
    PEARSON: 'PEARSON',
    RSQ: 'COEFFICIENT.DETERMINATION',
    STANDARDIZE: 'CENTREE.REDUITE',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'TEST.Z',
  },
  langCode: 'frFR',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
