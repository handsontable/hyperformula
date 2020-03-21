

export enum ColumnReferenceType {
  COLUMN_RELATIVE = 'COLUMN_RELATIVE',
  COLUMN_ABSOLUTE = 'COLUMN_ABSOLUTE',
}

export class ColumnAddress {
  private constructor(
    public readonly sheet: number | null,
    public readonly col: number,
    public readonly type: ColumnReferenceType
  ) {}

  public static absolute(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ColumnReferenceType.COLUMN_ABSOLUTE)
  }

  public static relative(sheet: number | null, column: number) {
    return new ColumnAddress(sheet, column, ColumnReferenceType.COLUMN_RELATIVE)
  }
}
