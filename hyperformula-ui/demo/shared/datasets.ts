import { HyperFormula } from "hyperformula";

export type ScenarioRow = (string | number)[];

export interface ScenarioMeta {
  id: string;
  title: string;
  sheetName: string;
  columnLabels: string[];
}

function repeat(count: number, make: (row: number) => ScenarioRow): ScenarioRow[] {
  const out: ScenarioRow[] = [];

  for (let index = 0; index < count; index++) {
    out.push(make(index + 1));
  }

  return out;
}

function cycle<Seed>(
  seed: Seed[],
  targetRows: number,
  make: (item: Seed, row: number) => ScenarioRow,
): ScenarioRow[] {
  if (seed.length === 0) {
    throw new Error("cycle: seed must not be empty");
  }

  return Array.from({ length: targetRows }, (_, index) => {
    const item = seed[index % seed.length];

    if (item === undefined) {
      throw new Error(`cycle: no item at index ${index % seed.length}`);
    }

    return make(item, index + 1);
  });
}

export const portfolioMeta: ScenarioMeta = {
  id: "portfolio",
  title: "Investment portfolio",
  sheetName: "Portfolio",
  columnLabels: [
    "Ticker",
    "Shares",
    "Avg cost",
    "Price",
    "Market value",
    "Gain $",
    "Gain %",
    "Weight %",
  ],
};

const PORTFOLIO_SEED: [string, number, number, number][] = [
  ["AAPL", 120, 165.2, 228.5],
  ["MSFT", 80, 290.1, 415.3],
  ["NVDA", 60, 110.4, 135.9],
  ["AMZN", 50, 140.0, 197.4],
  ["GOOGL", 40, 125.3, 178.2],
  ["TSLA", 30, 210.0, 185.6],
  ["META", 25, 320.5, 540.1],
  ["JPM", 70, 150.2, 205.8],
  ["V", 45, 245.0, 278.4],
  ["UNH", 35, 480.5, 512.0],
  ["JNJ", 90, 158.3, 152.1],
  ["PG", 55, 162.0, 168.7],
  ["KO", 100, 58.4, 62.3],
  ["XOM", 65, 98.2, 112.5],
  ["DIS", 40, 112.0, 95.8],
];

export function buildPortfolioRows(rowCount: number): ScenarioRow[] {
  return cycle(PORTFOLIO_SEED, rowCount, ([ticker, shares, cost, price], row) => [
    ticker,
    shares,
    cost,
    price,
    `=B${row}*D${row}`,
    `=(D${row}-C${row})*B${row}`,
    `=(D${row}-C${row})/C${row}`,
    `=E${row}/SUM(E$1:E$${rowCount})`,
  ]);
}

export const pipelineMeta: ScenarioMeta = {
  id: "pipeline",
  title: "Sales pipeline (CRM)",
  sheetName: "Sales pipeline\\",
  columnLabels: ["Deal", "Account", "Stage", "Amount", "Probability", "Weighted", "Forecast"],
};

const PIPELINE_SEED: [string, string, string, number, number][] = [
  ["Platform renewal", "Northwind", "Negotiation", 48000, 0.9],
  ["Pilot rollout", "Contoso", "Proposal", 22000, 0.6],
  ["Seat expansion", "Fabrikam", "Qualified", 15000, 0.4],
  ["New logo", "Tailspin", "Lead", 60000, 0.2],
  ["Upsell add-on", "Adventure Works", "Negotiation", 9000, 0.85],
  ["Multi-year deal", "Wingtip", "Proposal", 120000, 0.55],
  ["Migration project", "Litware", "Won", 34000, 1],
];

export function buildPipelineRows(rowCount: number): ScenarioRow[] {
  return cycle(PIPELINE_SEED, rowCount, ([deal, account, stage, amount, probability], row) => [
    deal,
    account,
    stage,
    amount,
    probability,
    `=D${row}*E${row}`,
    `=IF(E${row}>=0.8,"Commit",IF(E${row}>=0.5,"Best case","Pipeline"))`,
  ]);
}

export const invoiceMeta: ScenarioMeta = {
  id: "invoice",
  title: "Invoice builder",
  sheetName: "Invoice",
  columnLabels: ["Item", "Qty", "Unit price", "Line total"],
};

const INVOICE_SEED: [string, number, number][] = [
  ["Design retainer", 12, 95],
  ["Frontend dev", 80, 110],
  ["Backend dev", 64, 120],
  ["QA & testing", 24, 85],
  ["Project mgmt", 16, 100],
];

export function buildInvoiceRows(itemCount = 100): ScenarioRow[] {
  const rows = cycle(INVOICE_SEED, itemCount, ([item, qty, price], row) => [
    item,
    qty,
    price,
    `=B${row}*C${row}`,
  ]);
  const subtotalRow = itemCount + 1;
  const vatRow = subtotalRow + 1;

  rows.push(["", "", "Subtotal", `=SUM(D1:D${itemCount})`]);
  rows.push(["", "", "VAT 23%", `=D${subtotalRow}*0.23`]);
  rows.push(["", "", "Total", `=D${subtotalRow}+D${vatRow}`]);

  return rows;
}

export const gradebookMeta: ScenarioMeta = {
  id: "gradebook",
  title: "Student gradebook",
  sheetName: "Grades",
  columnLabels: ["Student", "Homework", "Midterm", "Final", "Weighted", "Grade"],
};

const GRADEBOOK_SEED: [string, number, number, number][] = [
  ["Ava", 92, 88, 95],
  ["Ben", 74, 69, 81],
  ["Cara", 60, 55, 64],
  ["Dan", 85, 90, 78],
  ["Eve", 48, 52, 59],
  ["Finn", 100, 96, 99],
  ["Grace", 78, 82, 88],
  ["Hiro", 65, 71, 74],
  ["Isla", 91, 87, 93],
  ["Jude", 55, 60, 62],
];

export function buildGradebookRows(rowCount: number): ScenarioRow[] {
  return cycle(GRADEBOOK_SEED, rowCount, ([name, homework, midterm, final], row) => [
    name,
    homework,
    midterm,
    final,
    `=B${row}*0.3+C${row}*0.3+D${row}*0.4`,
    `=IF(E${row}>=90,"A",IF(E${row}>=80,"B",IF(E${row}>=70,"C",IF(E${row}>=60,"D","F"))))`,
  ]);
}

export const loanMeta: ScenarioMeta = {
  id: "loan",
  title: "Loan amortization",
  sheetName: "Loan",
  columnLabels: ["Month", "Payment", "Interest", "Principal", "Balance"],
};

export const LOAN_MONTHS = 120;
export const LOAN_PRINCIPAL = 20000;

const LOAN_MONTHLY_RATE = 0.069 / 12;

export function buildLoanRows(): ScenarioRow[] {
  return repeat(LOAN_MONTHS, (row) => {
    const priorBalance = row === 1 ? String(LOAN_PRINCIPAL) : `E${row - 1}`;

    return [
      row,
      `=PMT(${LOAN_MONTHLY_RATE},${LOAN_MONTHS},-${LOAN_PRINCIPAL})`,
      `=${priorBalance}*${LOAN_MONTHLY_RATE}`,
      `=B${row}-C${row}`,
      `=${priorBalance}-D${row}`,
    ];
  });
}

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
    const err = value as { type?: string; message?: string };

    return `#${err.type ?? "ERROR"}${err.message ? ` (${err.message})` : ""}`;
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
