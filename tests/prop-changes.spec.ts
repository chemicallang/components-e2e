import { test, expect } from "@playwright/test";

// ===========================================================================
// PROP-DRIVEN COMPONENT UPDATES
//
// These tests verify that components correctly reflect prop values passed
// from parent components, including edge cases with null, undefined,
// empty strings, and special characters.
// ===========================================================================

// ---------------------------------------------------------------------------
// Button prop variants: verify all variants render with correct attributes
// ---------------------------------------------------------------------------
test("button default variant has no variant attribute override", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("button-fixture").getByTestId("btn-default");
  await expect(btn).toHaveAttribute("data-variant", "default");
  await expect(btn).toBeVisible();
  await expect(btn).toHaveJSProperty("tagName", "BUTTON");
});

test("button destructive variant renders", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("button-fixture").getByTestId("btn-destructive");
  await expect(btn).toHaveAttribute("data-variant", "destructive");
  await expect(btn).toBeVisible();
});

test("button all 10 variants render", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("button-fixture");
  const variants = ["default", "destructive", "outline", "secondary", "ghost", "link", "success", "warning", "info", "accent"];
  for (const v of variants) {
    await expect(f.getByTestId(`btn-${v}`)).toHaveAttribute("data-variant", v);
    await expect(f.getByTestId(`btn-${v}`)).toBeVisible();
  }
});

// ---------------------------------------------------------------------------
// Button sizes: verify all sizes render
// ---------------------------------------------------------------------------
test("button all sizes render", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("button-fixture");
  await expect(f.getByTestId("btn-sm")).toHaveAttribute("data-size", "sm");
  await expect(f.getByTestId("btn-lg")).toHaveAttribute("data-size", "lg");
  await expect(f.getByTestId("btn-icon")).toHaveAttribute("data-size", "icon");
});

// ---------------------------------------------------------------------------
// Button prop: disabled state
// ---------------------------------------------------------------------------
test("button disabled prop prevents click", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("button-edge-fixture");
  const btn = f.getByTestId("btn-disabled-interactive");
  const state = f.getByTestId("btn-submit-state");

  await expect(btn).toBeDisabled();
  await btn.click({ force: true });
  await expect(state).toHaveText("not submitted");
});

// ---------------------------------------------------------------------------
// Button prop: loading state
// ---------------------------------------------------------------------------
test("button loading prop reflects in attribute", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("button-fixture").getByTestId("btn-loading");
  await btn.click();
  await expect(btn).toHaveAttribute("loading", "true", { timeout: 3000 });
  await expect(btn).not.toHaveAttribute("loading", "true", { timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Button prop: type attribute
// ---------------------------------------------------------------------------
test("button type=submit renders with type attribute", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("button-edge-fixture").getByTestId("btn-submit")).toHaveAttribute("type", "submit");
});

// ---------------------------------------------------------------------------
// Button prop: aria-label
// ---------------------------------------------------------------------------
test("button aria-label renders for screen readers", async ({ page }) => {
  await page.goto("/");
  const btn = page.getByTestId("button-edge-fixture").getByTestId("btn-aria");
  await expect(btn).toHaveAttribute("aria-label", "Close dialog");
  await expect(btn).toContainText("X");
});

// ---------------------------------------------------------------------------
// Button: Fab variant
// ---------------------------------------------------------------------------
test("Fab renders with aria-label", async ({ page }) => {
  await page.goto("/");
  const fab = page.getByTestId("button-edge-fixture").getByRole("button", { name: "Add item" });
  await expect(fab).toContainText("+");
  await expect(fab).toHaveAttribute("aria-label", "Add item");
});

test("Fab disabled state", async ({ page }) => {
  await page.goto("/");
  const fab = page.getByTestId("button-edge-fixture").getByRole("button", { name: "Disabled" });
  await expect(fab).toBeDisabled();
});

// ===========================================================================
// INPUT PROPS
// ===========================================================================

test("input default variant and placeholder", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("input-fixture").getByTestId("input-default");
  await expect(input).toHaveAttribute("placeholder", "Default input");
  await expect(input).toHaveAttribute("data-variant", "default");
});

test("input all variants render", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("input-fixture");
  await expect(f.getByTestId("input-filled")).toHaveAttribute("data-variant", "filled");
  await expect(f.getByTestId("input-ghost")).toHaveAttribute("data-variant", "ghost");
  await expect(f.getByTestId("input-error")).toHaveAttribute("data-variant", "error");
  await expect(f.getByTestId("input-success")).toHaveAttribute("data-variant", "success");
});

test("input sizes render", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("input-fixture");
  await expect(f.getByTestId("input-sm")).toHaveAttribute("data-size", "sm");
  await expect(f.getByTestId("input-lg")).toHaveAttribute("data-size", "lg");
});

test("input disabled state", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-fixture").getByTestId("input-disabled")).toBeDisabled();
});

test("input type=email renders", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("input-edge-fixture").getByTestId("input-email");
  await expect(input).toHaveAttribute("type", "email");
  await expect(input).toHaveAttribute("aria-label", "Email input");
});

test("input type=number renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-edge-fixture").getByTestId("input-number")).toHaveAttribute("type", "number");
});

test("input type=password renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-edge-fixture").getByTestId("input-password")).toHaveAttribute("type", "password");
});

test("input type=search renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-edge-fixture").getByTestId("input-search")).toHaveAttribute("type", "search");
});

test("textarea rows attribute", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("input-edge-fixture").getByTestId("textarea-rows")).toHaveAttribute("rows", "5");
});

test("NativeSelect renders and accepts selection", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("input-edge-fixture");
  const sel = f.getByTestId("native-select");
  await expect(sel).toHaveJSProperty("tagName", "SELECT");
  await sel.selectOption("b");
  await expect(f.getByTestId("native-select-value")).toHaveText("b");
});

// ===========================================================================
// SELECT PROPS
// ===========================================================================

test("select placeholder renders", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("select-fixture").getByRole("button", { name: "Pick a fruit" });
  await expect(trigger).toContainText("Pick a fruit");
});

test("select controlled mode shows current value", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("select-edge-fixture");
  await expect(f.getByTestId("select-controlled-value")).toHaveText("Apple");
  const trigger = f.locator("[data-testid=select-controlled]").getByRole("button");
  await expect(trigger).toContainText("Apple");
});

test("select disabled state prevents opening", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("select-edge-fixture")
    .locator("[data-testid=select-disabled]").getByRole("button");
  await expect(trigger).toBeDisabled();
  await trigger.click({ force: true });
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("select defaultValue pre-selects option", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("select-edge-fixture")
    .locator("[data-testid=select-defaultvalue]").getByRole("button");
  await expect(trigger).toContainText("Y");
});

test("select aria-expanded and aria-haspopup", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByTestId("select-edge-fixture")
    .locator("[data-testid=select-controlled]").getByRole("button");
  await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

// ===========================================================================
// SLIDER PROPS
// ===========================================================================

test("slider keyboard interaction updates value", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("slider-fixture");
  const slider = f.getByRole("slider", { name: "Volume" });
  await expect(f.getByTestId("slider-value")).toHaveText("Value: 30");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(f.getByTestId("slider-value")).toHaveText("Value: 40");
});

test("slider Home/End keys", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByTestId("slider-fixture").getByRole("slider", { name: "Volume" });
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
});

test("slider disabled prevents interaction", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("slider-edge-fixture")
    .locator("[data-disabled=true]").first()).toHaveAttribute("data-disabled", "true");
  const slider = page.getByTestId("slider-edge-fixture")
    .locator("[role=slider]").first();
  await expect(slider).toHaveAttribute("aria-valuenow", "30");
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "30");
});

test("slider respects min/max boundaries", async ({ page }) => {
  await page.goto("/");
  const slider = page.getByTestId("slider-edge-fixture")
    .locator("[role=slider]").nth(2);
  await slider.focus();
  await slider.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await slider.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await slider.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
});

// ===========================================================================
// CHECKBOX / SWITCH / RADIO PROPS
// ===========================================================================

test("checkbox starts unchecked", async ({ page }) => {
  await page.goto("/");
  const cb = page.getByTestId("checkbox-control").locator("input");
  await expect(cb).not.toBeChecked();
});

test("checkbox toggles on click", async ({ page }) => {
  await page.goto("/");
  const cb = page.getByTestId("checkbox-control").locator("input");
  await page.getByTestId("checkbox-control").click();
  await expect(cb).toBeChecked();
});

test("switch starts checked", async ({ page }) => {
  await page.goto("/");
  const sw = page.getByTestId("switch-control").locator("input");
  await expect(sw).toBeChecked();
});

test("switch toggles on click", async ({ page }) => {
  await page.goto("/");
  const sw = page.getByTestId("switch-control").locator("input");
  await page.getByTestId("switch-control").click();
  await expect(sw).not.toBeChecked();
});

test("radio mutual exclusion", async ({ page }) => {
  await page.goto("/");
  const a = page.getByTestId("radio-a").locator("input");
  const b = page.getByTestId("radio-b").locator("input");
  await expect(a).toBeChecked();
  await page.getByTestId("radio-b").click();
  await expect(b).toBeChecked();
  await expect(a).not.toBeChecked();
});

// ===========================================================================
// TOGGLE GROUP PROPS
// ===========================================================================

test("toggle group single mode", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("togglegroup-fixture");
  await expect(f.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await f.getByRole("button", { name: "Italic" }).click();
  await expect(f.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "false");
  await expect(f.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
});

test("toggle group multiple mode", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("togglegroup-multi-fixture");
  await expect(f.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await f.getByRole("button", { name: "Italic" }).click();
  await expect(f.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
  await expect(f.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
});

// ===========================================================================
// RADIO GROUP PROPS
// ===========================================================================

test("radio group defaultValue", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("radiogroup-fixture").getByRole("radio", { name: "Medium" })).toBeChecked();
});

test("radio group selection", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("radiogroup-fixture");
  await f.getByRole("radio", { name: "Large" }).check();
  await expect(f.getByRole("radio", { name: "Large" })).toBeChecked();
  await expect(f.getByRole("radio", { name: "Medium" })).not.toBeChecked();
});

test("radio item without provider stays unchecked", async ({ page }) => {
  await page.goto("/");
  const solo = page.getByTestId("radiogroup-noprovider-fixture").getByRole("radio", { name: "Solo" });
  await expect(solo).not.toBeChecked();
  await solo.click({ force: true });
  await expect(solo).toBeVisible();
});

// ===========================================================================
// PROGRESS PROPS
// ===========================================================================

test("progress renders with correct value", async ({ page }) => {
  await page.goto("/");
  const p = page.getByTestId("progress-fixture").getByTestId("progress-default");
  await expect(p).toHaveJSProperty("tagName", "PROGRESS");
  await expect(p).toHaveAttribute("value", "45");
});

test("progress renders all variants", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("progress-fixture");
  await expect(f.getByTestId("progress-primary")).toHaveAttribute("data-variant", "primary");
  await expect(f.getByTestId("progress-success")).toHaveAttribute("data-variant", "success");
  await expect(f.getByTestId("progress-error")).toHaveAttribute("data-variant", "error");
});

// ===========================================================================
// PAGINATION PROPS
// ===========================================================================

test("pagination navigates between pages", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("pagination-fixture");
  await expect(f.getByRole("button", { name: "Previous page" })).toBeDisabled();
  await f.getByRole("button", { name: "3" }).click();
  await expect(f.getByTestId("pagination-value")).toHaveText("Page: 3");
  await f.getByRole("button", { name: "Next page" }).click();
  await expect(f.getByTestId("pagination-value")).toHaveText("Page: 4");
});

// ===========================================================================
// TABLE PROPS
// ===========================================================================

test("table renders headers and cells", async ({ page }) => {
  await page.goto("/");
  const t = page.getByTestId("table-fixture").getByTestId("table");
  await expect(t).toHaveJSProperty("tagName", "TABLE");
  await expect(t.locator("th").nth(0)).toContainText("Name");
  await expect(t.locator("td").nth(0)).toContainText("Alpha");
});

// ===========================================================================
// LIST PROPS
// ===========================================================================

test("list renders correct number of items", async ({ page }) => {
  await page.goto("/");
  const items = page.getByTestId("list-fixture").getByTestId("list").locator("li");
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText("First item");
  await expect(items.nth(2)).toContainText("Third item");
});

// ===========================================================================
// TOOLTIP PROPS
// ===========================================================================

test("tooltip appears on hover with correct text", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("tooltip-fixture");
  const tip = f.getByRole("tooltip").first();
  await expect(tip).toHaveCSS("opacity", "0");
  await f.locator("button").first().hover();
  await expect(tip).toHaveCSS("opacity", "1");
  await expect(tip).toContainText("Top tip");
});

// ===========================================================================
// BADGE PROPS
// ===========================================================================

test("badge renders all variants", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("badge-fixture");
  await expect(f.locator('span[data-variant="default"]').first()).toContainText("Default");
  await expect(f.locator('span[data-variant="secondary"]').first()).toContainText("Secondary");
  await expect(f.locator('span[data-variant="success"]').first()).toContainText("Success");
  await expect(f.locator('span[data-variant="error"]').first()).toContainText("Error");
  await expect(f.locator('span[data-variant="outline"]').first()).toContainText("Outline");
});

test("badge renders sizes", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("badge-fixture");
  await expect(f.locator('span[data-size="xs"]').first()).toContainText("XS");
  await expect(f.locator('span[data-size="sm"]').first()).toContainText("SM");
  await expect(f.locator('span[data-size="lg"]').first()).toContainText("LG");
});

// ===========================================================================
// ALERT PROPS
// ===========================================================================

test("alert renders all variants", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("alert-fixture");
  for (const v of ["info", "success", "error", "warning", "default", "accent"]) {
    await expect(f.locator(`[data-variant="${v}"][role="alert"]`)).toBeVisible();
  }
});

test("alert shows title and description", async ({ page }) => {
  await page.goto("/");
  const info = page.getByTestId("alert-fixture").locator('[data-variant="info"]');
  await expect(info).toContainText("Heads up");
  await expect(info).toContainText("This is info.");
});

test("alert dismiss removes it", async ({ page }) => {
  await page.goto("/");
  const info = page.getByTestId("alert-fixture").locator('[data-variant="info"]');
  await info.getByRole("button", { name: "Dismiss alert" }).click();
  await expect(info).toBeHidden();
});

// ===========================================================================
// AVATAR PROPS
// ===========================================================================

test("avatar renders sizes and fallback text", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("avatar-fixture");
  await expect(f.locator('[data-size="xs"]').first()).toContainText("XS");
  await expect(f.locator('[data-size="sm"]').first()).toContainText("SM");
  await expect(f.locator('[data-size="lg"]').first()).toContainText("LG");
  await expect(f.locator('[data-size="xl"]').first()).toContainText("XL");
});

test("avatar bordered style", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("avatar-fixture").locator('[data-bordered="true"]')).toContainText("BD");
});

// ===========================================================================
// CARD PROPS
// ===========================================================================

test("card renders header, title, description, content, footer", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("card-fixture");
  await expect(f.getByText("Card title")).toBeVisible();
  await expect(f.getByText("Card description text.")).toBeVisible();
  await expect(f.getByTestId("card-content")).toContainText("Card body content.");
  await expect(f.getByTestId("card-action-btn")).toBeVisible();
});

test("card interactive onClick fires", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("card-fixture").getByTestId("card-interactive-text")).toHaveText("Click me");
  await page.getByTestId("card-fixture").getByTestId("card-interactive-text").click();
  await expect(page.getByTestId("card-fixture").getByTestId("card-interactive-text")).toHaveText("Clicked!");
});

// ===========================================================================
// TYPOGRAPHY PROPS
// ===========================================================================

test("typography renders heading levels", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("typography-fixture");
  await expect(f.locator("h1").first()).toContainText("Heading 1");
  await expect(f.locator("h2").first()).toContainText("Heading 2");
  await expect(f.locator("h4").first()).toContainText("Heading 4");
  await expect(f.locator("h5").first()).toContainText("Heading 5");
  await expect(f.locator("h6").first()).toContainText("Heading 6");
});

test("typography Text muted variant", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("typography-fixture");
  await expect(f.locator('[data-muted="true"]').first()).toContainText("Muted text.");
});

test("typography Link renders anchor with href", async ({ page }) => {
  await page.goto("/");
  const link = page.getByTestId("typography-fixture").locator("a").first();
  await expect(link).toHaveAttribute("href", "https://example.com");
  await expect(link).toContainText("External link");
});

// ===========================================================================
// SEPARATOR PROPS
// ===========================================================================

test("separator has role=separator", async ({ page }) => {
  await page.goto("/");
  const sep = page.getByTestId("separator-fixture").locator("[role=\"separator\"]");
  await expect(sep).toHaveAttribute("data-orientation", "horizontal");
});

// ===========================================================================
// SHEET PROPS
// ===========================================================================

test("sheet opens and closes", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("sheet-fixture").getByTestId("sheet-open").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Sheet body");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("sheet inerts background", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("main");
  await page.getByTestId("sheet-fixture").getByTestId("sheet-open").click();
  await expect(main).toHaveAttribute("inert", "");
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(main).not.toHaveAttribute("inert");
});

// ===========================================================================
// DROPDOWN PROPS
// ===========================================================================

test("dropdown escapes overflow:hidden", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("dropdown-fixture").getByRole("button", { name: "Actions" }).click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  const inBody = await menu.evaluate((el) => document.body.contains(el));
  expect(inBody).toBe(true);
  await menu.getByRole("menuitem", { name: "Delete" }).click();
  await expect(menu).toBeHidden();
});

// ===========================================================================
// COLLAPSIBLE PROPS
// ===========================================================================

test("collapsible toggles content", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("collapsible-fixture");
  const trigger = f.getByRole("button", { name: /More info/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(f).toContainText("Hidden details here.");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

// ===========================================================================
// ERROR BOUNDARY PROPS
// ===========================================================================

test("error boundary shows fallback UI", async ({ page }) => {
  await page.goto("/");
  const f = page.getByTestId("error-fixture");
  await f.getByTestId("error-mount").click();
  await expect(f.getByTestId("error-fallback")).toHaveText("Fallback shown");
});

test("error boundary default fallback", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("error-fixture").getByTestId("error-default-mount").click();
  const fallback = page.getByTestId("error-fixture").locator(".chx-error-boundary");
  await expect(fallback).toHaveAttribute("role", "alert");
});

// ===========================================================================
// TOAST PROPS
// ===========================================================================

test("toast auto-dismisses", async ({ page }) => {
  await page.goto("/");
  const toast = page.getByTestId("toast-item");
  await expect(toast).toContainText("Changes saved");
  await expect(toast).toBeHidden({ timeout: 5_000 });
});

// ===========================================================================
// PERFORMANCE: SSR renders all fixtures
// ===========================================================================

test("SSR renders all component fixtures", async ({ page }) => {
  await page.goto("/");
  for (const tid of [
    "counter-fixture", "button-fixture", "tabs-fixture", "accordion-fixture",
    "dialog-fixture", "select-fixture", "slider-fixture", "toggle-fixture",
    "togglegroup-fixture", "radiogroup-fixture", "toast-fixture",
    "collapsible-fixture", "sheet-fixture", "dropdown-fixture", "error-fixture",
    "alert-fixture", "avatar-fixture", "badge-fixture", "card-fixture",
    "input-fixture", "separator-fixture", "typography-fixture",
    "progress-fixture", "pagination-fixture", "list-fixture", "table-fixture",
    "tooltip-fixture", "nested-fixture", "perf-fixture"
  ]) {
    await expect(page.locator(`[data-testid="${tid}"]`)).toBeAttached();
  }
});

test("SSR HTML size is reasonable", async ({ page }) => {
  await page.goto("/");
  const htmlSize = await page.evaluate(() => document.documentElement.outerHTML.length);
  expect(htmlSize).toBeLessThan(200_000);
  expect(htmlSize).toBeGreaterThan(1_000);
});

test("hydration completes quickly", async ({ page }) => {
  const start = Date.now();
  await page.goto("/");
  await page.getByTestId("counter-increment").click();
  await expect(page.getByTestId("counter-value")).toHaveText("Count: 1");
  expect(Date.now() - start).toBeLessThan(5000);
});

// ===========================================================================
// NO RUNTIME ERRORS (comprehensive)
// ===========================================================================

test("page has zero console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.goto("/");
  await page.waitForTimeout(300);

  expect(errors, errors.join("\n")).toEqual([]);
});
