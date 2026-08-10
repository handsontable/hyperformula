# ContentChanges

## Methods

### addAll 

▸ **addAll**(`other`: [ContentChanges](contentchanges.md)): *[ContentChanges](contentchanges.md)*

*Defined in [src/ContentChanges.ts:29](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`other` | [ContentChanges](contentchanges.md) |

**Returns:** *[ContentChanges](contentchanges.md)*

___

### addChange 

▸ **addChange**(`newValue`: InterpreterValue, `address`: [SimpleCellAddress](../interfaces/simplecelladdress.md), `oldValue?`: InterpreterValue): *void*

*Defined in [src/ContentChanges.ts:36](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L36)*

**Parameters:**

Name | Type |
------ | ------ |
`newValue` | InterpreterValue |
`address` | [SimpleCellAddress](../interfaces/simplecelladdress.md) |
`oldValue?` | InterpreterValue |

**Returns:** *void*

___

### exportChanges 

▸ **exportChanges**‹**T**›(`exporter`: [ChangeExporter](../interfaces/changeexporter.md)‹T›): *T[]*

*Defined in [src/ContentChanges.ts:40](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L40)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type |
------ | ------ |
`exporter` | [ChangeExporter](../interfaces/changeexporter.md)‹T› |

**Returns:** *T[]*

___

### getChanges 

▸ **getChanges**(): *[ChangeList](../globals.md#changelist)*

*Defined in [src/ContentChanges.ts:53](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L53)*

**Returns:** *[ChangeList](../globals.md#changelist)*

___

### isEmpty 

▸ **isEmpty**(): *boolean*

*Defined in [src/ContentChanges.ts:57](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L57)*

**Returns:** *boolean*

___

### empty

▸ **empty**(): *[ContentChanges](contentchanges.md)‹›*

*Defined in [src/ContentChanges.ts:25](https://github.com/handsontable/hyperformula/blob/af2d59d/src/ContentChanges.ts#L25)*

**Returns:** *[ContentChanges](contentchanges.md)‹›*