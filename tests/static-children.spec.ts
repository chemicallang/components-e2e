import { test, expect } from "@playwright/test";

// Directly-passed static children of a top-level component (html_cbi path).
// These are emitted as client vnodes now, not as an SSR HTML blob in the JS
// bundle; hydration must adopt the existing DOM without duplicating it.

test.describe("Top-level component static children", () => {
  test("SSR: static children render before JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");

    const host = page.getByTestId("static-children-host");
    await expect(host.getByTestId("sc-child")).toHaveText("hello");
    await expect(host.getByTestId("sc-child2")).toHaveText("world");
    await expect(host.getByTestId("sc-child2")).toHaveAttribute("data-n", "2");

    await ctx.close();
  });

  test("hydration: static children are adopted without duplication", async ({ page }) => {
    await page.goto("/");

    const host = page.getByTestId("static-children-host");
    await expect(host.locator('[data-testid="sc-child"]')).toHaveCount(1);
    await expect(host.locator('[data-testid="sc-child2"]')).toHaveCount(1);
    await expect(host.getByTestId("sc-child")).toHaveText("hello");
    await expect(host.getByTestId("sc-child2")).toHaveText("world");
  });
});
