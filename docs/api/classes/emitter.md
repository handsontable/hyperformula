# Emitter

## Methods

### emit 

▸ **emit**‹**Event**›(`event`: Event, ...`args`: Parameters‹Listeners[Event]›): *this*

*Defined in [src/Emitter.ts:328](https://github.com/handsontable/hyperformula/blob/af2d59d/src/Emitter.ts#L328)*

**Type parameters:**

▪ **Event**: *keyof Listeners*

**Parameters:**

Name | Type |
------ | ------ |
`event` | Event |
`...args` | Parameters‹Listeners[Event]› |

**Returns:** *this*

___

### off 

▸ **off**(`event`: string, `callback?`: Function): *this*

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`callback?` | Function |

**Returns:** *this*

___

### on 

▸ **on**(`event`: string, `callback`: Function, `ctx?`: any): *this*

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`callback` | Function |
`ctx?` | any |

**Returns:** *this*

___

### once 

▸ **once**(`event`: string, `callback`: Function, `ctx?`: any): *this*

**Parameters:**

Name | Type |
------ | ------ |
`event` | string |
`callback` | Function |
`ctx?` | any |

**Returns:** *this*