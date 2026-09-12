import { test, expect } from "@playwright/test";

// Nested components whose root is not a single element (a fragment / multiple
// nodes) stress hydration adoption. The runtime must consume the component's
// whole SSR node range, not just the first element's next sibling, or the
// parent's sibling hydration shifts and patches the wrong nodes.

test.describe("Nested component root shapes", () => {
  test("SSR: fragment-root nested component renders all nodes before JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/");

    const root = page.getByTestId("root-shapes-fixture");
    await expect(root.getByTestId("frag-one")).toHaveText("one");
    await expect(root.getByTestId("frag-two")).toHaveText("two");
    await expect(root.getByTestId("root-shapes-next")).toHaveText("next");

    await ctx.close();
  });

  test("hydration: fragment-root nested component adopts SSR nodes and keeps siblings aligned", async ({ page }) => {
    await page.goto("/");

    const root = page.getByTestId("root-shapes-fixture");
    await expect(root.getByTestId("frag-one")).toHaveText("one");
    await expect(root.getByTestId("frag-two")).toHaveText("two");
    // The sibling after the fragment must remain the real SSR node.
    await expect(root.getByTestId("root-shapes-next")).toHaveText("next");
    // Adoption must not duplicate the fragment's nodes.
    await expect(root.locator('[data-testid="frag-one"]')).toHaveCount(1);
    await expect(root.locator('[data-testid="frag-two"]')).toHaveCount(1);
  });

  test("fresh mount: fragment-root nested component renders after toggle", async ({ page }) => {
    await page.goto("/");

    const root = page.getByTestId("root-shapes-fixture");
    await root.getByTestId("root-shapes-toggle").click();
    await expect(root.locator('[data-testid="frag-one"]')).toHaveCount(2);
    await expect(root.locator('[data-testid="frag-two"]')).toHaveCount(2);
    await expect(root.getByTestId("root-shapes-next")).toHaveText("next");
  });
});
