import { test, expect } from "@playwright/test";

// ===========================================================================
// RUNTIME: AUTOMATIC BATCHING
//
// Verifies that multiple state updates in a single event handler are
// coalesced into one synchronous re-render via the automatic batching
// mechanism (window.$__uni_batch).
// ===========================================================================

test("batching: multiple state updates in one handler produce correct final state", async ({ page }) => {
  await page.goto("/");

  const f = page.getByTestId("batching-fixture");
  await expect(f.getByTestId("batch-a")).toHaveText("0");
  await expect(f.getByTestId("batch-b")).toHaveText("0");
  await expect(f.getByTestId("batch-c")).toHaveText("0");

  // Single click updates 3 state values
  await f.getByTestId("batch-update").click();

  await expect(f.getByTestId("batch-a")).toHaveText("10");
  await expect(f.getByTestId("batch-b")).toHaveText("20");
  await expect(f.getByTestId("batch-c")).toHaveText("30");
});

test("batching: SSR renders initial values", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("batching-fixture");
  await expect(f.getByTestId("batch-a")).toHaveText("0");
  await expect(f.getByTestId("batch-b")).toHaveText("0");
  await expect(f.getByTestId("batch-c")).toHaveText("0");
});

test("batching: hydration preserves state and click works", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("batching-fixture");

  // Pre-hydration value
  await expect(f.getByTestId("batch-a")).toHaveText("0");

  // Click should work after hydration
  await f.getByTestId("batch-update").click();
  await expect(f.getByTestId("batch-a")).toHaveText("10");
});

test("batching: no runtime errors during batched updates", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text());
  });

  await page.goto("/");
  await page.waitForTimeout(200);
  await page.getByTestId("batching-fixture").getByTestId("batch-update").click();
  await page.waitForTimeout(200);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("batching: multiple batched updates accumulate correctly", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("batching-fixture");

  // First batch: a=10, b=20, c=30
  await f.getByTestId("batch-update").click();
  await expect(f.getByTestId("batch-a")).toHaveText("10");
  await expect(f.getByTestId("batch-b")).toHaveText("20");
  await expect(f.getByTestId("batch-c")).toHaveText("30");

  // Click again: same values (set, not increment)
  await f.getByTestId("batch-update").click();
  await expect(f.getByTestId("batch-a")).toHaveText("10");
  await expect(f.getByTestId("batch-b")).toHaveText("20");
  await expect(f.getByTestId("batch-c")).toHaveText("30");
});

test("batching: rapid clicks do not lose state", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("batching-fixture");

  // Click 5 times rapidly
  for (let i = 0; i < 5; i++) {
    await f.getByTestId("batch-update").click();
  }

  // All state should be consistent
  await expect(f.getByTestId("batch-a")).toHaveText("10");
  await expect(f.getByTestId("batch-b")).toHaveText("20");
  await expect(f.getByTestId("batch-c")).toHaveText("30");
});

test("batching: mutations are batched (single synchronous flush)", async ({ page }) => {
  await page.goto("/");

  // Set up a MutationObserver to count DOM mutations during the click
  await page.evaluate(() => {
    (window as any).__mutationCount = 0;
    const observer = new MutationObserver(() => {
      (window as any).__mutationCount++;
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  await page.getByTestId("batching-fixture").getByTestId("batch-update").click();

  // Allow microtask effects to flush
  await page.waitForTimeout(50);

  const count = await page.evaluate(() => (window as any).__mutationCount as number);
  // With batching, 3 state changes produce at most a few DOM mutations
  // (text node updates for a, b, c). Without batching it could be higher.
  expect(count).toBeLessThanOrEqual(5);
});

// ===========================================================================
// RUNTIME: UNMOUNT CLEANUP (Owner Tree Disposal)
//
// Verifies that when a component is removed from the DOM, its useEffect
// cleanup functions run via the owner tree disposal mechanism
// (window.$__uni_dispose + MutationObserver).
// ===========================================================================

test("unmount: child is visible after SSR + hydration", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");
  await expect(f.getByTestId("unmount-child")).toBeVisible();
  await expect(f.getByTestId("unmount-child")).toHaveText("Child visible");
});

test("unmount: toggle button hides child", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");

  await expect(f.getByTestId("unmount-child")).toBeVisible();
  await expect(f.getByTestId("unmount-showing")).toHaveText("yes");

  await f.getByTestId("unmount-toggle").click();

  await expect(f.getByTestId("unmount-child")).toBeHidden();
  await expect(f.getByTestId("unmount-showing")).toHaveText("no");
});

test("unmount: toggle button brings child back", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");

  // Hide
  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeHidden();

  // Show again
  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeVisible();
  await expect(f.getByTestId("unmount-child")).toHaveText("Child visible");
});

test("unmount: useEffect cleanup runs when child is removed", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");

  // After hydration, the child's useEffect has already run, setting __childMounted = true
  await expect(f.getByTestId("unmount-child")).toBeVisible();
  const mounted = await page.evaluate(() => (window as any).__childMounted as boolean);
  expect(mounted).toBe(true);

  // Ensure cleanupRan starts as false
  await page.evaluate(() => { (window as any).__cleanupRan = false });

  // Remove the child — this triggers owner tree disposal → cleanup runs
  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeHidden();

  // Cleanup should have run
  const cleaned = await page.evaluate(() => (window as any).__cleanupRan as boolean);
  expect(cleaned).toBe(true);
});

test("unmount: cleanup runs again on second mount/unmount cycle", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");

  // Verify child mounted during hydration
  await expect(f.getByTestId("unmount-child")).toBeVisible();

  // First cycle: unmount
  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeHidden();
  expect(await page.evaluate(() => (window as any).__cleanupRan)).toBe(true);

  // Reset flag
  await page.evaluate(() => { (window as any).__cleanupRan = false });

  // Second cycle: mount → unmount
  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeVisible();
  // Cleanup should NOT have run yet (child is still mounted)
  expect(await page.evaluate(() => (window as any).__cleanupRan)).toBe(false);

  await f.getByTestId("unmount-toggle").click();
  await expect(f.getByTestId("unmount-child")).toBeHidden();
  // Now cleanup should have run
  expect(await page.evaluate(() => (window as any).__cleanupRan)).toBe(true);
});

test("unmount: no runtime errors during mount/unmount cycles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text());
  });

  await page.goto("/");
  const f = page.getByTestId("unmount-fixture");

  // Rapid toggle 10 times
  for (let i = 0; i < 10; i++) {
    await f.getByTestId("unmount-toggle").click();
  }

  await page.waitForTimeout(300);
  expect(errors, errors.join("\n")).toEqual([]);
});

test("unmount: counter state persists through unmount cycles", async ({ page }) => {
  await page.goto("/");
  const counter = page.getByTestId("counter-fixture");

  // Increment counter
  await page.getByTestId("counter-increment").click();
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");

  // Toggle unmount fixture (different component, should not affect counter)
  const f = page.getByTestId("unmount-fixture");
  await f.getByTestId("unmount-toggle").click();
  await f.getByTestId("unmount-toggle").click();

  // Counter should still be 2
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");
});

// ===========================================================================
// CROSS-FEATURE: Batching + Unmount together
// ===========================================================================

test("batching and unmount: no errors when both features are active", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) errors.push(msg.text());
  });

  await page.goto("/");
  await page.waitForTimeout(200);

  // Batch update
  await page.getByTestId("batching-fixture").getByTestId("batch-update").click();

  // Unmount cycle
  await page.getByTestId("unmount-fixture").getByTestId("unmount-toggle").click();
  await page.getByTestId("unmount-fixture").getByTestId("unmount-toggle").click();

  // Another batch update after unmount
  await page.getByTestId("batching-fixture").getByTestId("batch-update").click();

  await page.waitForTimeout(300);
  expect(errors, errors.join("\n")).toEqual([]);
});
