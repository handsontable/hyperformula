import { expect, test } from "../fixtures";
import type { DemoDescriptor } from "./demos";
import { editorTextarea } from "./drivers";

export function runBasicSuite(descriptor: DemoDescriptor): void {
  test.describe(`formula-builder: ${descriptor.framework}/${descriptor.adapter}`, () => {
    test("computes a typed formula", async ({ page }) => {
      await page.goto(descriptor.url);
      const editor = editorTextarea(page);
      await editor.waitFor({ timeout: 15_000 });
      await editor.click();
      await editor.fill("=1+2");
      await expect(page.locator("#result")).toHaveText("3", { timeout: 5_000 });
    });
  });
}
