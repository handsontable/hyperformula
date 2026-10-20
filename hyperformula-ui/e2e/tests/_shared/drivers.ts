import type { Locator, Page } from "@playwright/test";

export function editorTextarea(page: Page): Locator {
  return page.locator(".hfe-editor__input").first();
}
