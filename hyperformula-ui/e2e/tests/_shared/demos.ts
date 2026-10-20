export type Framework = "js";
export type Adapter = "basic";

export interface DemoDescriptor {
  framework: Framework;
  adapter: Adapter;
  url: string;
}

const PORTS: Record<Framework, number> = {
  js: 5173,
};

export const DEMOS: DemoDescriptor[] = [
  { framework: "js", adapter: "basic", url: `http://localhost:${PORTS.js}/basic/` },
];

export function findDemo(framework: Framework, adapter: Adapter): DemoDescriptor {
  const descriptor = DEMOS.find((demo) => demo.framework === framework && demo.adapter === adapter);

  if (!descriptor) {
    throw new Error(`No demo descriptor for ${framework}/${adapter}`);
  }

  return descriptor;
}
