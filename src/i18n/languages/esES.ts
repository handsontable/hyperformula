/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

export const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#¡DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/D',
    NAME: '#¿NOMBRE?',
    NUM: '#¡NUM!',
    REF: '#¡REF!',
    VALUE: '#¡VALOR!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'Y',
    ASIN: 'ASENO',
    ASINH: 'ASENOH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'PROMEDIO',
    AVERAGEA: 'PROMEDIOA',
    AVERAGEIF: 'PROMEDIO.SI',
    BASE: 'BASE',
    BIN2DEC: 'BIN.A.DEC',
    BIN2HEX: 'BIN.A.HEX',
    BIN2OCT: 'BIN.A.OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'MULTIPLO.SUPERIOR',
    CHAR: 'CARACTER',
    CHOOSE: 'ELEGIR',
    CLEAN: 'LIMPIAR',
    CODE: 'CODIGO',
    COLUMNS: 'COLUMNAS',
    CONCATENATE: 'CONCATENAR',
    CORREL: 'COEF.DE.CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONTAR',
    COUNTA: 'CONTARA',
    COUNTBLANK: 'CONTAR.BLANCO',
    COUNTIF: 'CONTAR.SI',
    COUNTIFS: 'CONTAR.SI.CONJUNTO',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'PAGO.INT.ENTRE',
    CUMPRINC: 'PAGO.PRINC.ENTRE',
    DATE: 'FECHA',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'FECHANUMERO',
    DAY: 'DIA',
    DAYS360: 'DIAS360',
    DAYS: 'DÍAS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC.A.BIN',
    DEC2HEX: 'DEC.A.HEX',
    DEC2OCT: 'DEC.A.OCT',
    DECIMAL: 'CONV.DECIMAL',
    DEGREES: 'GRADOS',
    DELTA: 'DELTA',
    DOLLARDE: 'MONEDA.DEC',
    DOLLARFR: 'MONEDA.FRAC',
    EDATE: 'FECHA.MES',
    EFFECT: "INT.EFECTIVO",
    EOMONTH: 'FIN.MES',
    ERF: 'FUN.ERROR',
    ERFC: 'FUN.ERROR.COMPL',
    EVEN: 'REDONDEA.PAR',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'ENCONTRAR',
    FORMULATEXT: 'FORMULATEXTO',
    FV: 'VF',
    HOUR: 'HORA',
    IF: 'SI',
    IFERROR: 'SI.ERROR',
    IFNA: 'IFNA',
    INDEX: 'INDICE',
    INT: 'ENTERO',
    IPMT: 'PAGOINT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ESBLANCO',
    ISERR: 'ESERR',
    ISERROR: 'ESERROR',
    ISEVEN: 'ES.PAR',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'ESLOGICO',
    ISNA: 'ESNOD',
    ISNONTEXT: 'ESNOTEXTO',
    ISNUMBER: 'ESNUMERO',
    ISODD: 'ES.IMPAR',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'INT.PAGO.DIR',
    ISREF: 'ESREF',
    ISTEXT: 'ESTEXTO',
    LEFT: 'IZQUIERDA',
    LEN: 'LARGO',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    MATCH: 'COINCIDIR',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTO',
    MMULT: 'MMULT',
    MOD: 'RESIDUO',
    MONTH: 'MES',
    NA: 'NOD',
    NOMINAL: 'TASA.NOMINAL',
    NOT: 'NO',
    NOW: 'AHORA',
    NPER: 'NPER',
    ODD: 'REDONDEA.IMPAR',
    OFFSET: 'DESREF',
    OR: 'O',
    PI: 'PI',
    PMT: 'PAGO',
    POWER: 'POTENCIA',
    PPMT: 'PAGOPRIN',
    PROPER: 'NOMPROPIO',
    PV: 'VA',
    RADIANS: 'RADIANES',
    RAND: 'ALEATORIO',
    RATE: 'TASA',
    REPT: 'REPETIR',
    RIGHT: 'DERECHA',
    ROUND: 'REDONDEAR',
    ROUNDDOWN: 'REDONDEAR.MENOS',
    ROUNDUP: 'REDONDEAR.MAS',
    ROWS: 'FILAS',
    RRI: 'RRI',
    SEARCH: 'HALLAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEET: 'HOJA',
    SHEETS: 'HOJAS',
    SIN: 'SENO',
    SINH: 'SENOH',
    SLN: 'SLN',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    SUM: 'SUMA',
    SUMIF: 'SUMAR.SI',
    SUMIFS: 'SUMAR.SI.CONJUNTO',
    SUMPRODUCT: 'SUMAPRODUCTO',
    SUMSQ: 'SUMA.CUADRADOS',
    SWITCH: '',
    SYD: 'SYD',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'LETRA.DE.TEST.EQV.A.BONO',
    TBILLPRICE: 'LETRA.DE.TES.PRECIO',
    TBILLYIELD: 'LETRA.DE.TES.RENDTO',
    TEXT: 'TEXTO',
    TIME: 'NSHORA',
    TIMEVALUE: 'HORANUMERO',
    TODAY: 'HOY',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'ESPACIOS',
    TRUE: 'VERDADERO',
    TRUNC: 'TRUNCAR',
    VLOOKUP: 'BUSCARV',
    WEEKDAY: 'DIASEM',
    WEEKNUM: 'NUM.DE.SEMANA',
    XOR: 'XOR',
    YEAR: 'AÑO',
    YEARFRAC: 'FRAC.AÑO',
  },
  langCode: 'esES',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
