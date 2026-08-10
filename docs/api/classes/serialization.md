# Serialization

## Constructors

### constructor 

\+ **new Serialization**(`dependencyGraph`: DependencyGraph, `unparser`: Unparser, `exporter`: [Exporter](exporter.md)): *[Serialization](serialization.md)*

*Defined in [src/Serialization.ts:23](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`dependencyGraph` | DependencyGraph |
`unparser` | Unparser |
`exporter` | [Exporter](exporter.md) |

**Returns:** *[Serialization](serialization.md)*

## Methods

### genericAllSheetsGetter 

▸ **genericAllSheetsGetter**‹**T**›(`sheetGetter`: function): *Record‹string, T›*

*Defined in [src/Serialization.ts:115](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L115)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **sheetGetter**: *function*

▸ (`sheet`: number): *T*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *Record‹string, T›*

___

### genericSheetGetter 

▸ **genericSheetGetter**‹**T**›(`sheet`: number, `getter`: function): *T[][]*

*Defined in [src/Serialization.ts:84](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L84)*

**Type parameters:**

▪ **T**

**Parameters:**

▪ **sheet**: *number*

▪ **getter**: *function*

▸ (`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *T*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *T[][]*

___

### getAllNamedExpressionsSerialized 

▸ **getAllNamedExpressionsSerialized**(): *[SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]*

*Defined in [src/Serialization.ts:140](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L140)*

**Returns:** *[SerializedNamedExpression](../interfaces/serializednamedexpression.md)[]*

___

### getAllSheetsFormulas 

▸ **getAllSheetsFormulas**(): *Record‹string, [Maybe](../globals.md#maybe)‹string›[][]›*

*Defined in [src/Serialization.ts:132](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L132)*

**Returns:** *Record‹string, [Maybe](../globals.md#maybe)‹string›[][]›*

___

### getAllSheetsSerialized 

▸ **getAllSheetsSerialized**(): *Record‹string, [RawCellContent](../globals.md#rawcellcontent)[][]›*

*Defined in [src/Serialization.ts:136](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L136)*

**Returns:** *Record‹string, [RawCellContent](../globals.md#rawcellcontent)[][]›*

___

### getAllSheetsValues 

▸ **getAllSheetsValues**(): *Record‹string, [CellValue](../globals.md#cellvalue)[][]›*

*Defined in [src/Serialization.ts:128](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L128)*

**Returns:** *Record‹string, [CellValue](../globals.md#cellvalue)[][]›*

___

### getCellFormula 

▸ **getCellFormula**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `targetAddress?`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[Maybe](../globals.md#maybe)‹string›*

*Defined in [src/Serialization.ts:42](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L42)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`targetAddress?` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[Maybe](../globals.md#maybe)‹string›*

___

### getCellHyperlink 

▸ **getCellHyperlink**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[Maybe](../globals.md#maybe)‹string›*

*Defined in [src/Serialization.ts:31](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L31)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[Maybe](../globals.md#maybe)‹string›*

___

### getCellSerialized 

▸ **getCellSerialized**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `targetAddress?`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[RawCellContent](../globals.md#rawcellcontent)*

*Defined in [src/Serialization.ts:64](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L64)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`targetAddress?` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[RawCellContent](../globals.md#rawcellcontent)*

___

### getCellValue 

▸ **getCellValue**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[CellValue](../globals.md#cellvalue)*

*Defined in [src/Serialization.ts:68](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L68)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[CellValue](../globals.md#cellvalue)*

___

### getRawValue 

▸ **getRawValue**(`address`: [SimpleCellAddress](../interfaces/simplecelladdress.md)): *[RawCellContent](../globals.md#rawcellcontent)*

*Defined in [src/Serialization.ts:72](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L72)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |

**Returns:** *[RawCellContent](../globals.md#rawcellcontent)*

___

### getSheetFormulas 

▸ **getSheetFormulas**(`sheet`: number): *[Maybe](../globals.md#maybe)‹string›[][]*

*Defined in [src/Serialization.ts:80](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L80)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *[Maybe](../globals.md#maybe)‹string›[][]*

___

### getSheetSerialized 

▸ **getSheetSerialized**(`sheet`: number): *[RawCellContent](../globals.md#rawcellcontent)[][]*

*Defined in [src/Serialization.ts:124](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L124)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *[RawCellContent](../globals.md#rawcellcontent)[][]*

___

### getSheetValues 

▸ **getSheetValues**(`sheet`: number): *[CellValue](../globals.md#cellvalue)[][]*

*Defined in [src/Serialization.ts:76](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L76)*

**Parameters:**

Name | Type |
------ | ------ |
`sheet` | number |

**Returns:** *[CellValue](../globals.md#cellvalue)[][]*

___

### withNewConfig 

▸ **withNewConfig**(`newConfig`: [Config](config.md), `namedExpressions`: [NamedExpressions](namedexpressions.md)): *[Serialization](serialization.md)*

*Defined in [src/Serialization.ts:158](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Serialization.ts#L158)*

**Parameters:**

Name | Type |
------ | ------ |
`newConfig` | [Config](config.md) |
`namedExpressions` | [NamedExpressions](namedexpressions.md) |

**Returns:** *[Serialization](serialization.md)*