import { test, expect } from "@playwright/test";

// The single most important browser test for the universal library:
// SSR renders "Count: 0" and the client must hydrate in place so a click
// updates the DOM. If hydration breaks (e.g. duplicate nodes, detached
// listeners, or a re-render that wipes state), this test catches it.
test("universal counter hydrates and responds to clicks", async ({ page }) => {
  await page.goto("/");

  const value = page.getByTestId("counter-value");
  const increment = page.getByTestId("counter-increment");

  // SSR value present before hydration code even runs.
  await expect(value).toHaveText("Count: 0");

  // One click: state must update the visible DOM.
  await increment.click();
  await expect(value).toHaveText("Count: 1");

  // Multiple clicks accumulate (state persists across re-renders).
  await increment.click();
  await increment.click();
  await expect(value).toHaveText("Count: 3");

  // Reset goes back to the initial value.
  await page.getByTestId("counter-reset").click();
  await expect(value).toHaveText("Count: 0");
});

test("no universal runtime errors on the page", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await page.waitForTimeout(300);

  // The universal runtime surfaces problems via $__uni_error; a healthy page
  // has zero console errors and zero uncaught exceptions.
  expect(errors, errors.join("\n")).toEqual([]);
});
