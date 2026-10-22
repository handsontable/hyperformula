import { HyperFormula } from "hyperformula";

export const ROWS = 100;
export const COLS = 18;

export function makeSampleData(): (number | string)[][] {
  const data: (number | string)[][] = [];

  for (let row = 0; row < ROWS; row++) {
    const rowData: (number | string)[] = [];

    for (let col = 0; col < COLS; col++) {
      rowData.push((row + 1) * (col + 1));
    }
    data.push(rowData);
  }

  const row10 = data[10];
  const row11 = data[11];
  const row12 = data[12];
  const rowLast = data[ROWS - 1];

  if (row10 && row11 && row12 && rowLast) {
    row10[0] = "=SUM(A1:A10)";
    row10[1] = "=AVERAGE(B1:B10)";
    row11[0] = "=MAX(A1:H10)";
    row12[0] =
      '=ROUND(B2 * C2 + N("price * qty") - B2 * C2 * D2 + N("less discount") + (B2 * C2 - B2 * C2 * D2) * 0.23 + N("VAT 23%"), 2)';
    rowLast[COLS - 1] = "=SUM(A1:A10) + MAX(A1:H10)";
  }

  return data;
}

export function seedNamedExpressions(engine: HyperFormula, sheetName = "Sheet1"): void {
  engine.addNamedExpression("TaxRate", "=0.23");
  engine.addNamedExpression("Region", '="North"');
  engine.addNamedExpression("FirstCell", `='${sheetName}'!$A$1`);
  engine.addNamedExpression("SalesRange", `='${sheetName}'!$A$1:$A$10`);
  engine.addNamedExpression("ColumnA", `='${sheetName}'!$A:$A`);
}

export function buildHyperFormula(): HyperFormula {
  const engine = HyperFormula.buildFromArray(makeSampleData(), {
    licenseKey: "gpl-v3",
  });

  seedNamedExpressions(engine);

  return engine;
}

export function formatResult(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object" && value !== null && "type" in (value as object)) {
    const err = value as { value?: string; type?: string; message?: string };
    const label = err.value ?? `#${err.type ?? "ERROR"}`;

    return `${label}${err.message ? ` (${err.message})` : ""}`;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/\.?0+$/, "");
  }
  return String(value);
}

export function evaluateFormula(engine: HyperFormula, formula: string, sheetId = 0): string {
  const trimmed = formula.trim();

  if (!trimmed) {
    return "";
  }
  try {
    const value = engine.calculateFormula(
      trimmed.startsWith("=") ? trimmed : `=${trimmed}`,
      sheetId,
    );

    return formatResult(value);
  } catch (error) {
    return `#ERR (${(error as Error).message})`;
  }
}
