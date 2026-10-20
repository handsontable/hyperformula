import type { Locator, Page } from "@playwright/test";
import type { DemoDescriptor } from "./demos";

export function addressInput(page: Page): Locator {
  return page.locator(".hfe-formula-bar__address-input").first();
}

export function editorTextarea(page: Page): Locator {
  return page.locator(".hfe-editor__input").first();
}

export function cells(page: Page, descriptor: DemoDescriptor): Locator {
  if (!descriptor.cell) {
    throw new Error(`Demo ${descriptor.framework}/${descriptor.adapter} has no cell selector`);
  }

  return page.locator(descriptor.cell);
}
