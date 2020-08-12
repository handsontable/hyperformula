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
    ATAN: 'ATAN',
    ATAN2: 'ATAN2',
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
    DATE: 'FECHA',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'FECHANUMERO',
    DAY: 'DIA',
    DAYS: 'DÍAS',
    DAYS360: 'DIAS360',
    DEC2BIN: 'DEC.A.BIN',
    DEC2HEX: 'DEC.A.HEX',
    DEC2OCT: 'DEC.A.OCT',
    DECIMAL: 'CONV.DECIMAL',
    DEGREES: 'GRADOS',
    DELTA: 'DELTA',
    EDATE: 'FECHA.MES',
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
    ISREF: 'ESREF',
    ISTEXT: 'ESTEXTO',
    LEFT: 'IZQUIERDA',
    LEN: 'LARGO',
    LN: 'LN',
    LOG: 'LOG',
    LOG10: 'LOG10',
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
    NOW: 'AHORA',
    NOT: 'NO',
    ODD: 'REDONDEA.IMPAR',
    OFFSET: 'DESREF',
    OR: 'O',
    PI: 'PI',
    PMT: 'PAGO',
    POWER: 'POTENCIA',
    PPMT: 'PAGOPRIN',
    PROPER: 'NOMPROPIO',
    RADIANS: 'RADIANES',
    RAND: 'ALEATORIO',
    REPT: 'REPETIR',
    RIGHT: 'DERECHA',
    ROUND: 'REDONDEAR',
    ROUNDDOWN: 'REDONDEAR.MENOS',
    ROUNDUP: 'REDONDEAR.MAS',
    ROWS: 'FILAS',
    SEARCH: 'HALLAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEETS: 'HOJAS',
    SHEET: 'HOJA',
    SIN: 'SENO',
    SINH: 'SENOH',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    SUM: 'SUMA',
    SUMIF: 'SUMAR.SI',
    SUMIFS: 'SUMAR.SI.CONJUNTO',
    SUMPRODUCT: 'SUMAPRODUCTO',
    SUMSQ: 'SUMA.CUADRADOS',
    SWITCH: '',
    TAN: 'TAN',
    TANH: 'TANH',
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
