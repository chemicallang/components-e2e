import { test, expect } from "@playwright/test";

// SSR assertions: load the page with JavaScript DISABLED so only the
// server-rendered HTML is present. These are the "SSR assertion before
// JavaScript runs" checks the professionalization plan requires, and they
// catch SSR/client parity regressions that hydration would otherwise mask.

test("SSR: object-element .map() lists render before JS", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");

  const list = page.getByTestId("keyed-list");
  const items = list.locator("li");
  await expect(items).toHaveCount(3);
  await expect(list).toContainText("Alpha");
  await expect(list).toContainText("Beta");
  await expect(list).toContainText("Gamma");

  await ctx.close();
});

test("SSR: static component content renders before JS", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");

  // Accordion items (static trigger/content children).
  const acc = page.getByTestId("accordion-fixture");
  await expect(acc).toContainText("What is Chemical");

  // Tabs array mode (props array .map()).
  await expect(page.locator('[role="tabpanel"]').first()).toContainText("Panel A");

  await ctx.close();
});

test("SSR: derived .filter() list renders before JS", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/");

  // `var filtered = items.filter(it => it.includes(query))` resolves at SSR
  // (query defaults to ""), so all elements render before hydration.
  const list = page.getByTestId("probe-list");
  await expect(list.locator("li")).toHaveCount(3);
  await expect(list).toContainText("Apple");
  await expect(page.getByTestId("probe-count")).toHaveText("3");

  await ctx.close();
});
