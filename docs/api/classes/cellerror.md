# CellError

## Constructors

### constructor 

\+ **new CellError**(`type`: [ErrorType](hyperformulans.md#static-errortype), `message?`: undefined | string, `root?`: FormulaVertex): *[CellError](cellerror.md)*

*Defined in [src/Cell.ts:149](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L149)*

**Parameters:**

Name | Type |
------ | ------ |
`type` | [ErrorType](hyperformulans.md#static-errortype) |
`message?` | undefined &#124; string |
`root?` | FormulaVertex |

**Returns:** *[CellError](cellerror.md)*

## Properties

### message

• **message**? : *undefined | string*

*Defined in [src/Cell.ts:152](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L152)*

___

### root

• **root**? : *FormulaVertex*

*Defined in [src/Cell.ts:153](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L153)*

___

### type

• **type**: *[ErrorType](hyperformulans.md#static-errortype)*

*Defined in [src/Cell.ts:151](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L151)*

## Methods

### attachRootVertex 

▸ **attachRootVertex**(`vertex`: FormulaVertex): *[CellError](cellerror.md)*

*Defined in [src/Cell.ts:165](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L165)*

**Parameters:**

Name | Type |
------ | ------ |
`vertex` | FormulaVertex |

**Returns:** *[CellError](cellerror.md)*

___

### parsingError

▸ **parsingError**(`detailedMessage?`: undefined | string): *[CellError](cellerror.md)*

*Defined in [src/Cell.ts:161](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Cell.ts#L161)*

Returns a CellError with a given message.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`detailedMessage?` | undefined &#124; string | message to be displayed  |

**Returns:** *[CellError](cellerror.md)*