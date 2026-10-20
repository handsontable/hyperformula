export type Framework = "js" | "react" | "vue" | "angular";
export type Adapter = "basic" | "plain-table" | "ag-grid" | "tanstack" | "mui";
export type DemoKind = "grid" | "editor";

export interface DemoDescriptor {
  framework: Framework;
  adapter: Adapter;
  url: string;
  kind: DemoKind;
  cell?: string;
}

const PORTS: Record<Framework, number> = {
  js: 5173,
  react: 5174,
  vue: 5175,
  angular: 5176,
};

const CELL_SELECTORS: Record<Exclude<Adapter, "basic">, string> = {
  "plain-table": ".plain-table td",
  "ag-grid": ".ag-cell",
  tanstack: "[data-row][data-col]",
  mui: ".MuiDataGrid-cell",
};

function grid(
  framework: Framework,
  adapter: Exclude<Adapter, "basic">,
  path: string,
): DemoDescriptor {
  return {
    framework,
    adapter,
    url: `http://localhost:${PORTS[framework]}${path}`,
    kind: "grid",
    cell: CELL_SELECTORS[adapter],
  };
}

export const DEMOS: DemoDescriptor[] = [
  { framework: "js", adapter: "basic", url: `http://localhost:${PORTS.js}/basic/`, kind: "editor" },
  grid("js", "plain-table", "/plain-table/"),
  grid("js", "ag-grid", "/ag-grid/"),
  grid("react", "ag-grid", "/ag-grid/"),
  grid("react", "tanstack", "/tanstack/"),
  grid("react", "mui", "/mui/"),
  grid("vue", "ag-grid", "/ag-grid/"),
  grid("angular", "ag-grid", "/ag-grid"),
];

export function findDemo(framework: Framework, adapter: Adapter): DemoDescriptor {
  const descriptor = DEMOS.find((demo) => demo.framework === framework && demo.adapter === adapter);

  if (!descriptor) {
    throw new Error(`No demo descriptor for ${framework}/${adapter}`);
  }

  return descriptor;
}
