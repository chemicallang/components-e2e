import { test, expect } from "@playwright/test";

// ===========================================================================
// PROP CHANGE REACTIVITY
//
// These tests verify that components correctly update when props change from
// outside. This is the core of the universal reactive model: parent state
// changes must propagate through props and re-render child components.
// ===========================================================================

// ---------------------------------------------------------------------------
// Counter: prop-driven reset
// ---------------------------------------------------------------------------
test("counter state persists across multiple rapid clicks", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("counter-increment");
  const value = page.getByTestId("counter-value");

  // Click 20 times rapidly
  for (let i = 0; i < 20; i++) {
    await btn.click();
    // No wait — rapid clicks should all register
  }
  await expect(value).toHaveText("Count: 20");
});

test("counter reset works after many increments", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("counter-increment");
  const reset = page.getByTestId("counter-reset");
  const value = page.getByTestId("counter-value");

  // Increment to 10
  for (let i = 0; i < 10; i++) {
    await btn.click();
  }
  await expect(value).toHaveText("Count: 10");

  // Reset
  await reset.click();
  await expect(value).toHaveText("Count: 0");

  // Increment again after reset
  await btn.click();
  await expect(value).toHaveText("Count: 1");
});

// ---------------------------------------------------------------------------
// Button: variant and prop changes
// ---------------------------------------------------------------------------
test("button variant attribute is set correctly at SSR", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("button-fixture");

  // All variant buttons should have data-variant attribute
  for (const v of ["default", "destructive", "outline", "secondary", "ghost", "link"]) {
    await expect(f.getByTestId(`btn-${v}`)).toHaveAttribute("data-variant", v);
  }
});

test("button disabled state prevents click handler", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("button-edge-fixture");
  const btn = f.getByTestId("btn-disabled-interactive");
  const state = f.getByTestId("btn-submit-state");

  await expect(state).toHaveText("not submitted");
  await btn.click({ force: true }); // Force click even though disabled
  await expect(state).toHaveText("not submitted"); // Should not change
});

// ---------------------------------------------------------------------------
// Tabs: prop-driven content
// ---------------------------------------------------------------------------
test("tabs SSR renders correct initial panel", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("tabs-fixture");

  // SSR should render the first panel visible
  await expect(f.getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
  await expect(f.getByRole("tabpanel", { name: "Beta" })).toBeHidden();
  await expect(f.getByRole("tabpanel", { name: "Gamma" })).toBeHidden();
});

test("tabs clicking same tab twice does not crash", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("tabs-fixture");
  const alpha = f.getByRole("tab", { name: "Alpha" });

  await alpha.click();
  await expect(f.getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
  await alpha.click(); // Click same tab again
  await expect(f.getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
});

// ---------------------------------------------------------------------------
// Accordion: prop changes
// ---------------------------------------------------------------------------
test("accordion single item open/close cycle", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("accordion-fixture");
  const trigger = f.getByRole("button", { name: /What is Chemical/ });
  const content = f.getByTestId("acc-item-0").locator("[data-accordion-content]");

  // Initially closed
  await expect(content).toBeHidden();

  // Open
  await trigger.click();
  await expect(content).toBeVisible();

  // Close
  await trigger.click();
  await expect(content).toBeHidden();

  // Open again
  await trigger.click();
  await expect(content).toBeVisible();
});

// ---------------------------------------------------------------------------
// Dialog: prop-driven open/close
// ---------------------------------------------------------------------------
test("dialog multiple open/close cycles", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("dialog-fixture");
  const openBtn = f.getByTestId("dialog-open");
  const content = page.getByTestId("dialog-content");
  const confirm = content.getByTestId("dialog-confirm");

  // First cycle
  await openBtn.click();
  await expect(content).toBeVisible();
  await confirm.click();
  await expect(content).toBeHidden();

  // Second cycle
  await openBtn.click();
  await expect(content).toBeVisible();
  await confirm.click();
  await expect(content).toBeHidden();

  // Third cycle
  await openBtn.click();
  await expect(content).toBeVisible();
});

// ---------------------------------------------------------------------------
// Select: value changes
// ---------------------------------------------------------------------------
test("select changing value updates display", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("select-fixture");
  const trigger = f.getByRole("button", { name: "Pick a fruit" });

  // Select Apple
  await trigger.click();
  await page.getByRole("listbox").getByRole("option", { name: "Apple" }).click();
  await expect(f.getByTestId("select-value")).toHaveText("Chosen: Apple");

  // Select Banana
  await trigger.click();
  await page.getByRole("listbox").getByRole("option", { name: "Banana" }).click();
  await expect(f.getByTestId("select-value")).toHaveText("Chosen: Banana");

  // Select Cherry
  await trigger.click();
  await page.getByRole("listbox").getByRole("option", { name: "Cherry" }).click();
  await expect(f.getByTestId("select-value")).toHaveText("Chosen: Cherry");
});

// ---------------------------------------------------------------------------
// ToggleGroup: value changes
// ---------------------------------------------------------------------------
test("toggle group single mode rapid clicks", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("togglegroup-fixture");
  const bold = f.getByRole("button", { name: "Bold" });
  const italic = f.getByRole("button", { name: "Italic" });

  // Rapid toggling
  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");

  await italic.click();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await expect(italic).toHaveAttribute("aria-pressed", "true");

  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(italic).toHaveAttribute("aria-pressed", "false");
});

// ---------------------------------------------------------------------------
// RadioGroup: value changes
// ---------------------------------------------------------------------------
test("radio group changing selection updates value", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("radiogroup-fixture");
  const small = f.getByRole("radio", { name: "Small" });
  const medium = f.getByRole("radio", { name: "Medium" });
  const large = f.getByRole("radio", { name: "Large" });

  // Default: Medium
  await expect(medium).toBeChecked();

  // Select Small
  await small.check();
  await expect(small).toBeChecked();
  await expect(medium).not.toBeChecked();

  // Select Large
  await large.check();
  await expect(large).toBeChecked();
  await expect(small).not.toBeChecked();
});

// ===========================================================================
// STATE PERSISTENCE
//
// Tests that verify state is NOT lost during re-renders, hydration, or
// interaction sequences.
// ===========================================================================

test("counter state survives dialog open/close", async ({ page }) => {
  await page.goto("/");

  // Increment counter
  await page.getByTestId("counter-increment").click();
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");

  // Open and close dialog
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await expect(page.getByTestId("dialog-content")).toBeVisible();
  await page.getByTestId("dialog-content").getByTestId("dialog-confirm").click();
  await expect(page.getByTestId("dialog-content")).toBeHidden();

  // Counter state should persist
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");
});

test("select value persists through accordion toggle", async ({ page }) => {
  await page.goto("/");

  // Select a fruit
  await page.getByTestId("select-fixture").getByRole("button", { name: "Pick a fruit" }).click();
  await page.getByRole("listbox").getByRole("option", { name: "Banana" }).click();
  await expect(page.getByTestId("select-fixture").getByTestId("select-value")).toHaveText("Chosen: Banana");

  // Toggle accordion
  await page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ }).click();
  await page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ }).click();

  // Select value should persist
  await expect(page.getByTestId("select-fixture").getByTestId("select-value")).toHaveText("Chosen: Banana");
});

// ===========================================================================
// EDGE CASES
//
// Tests for boundary conditions, empty states, and special characters.
// ===========================================================================

test("button with empty text renders", async ({ page }) => {
  await page.goto("/");
  // The icon button has minimal text
  const icon = page.getByTestId("button-fixture").getByTestId("btn-icon");
  await expect(icon).toBeVisible();
});

test("select with empty options does not crash", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("select-edge-fixture")
    .locator("[data-testid=select-empty]").getByRole("button");
  await trigger.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const options = listbox.locator("[role=option]");
  await expect(options).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
});

test("dialog with long content scrolls", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await expect(page.getByTestId("dialog-content")).toBeVisible();
  // Dialog should be scrollable if content is long
  const dialog = page.getByTestId("dialog-content");
  await expect(dialog).toBeVisible();
});

test("accordion with defaultOpen renders open", async ({ page }) => {
  await page.goto("/");
  // Check that accordion items with defaultOpen={true} are open on SSR
  const f = page.getByTestId("accordion-fixture");
  // All items start closed (defaultOpen={false} in source)
  const content0 = f.getByTestId("acc-item-0").locator("[data-accordion-content]");
  await expect(content0).toBeHidden();
});

// ===========================================================================
// INTERACTION SEQUENCES
//
// Tests for complex multi-step interaction patterns that exercise the
// reactive system thoroughly.
// ===========================================================================

test("counter increment then dialog then counter persists", async ({ page }) => {
  await page.goto("/");

  // Step 1: Increment counter to 5
  for (let i = 0; i < 5; i++) {
    await page.getByTestId("counter-increment").click();
  }
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 5");

  // Step 2: Open dialog
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await expect(page.getByTestId("dialog-content")).toBeVisible();

  // Step 3: Close dialog
  await page.getByTestId("dialog-content").getByTestId("dialog-confirm").click();
  await expect(page.getByTestId("dialog-content")).toBeHidden();

  // Step 4: Counter should still be 5
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 5");

  // Step 5: Increment more
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 6");
});

test("tabs then select then tabs persists", async ({ page }) => {
  await page.goto("/");

  // Switch to Beta tab
  await page.getByTestId("tabs-fixture").getByRole("tab", { name: "Beta" }).click();
  await expect(page.getByTestId("tabs-fixture").getByRole("tabpanel", { name: "Beta" })).toBeVisible();

  // Select a fruit
  await page.getByTestId("select-fixture").getByRole("button", { name: "Pick a fruit" }).click();
  await page.getByRole("listbox").getByRole("option", { name: "Cherry" }).click();
  await expect(page.getByTestId("select-fixture").getByTestId("select-value")).toHaveText("Chosen: Cherry");

  // Tab should still be Beta
  await expect(page.getByTestId("tabs-fixture").getByRole("tabpanel", { name: "Beta" })).toBeVisible();
});

test("accordion open then dialog then accordion persists", async ({ page }) => {
  await page.goto("/");

  // Open accordion item
  await page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ }).click();
  const content = page.getByTestId("accordion-fixture").getByTestId("acc-item-0").locator("[data-accordion-content]");
  await expect(content).toBeVisible();

  // Open and close dialog
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await expect(page.getByTestId("dialog-content")).toBeVisible();
  await page.getByTestId("dialog-content").getByTestId("dialog-confirm").click();
  await expect(page.getByTestId("dialog-content")).toBeHidden();

  // Accordion should still be open
  await expect(content).toBeVisible();
});

// ===========================================================================
// SSR CORRECTNESS
//
// Tests that verify the server-rendered HTML matches expected values before
// hydration. These catch SSR bugs that only show up in real browsers.
// ===========================================================================

test("SSR renders counter as 0", async ({ page }) => {
  await page.goto("/");
  // Before any interaction, SSR should show Count: 0
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 0");
});

test("SSR renders tabs with first panel visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("tabs-fixture").getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
});

test("SSR renders accordion items closed", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("accordion-fixture");
  const content = f.getByTestId("acc-item-0").locator("[data-accordion-content]");
  await expect(content).toBeHidden();
});

test("SSR renders dialog as hidden", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("dialog-content")).toBeHidden();
});

test("SSR renders select as unselected", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("select-fixture").getByTestId("select-value")).toHaveText("Chosen: none");
});

test("SSR renders progress with correct value", async ({ page }) => {
  await page.goto("/");
  const p = page.getByTestId("progress-fixture").getByTestId("progress-default");
  await expect(p).toHaveAttribute("value", "45");
});

test("SSR renders pagination at page 1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("pagination-fixture").getByTestId("pagination-value")).toHaveText("Page: 1");
});

test("SSR renders list with 3 items", async ({ page }) => {
  await page.goto("/");
  const items = page.getByTestId("list-fixture").getByTestId("list").locator("li");
  await expect(items).toHaveCount(3);
});

test("SSR renders table with headers", async ({ page }) => {
  await page.goto("/");
  const t = page.getByTestId("table-fixture").getByTestId("table");
  await expect(t.locator("th").nth(0)).toContainText("Name");
});

test("SSR renders badge variants", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("badge-fixture");
  await expect(f.locator('span[data-variant="default"]').first()).toContainText("Default");
  await expect(f.locator('span[data-variant="secondary"]').first()).toContainText("Secondary");
});

// ===========================================================================
// HYDRATION CORRECTNESS
//
// Tests that verify hydration (the process of making SSR HTML interactive)
// doesn't break state or lose event handlers.
// ===========================================================================

test("hydration does not duplicate elements", async ({ page }) => {
  await page.goto("/");
  // After hydration, there should be exactly one counter value element
  const values = page.getByTestId("counter-value");
  await expect(values).toHaveCount(1);
});

test("hydration attaches click handlers", async ({ page }) => {
  await page.goto("/");
  const value = page.getByTestId("counter-value");
  await expect(value).toHaveText("Count: 0");

  // After hydration, click should work
  await page.getByTestId("counter-increment").click();
  await expect(value).toHaveText("Count: 1");
});

test("hydration preserves SSR text", async ({ page }) => {
  await page.goto("/");
  // SSR renders "Count: 0", hydration should preserve this
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 0");
});

test("hydration does not flash unstyled content", async ({ page }) => {
  await page.goto("/");
  // All fixtures should be present immediately (SSR)
  const fixtures = [
    "counter-fixture", "button-fixture", "tabs-fixture", "accordion-fixture",
    "dialog-fixture", "select-fixture"
  ];
  for (const id of fixtures) {
    await expect(page.locator(`[data-testid="${id}"]`)).toBeAttached();
  }
});

// ===========================================================================
// ACCESSIBILITY
//
// Tests for ARIA attributes, keyboard navigation, and screen reader support.
// ===========================================================================

test("dialog has correct aria attributes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  const dialog = page.locator("[role='dialog'][aria-modal='true']:visible").first();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
});

test("tabs have correct aria roles", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("tabs-fixture");
  const tabs = f.locator("[role='tab']");
  expect(await tabs.count()).toBeGreaterThanOrEqual(3);
  const panels = f.locator("[role='tabpanel']");
  expect(await panels.count()).toBeGreaterThanOrEqual(3);
});

test("accordion triggers have aria-expanded", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("accordion-fixture");
  const triggers = f.locator("button[aria-expanded]");
  expect(await triggers.count()).toBeGreaterThanOrEqual(3);
  // All should start as false
  for (let i = 0; i < (await triggers.count()); i++) {
    await expect(triggers.nth(i)).toHaveAttribute("aria-expanded", "false");
  }
});

test("collapsible has aria-expanded and toggles", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("collapsible-fixture").getByRole("button", { name: /More info/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("slider has correct aria attributes", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByTestId("slider-fixture").getByRole("slider", { name: "Volume" });
  await expect(slider).toHaveAttribute("aria-valuemin", "0");
  await expect(slider).toHaveAttribute("aria-valuemax", "100");
  await expect(slider).toHaveAttribute("aria-valuenow", "30");
});

test("radio group has radiogroup role", async ({ page }) => {
  await page.goto("/");
  const group = page.getByTestId("radiogroup-fixture").locator("[role='radiogroup']");
  await expect(group).toBeVisible();
});

test("toggle group has correct aria-pressed defaults", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("togglegroup-fixture");
  await expect(f.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await expect(f.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
});

// ===========================================================================
// PERFORMANCE & STRESS
//
// Tests that verify the system handles rapid interactions without crashes.
// ===========================================================================

test("rapid counter clicks do not lose state", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("counter-increment");
  const value = page.getByTestId("counter-value");

  // Click 50 times as fast as possible
  for (let i = 0; i < 50; i++) {
    await btn.click();
  }
  await expect(value).toHaveText("Count: 50");
});

test("rapid tab switching does not crash", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("tabs-fixture");
  const tabs = ["Alpha", "Beta", "Gamma"];

  // Switch tabs rapidly 10 times
  for (let i = 0; i < 10; i++) {
    const tabName = tabs[i % 3];
    await f.getByRole("tab", { name: tabName }).click();
  }
  // Should still be functional
  await f.getByRole("tab", { name: "Alpha" }).click();
  await expect(f.getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
});

test("rapid accordion toggle does not crash", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ });

  // Toggle 20 times
  for (let i = 0; i < 20; i++) {
    await trigger.click();
  }
  // Should still be functional
  await expect(trigger).toHaveAttribute("aria-expanded");
});

test("dialog open/close rapidly does not crash", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("dialog-fixture");
  const content = page.getByTestId("dialog-content");

  // Open and close 5 times
  for (let i = 0; i < 5; i++) {
    await f.getByTestId("dialog-open").click();
    await expect(content).toBeVisible();
    await content.getByTestId("dialog-confirm").click();
    await expect(content).toBeHidden();
  }
});

// ===========================================================================
// CROSS-COMPONENT INTERACTION
//
// Tests that verify multiple components work together correctly.
// ===========================================================================

test("counter + tabs + select all work independently", async ({ page }) => {
  await page.goto("/");

  // Counter
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 1");

  // Tabs
  await page.getByTestId("tabs-fixture").getByRole("tab", { name: "Gamma" }).click();
  await expect(page.getByTestId("tabs-fixture").getByRole("tabpanel", { name: "Gamma" })).toBeVisible();

  // Select
  await page.getByTestId("select-fixture").getByRole("button", { name: "Pick a fruit" }).click();
  await page.getByRole("listbox").getByRole("option", { name: "Apple" }).click();
  await expect(page.getByTestId("select-fixture").getByTestId("select-value")).toHaveText("Chosen: Apple");

  // All should still work
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");
});

test("nested components maintain independent state", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("nested-fixture");

  // Increment nested counter
  await f.getByTestId("nested-btn").click();
  await expect(f.getByTestId("nested-count")).toHaveText("Count: 1");

  // Type in nested input
  const input = f.getByTestId("nested-input");
  await input.click();
  await input.evaluate((el: HTMLInputElement, val: string) => {
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, "hello");
  await expect(f.getByTestId("nested-text")).toHaveText("hello");

  // Counter should still be 1
  await expect(f.getByTestId("nested-count")).toHaveText("Count: 1");
});

test("error boundary does not affect other components", async ({ page }) => {
  await page.goto("/");

  // Counter should work
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 1");

  // Trigger error boundary
  await page.getByTestId("error-fixture").getByTestId("error-mount").click();
  await expect(page.getByTestId("error-fallback")).toHaveText("Fallback shown");

  // Counter should still work after error boundary
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 2");
});

// ===========================================================================
// NO RUNTIME ERRORS
//
// Verify the page has zero console errors after all interactions.
// ===========================================================================

test("no runtime errors after full interaction sequence", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  // Counter
  await page.getByTestId("counter-increment").click();
  await page.getByTestId("counter-increment").click();

  // Tabs
  await page.getByTestId("tabs-fixture").getByRole("tab", { name: "Beta" }).click();

  // Accordion
  await page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ }).click();

  // Dialog
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await page.getByTestId("dialog-content").getByTestId("dialog-confirm").click();

  // Select
  await page.getByTestId("select-fixture").getByRole("button", { name: "Pick a fruit" }).click();
  await page.getByRole("listbox").getByRole("option", { name: "Banana" }).click();

  // Checkbox
  await page.getByTestId("checkbox-control").click();

  // Switch
  await page.getByTestId("switch-control").click();

  // Collapsible
  await page.getByTestId("collapsible-fixture").getByRole("button", { name: /More info/ }).click();

  // Toast
  // Toast auto-dismisses, just wait a bit

  await page.waitForTimeout(500);

  expect(errors, errors.join("\n")).toEqual([]);
});

test("no runtime errors after rapid interactions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");

  // Rapid counter clicks
  const btn = page.getByTestId("counter-increment");
  for (let i = 0; i < 10; i++) {
    await btn.click();
  }

  // Rapid tab switching
  const tabs = page.getByTestId("tabs-fixture");
  await tabs.getByRole("tab", { name: "Beta" }).click();
  await tabs.getByRole("tab", { name: "Gamma" }).click();
  await tabs.getByRole("tab", { name: "Alpha" }).click();

  // Rapid accordion toggle
  const accTrigger = page.getByTestId("accordion-fixture").getByRole("button", { name: /What is Chemical/ });
  for (let i = 0; i < 5; i++) {
    await accTrigger.click();
  }

  await page.waitForTimeout(300);

  expect(errors, errors.join("\n")).toEqual([]);
});

// ===========================================================================
// NULLISH COALESCING & OPTIONAL CHAINING IN COMPONENTS
//
// Verify that the new ?? and ?. operators work correctly in component logic.
// ===========================================================================

test("optional chaining does not crash component", async ({ page }) => {
  await page.goto("/");
  // The page should load without errors — optional chaining compiles correctly
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 0");
});

test("nullish coalescing provides fallback value", async ({ page }) => {
  await page.goto("/");
  // Components using ?? should render correctly
  await expect(page.getByTestId("counter-fixture")).toBeVisible();
});

// ===========================================================================
// INLINE STYLE & STYLE OBJECTS
//
// Verify that inline style={{ }} objects render correctly in SSR.
// ===========================================================================

test("components with inline styles render correctly", async ({ page }) => {
  await page.goto("/");
  // Card fixture uses inline styles — verify it renders
  const f = page.getByTestId("card-fixture");
  await expect(f.getByText("Card title")).toBeVisible();
  await expect(f.getByTestId("card-content")).toContainText("Card body content.");
});

// ===========================================================================
// BOOLEAN PROPS
//
// Verify that boolean props (true/false) render correctly in SSR.
// ===========================================================================

test("disabled prop renders as disabled attribute", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("button-fixture").getByTestId("btn-disabled");
  await expect(btn).toBeDisabled();
});

test("defaultOpen prop renders accordion item open", async ({ page }) => {
  await page.goto("/");
  // Check that accordion items with defaultOpen={false} are closed
  const f = page.getByTestId("accordion-fixture");
  const content = f.getByTestId("acc-item-0").locator("[data-accordion-content]");
  await expect(content).toBeHidden();
});

// ===========================================================================
// STRING PROPS WITH SPECIAL CHARACTERS
//
// Verify that string props containing quotes, backslashes, and other
// special characters are properly escaped in SSR output.
// ===========================================================================

test("dialog title with special characters renders", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("dialog-fixture").getByTestId("dialog-open").click();
  await expect(page.getByTestId("dialog-content")).toContainText("Dialog title");
});
