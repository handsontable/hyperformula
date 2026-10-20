import { expect, test } from "../fixtures";
import type { DemoDescriptor } from "./demos";
import { addressInput, cells, editorTextarea } from "./drivers";

export function runBasicSuite(descriptor: DemoDescriptor): void {
  test.describe(`formula-builder: ${descriptor.framework}/${descriptor.adapter}`, () => {
    if (descriptor.kind === "editor") {
      test("computes a typed formula", async ({ page }) => {
        await page.goto(descriptor.url);
        const editor = editorTextarea(page);
        await editor.waitFor({ timeout: 15_000 });
        await editor.click();
        await editor.fill("=1+2");
        await expect(page.locator("#result")).toHaveText("3", { timeout: 5_000 });
      });

      return;
    }

    test.beforeEach(async ({ page }) => {
      await page.goto(descriptor.url);
      await cells(page, descriptor).first().waitFor({ timeout: 15_000 });
    });

    test("renders the grid and formula bar with A1 selected", async ({ page }) => {
      await expect(page.locator(".hfe-formula-bar")).toBeVisible();
      await cells(page, descriptor).first().click();
      await expect(addressInput(page)).toHaveValue("A1");
    });

    test("clicking a cell syncs the formula-bar address", async ({ page }) => {
      await cells(page, descriptor).nth(1).click();
      await expect(addressInput(page)).not.toHaveValue("A1");
    });

    test("editing a cell computes through the engine", async ({ page }) => {
      await cells(page, descriptor).first().dblclick();
      const editor = editorTextarea(page);
      await editor.waitFor({ timeout: 10_000 });
      await editor.click();
      await editor.press("ControlOrMeta+a");
      await editor.fill("=1+1");
      await page.keyboard.press("Enter");
      await expect(cells(page, descriptor).first()).toHaveText("2", { timeout: 5_000 });
    });

    test("typing on a selected cell opens the editor seeded with the char", async ({ page }) => {
      await cells(page, descriptor).first().click();
      await page.keyboard.press("9");
      const editor = editorTextarea(page);
      await editor.waitFor({ timeout: 10_000 });
      await expect(editor).toHaveValue("9");
      await page.keyboard.press("Escape");
    });
  });
}
