# ExportedCellChange

A list of cells which values changed after the operation, their absolute addresses and new values.

## Constructors

### constructor 

\+ **new ExportedCellChange**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `newValue`: [CellValue](../globals.md#cellvalue)): *[ExportedCellChange](exportedcellchange.md)*

*Defined in [src/Exporter.ts:23](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`newValue` | [CellValue](../globals.md#cellvalue) |

**Returns:** *[ExportedCellChange](exportedcellchange.md)*

## Properties

### address

• **address**: *[SimpleCellAddress](../interfaces/simplecelladdress.md)*

*Defined in [src/Exporter.ts:25](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L25)*

___

### newValue

• **newValue**: *[CellValue](../globals.md#cellvalue)*

*Defined in [src/Exporter.ts:26](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L26)*

## Accessors

### col 

• **get col**(): *number*

*Defined in [src/Exporter.ts:30](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L30)*

**Returns:** *number*

___

### row 

• **get row**(): *number*

*Defined in [src/Exporter.ts:34](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L34)*

**Returns:** *number*

___

### sheet 

• **get sheet**(): *number*

*Defined in [src/Exporter.ts:38](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L38)*

**Returns:** *number*

___

### value 

• **get value**(): *[CellValue](../globals.md#cellvalue)*

*Defined in [src/Exporter.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Exporter.ts#L42)*

**Returns:** *[CellValue](../globals.md#cellvalue)*