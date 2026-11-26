/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

/**
 * This is a class for detailed error messages across HyperFormula.
 */
export class ErrorMessage {
  public static PositiveValues = 'Values need to be positive.'
  public static ZeroVariance = 'Values cannot all be equal.'
  public static LinestStaticSize = 'LINEST requires input dimensions that determine a fixed result size.'
  public static LinestStaticStats = 'LINEST requires a constant stats argument to determine its result size.'
  public static LinestNoInterceptError = 'The intercept is fixed at 0, so it has no standard error.'
  public static LinestNoStatistic = 'This position of the LINEST statistics has no value.'
  public static DistinctSigns = 'Distinct signs.'
  public static WrongArgNumber = 'Wrong number of arguments.'
  public static EmptyArg = 'Empty function argument.'
  public static EmptyArray = 'Empty array not allowed.'
  public static ArrayDimensions = 'Array dimensions are not compatible.'
  public static NoBroadcastValue = 'Operand ranges cannot be broadcast to a common size, so this position has no value.'
  public static PoolDimensions = 'Range dimensions are not compatible with the window size and the stride.'
  public static NoSpaceForArrayResult = 'No space for array result.'
  public static ArraySourceRemoved = 'Source cell of the array result was overwritten or removed.'
  public static OutsideArrayResult = 'Position is outside the array result of this formula.'
  public static ValueSmall = 'Value too small.'
  public static ValueLarge = 'Value too large.'
  public static BadCriterion = 'Incorrect criterion.'
  public static RangeManySheets = 'Range spans more than one sheet.'
  public static CellRangeExpected = 'Cell range expected.'
  public static WrongDimension = 'Wrong range dimension.'
  public static SearchRangeDimension = 'Search range needs to be a single row or a single column, not a two-dimensional range.'
  public static ScalarExpected = 'Cell range not allowed.'
  public static NumberCoercion = 'Value cannot be coerced to number.'
  public static NumberExpected = 'Number argument expected.'
  public static IntegerExpected = 'Value needs to be an integer.'
  public static BadMode = 'Mode not recognized.'
  public static BadFormat = 'Format not recognized.'
  public static DateBounds = 'Date outside of bounds.'
  public static CouponFrequency = 'Frequency must be 1, 2 or 4.'
  public static FirstCouponDate = 'First coupon date is not a coupon date of the maturity date.'
  public static OddPeriodLength = 'Odd first period has the length of a regular coupon period.'
  public static NoDaysToMaturity = 'No days from settlement to maturity under the day-count basis.'
  public static OutOfSheet = 'Resulting reference is out of the sheet.'
  public static UnresolvedReference = 'Reference in the formula could not be resolved.'
  public static ReferenceRemoved = 'Reference points to a row or column that was removed.'
  public static ReferenceExceedsSheetSize = 'Reference exceeds the maximum row or column size of the sheet.'
  public static CircularReference = 'Cell is part of a circular reference.'
  public static WrongType = 'Wrong type of argument.'
  public static NaN = 'NaN or infinite value encountered.'
  public static ProbabilitySum = 'Probabilities need to sum up to 1.'
  public static EqualLength = 'Ranges need to be of equal length.'
  public static Negative = 'Value cannot be negative.'
  public static NotBinary = 'String does not represent a binary number.'
  public static NotOctal = 'String does not represent an octal number.'
  public static NotHex = 'String does not represent a hexadecimal number.'
  public static EndStartPeriod = 'End period needs to be at least start period.'
  public static CellRefExpected = 'Cell reference expected.'
  public static EmptyRange = 'Empty range not allowed.'
  public static BadRef = 'Address is not correct.'
  public static NumberRange = 'Number-only range expected.'
  public static ValueNotFound = 'Value not found.'
  public static NaFunction = 'The NA function always evaluates to the #N/A error.'
  public static ErrorTypeNotError = 'The value is not an error, so ERROR.TYPE has no number to return.'
  public static ErrorTypeNoCode = 'This error type has no ERROR.TYPE number.'
  public static ValueBaseLarge = 'Value in base too large.'
  public static ValueBaseSmall = 'Value in base too small.'
  public static ValueBaseLong = 'Value in base too long.'
  public static NegativeLength = 'Length cannot be negative.'
  public static PatternNotFound = 'Pattern not found.'
  public static OneValue = 'Needs at least one value.'
  public static TwoValues = 'Range needs to contain at least two elements.'
  public static ThreeValues = 'Range needs to contain at least three elements.'
  public static TwoCashFlows = 'A schedule of cash flows needs at least two entries to define a rate of return.'
  public static PositiveAndNegative = 'Needs at least one positive and one negative value.'
  public static EqualXValues = 'All x values are equal.'
  public static FourValues = 'Range needs to contain at least four elements.'
  public static IndexBounds = 'Index out of bounds.'
  public static IndexLarge = 'Index too large.'
  public static Formula = 'Expected formula.'
  public static NegativeCount = 'Count cannot be negative.'
  public static ParseError = 'Parsing error.'
  public static ErrorLiteral = 'Error value was entered directly into the formula.'
  public static SheetRef = 'Sheet does not exist.'
  public static PeriodLong = 'Period number cannot exceed life length.'
  public static NonZeroPeriods = 'Number of periods cannot be 0 when the rate is -1.'
  public static InvalidDate = 'Invalid date.'
  public static BitshiftLong = 'Result of bitshift is too long.'
  public static EmptyString = 'Empty-string argument not allowed.'
  public static LengthBounds = 'Length out of bounds.'
  public static NegativeTime = 'Time cannot be negative.'
  public static NoDefault = 'No default option.'
  public static NoConditionMet = 'None of the conditions were met.'
  public static NoConvergence = 'Calculation did not converge.'
  public static RateGuess = 'The iterative rate search needs an initial guess greater than -1.'
  public static Selector = 'Selector cannot exceed the number of arguments.'
  public static StartEndDate = 'Start date needs to be earlier than end date.'
  public static MaturityLong = 'Maturity date cannot be more than one year after the settlement date.'
  public static IncorrectDateTime = 'String does not represent correct DateTime.'
  public static CharacterCodeBounds = 'Character code out of bounds.'
  public static NonZero = 'Argument cannot be 0.'
  public static DivisionByZero = 'Division by zero.'
  public static ZeroRowOrColumnCount = 'Row or column count cannot be zero.'
  public static LessThanOne = 'Argument cannot be less than 1.'
  public static WeekendString = 'Incorrect weekend bitmask string.'
  public static InvalidRoman = 'Invalid roman numeral.'
  public static WrongOrder = 'Wrong order of values.'
  public static ComplexNumberExpected = 'Complex number expected.'
  public static ShouldBeIorJ = 'Should be \'i\' or \'j\'.'
  public static SizeMismatch = 'Array dimensions mismatched.'
  public static ResultTooLong = 'Result exceeds the maximum allowed length.'
  public static FunctionName = (arg: string) => `Function name ${arg} not recognized.`
  public static NamedExpressionName = (arg: string) => `Named expression ${arg} not recognized.`
  public static LicenseKey = (arg: string) => `License key is ${arg}.` +
    ' If you need any help, contact us at sales@handsontable.com.'
  public static LicenseCapability = (functionName: string) => `Function ${functionName} is not included in your license.` +
    ' If you need any help, contact us at sales@handsontable.com.'
  public static StaticResultSize = (functionName: string) => `${functionName} requires input dimensions that determine a fixed result size.`
  public static StaticStats = (functionName: string) => `${functionName} requires a constant stats argument to determine its result size.`
}

/**
 * The `originFunction` values of cell errors that no function or operator produced: they name
 * what built the error before any function read it.
 */
export class ErrorOrigin {
  /** A reference the engine cannot resolve. */
  public static Reference = 'reference'
  /** A reference destroyed by removing rows or columns. */
  public static RemovedReference = 'removed reference'
  /** A formula that could not be parsed. */
  public static Parser = 'parser'
  /** A value written into a cell that is an error or that the engine rejects. */
  public static UserInput = 'user input'
  /** An error value written into a formula. */
  public static Literal = 'literal'
  /** An array literal whose rows differ in length. */
  public static ArrayLiteral = 'array literal'
}
