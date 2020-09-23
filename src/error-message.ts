/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

 /**
 * This is a class for detailed error messages across HyperFormula.
 *
 * @since 0.2.0
 */
export class ErrorMessage {
  public static DistinctSigns = 'Distinct signs.'
  public static WrongArgNumber = 'Wrong number of arguments.'
  public static EmptyArg = 'Empty function argument.'
  public static MatrixDimensions = 'Matrix dimensions are not compatible.'
  public static ValueSmall = 'Value too small.'
  public static ValueLarge = 'Value too large.'
  public static BadCriterion = 'Incorrect criterion.'
  public static RangeManySheets = 'Range spans more than one sheet.'
  public static CellRangeExpected = 'Cell range expected.'
  public static ScalarExpected = 'Cell range not allowed.'
  public static NumberCoercion = 'Value cannot be coerced to number.'
  public static NumberExpected = 'Number argument expected.'
  public static IntegerExpected = 'Value needs to be an integer.'
  public static BadMode = 'Mode not recognized.'
  public static DateBounds = 'Date outside of bounds.'
  public static OutOfSheet = 'Resulting reference is out of the sheet.'
  public static WrongType = 'Wrong type of argument.'
  public static Infinity = 'Infinite value.'
  public static EqualLength = 'Ranges need to be of equal length.'
  public static Negative = 'Value cannot be negative.'
  public static NotBinary = 'String does not represent a binary number.'
  public static NotOctal = 'String does not represent an octal number.'
  public static NotHex = 'String does not represent a hexadecimal number.'
  public static EndStartPeriod = 'End period needs to be at least start period.'
  public static CellRef = 'Cell reference expected.'
  public static BadRef = 'Address is not correct.'
  public static NumberRange = 'Number-only range expected.'
  public static ValueNotFound = 'Value not found.'
  public static ValueBaseLarge = 'Value in base too large.'
  public static ValueBaseSmall = 'Value in base too small.'
  public static ValueBaseLong = 'Value in base too long.'
  public static NegativeLength = 'Length cannot be negative.'
  public static PatternNotFound = 'Pattern not found.'
  public static MatrixParams = 'Matrix function parameters are not compatible.'
  public static OneValue = 'Needs at least one value.'
  public static TwoValues = 'Range needs to contain at least two elements.'
  public static IndexBounds = 'Index out of bounds.'
  public static IndexLarge = 'Index too large.'
  public static Formula = 'Expected formula.'
  public static NegativeCount = 'Count cannot be negative.'
  public static ParseError = 'Parsing error.'
  public static SheetRef = 'Sheet does not exist.'
  public static MatrixFunction = 'Matrix function not recognized.'
  public static PeriodLong = 'Period number cannot exceed life length.'
  public static InvalidDate = 'Invalid date.'
  public static BitshiftLong = 'Result of bitshift is too long.'
  public static EmptyString = 'Empty-string argument not allowed.'
  public static LengthBounds = 'Length out of bounds.'
  public static NegativeTime = 'Time cannot be negative.'
  public static NoDefault = 'No default option.'
  public static Selector = 'Selector cannot exceed the number of arguments.'
  public static StartEndDate = 'Start date needs to be earlier than end date.'
  public static IncorrectDateTime = 'String does not represent correct DateTime.'
  public static CharacterCodeBounds = 'Character code out of bounds.'
  public static NonZero = 'Argument cannot be 0.'
  public static FunctionName = (arg: string) => `Function name ${arg} not recognized.`
  public static NamedExpressionName = (arg: string) => `Named expression ${arg} not recognized.`
  public static LicenseKey = (arg: string) => `License key is ${arg}.`
}
