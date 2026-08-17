import { test, expect } from "@playwright/test";

// Browser tests for the interactive components. Every fixture in the demo
// app (app/src/main.ch) is wrapped in an element with a stable data-testid;
// state lives in the fixture so these tests exercise SSR → hydration → click.

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
test("tabs switch panels on click", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("tabs-fixture");

  // Tabpanels are labelled by their tab (aria-labelledby, shadcn semantics):
  // panel 0 belongs to "Alpha" and is visible by default (defaultIndex 0).
  await expect(fixture.getByRole("tabpanel", { name: "Alpha" })).toBeVisible();
  await expect(fixture.getByRole("tabpanel", { name: "Beta" })).toBeHidden();

  // Click Beta tab → its panel shows, Alpha hides.
  await fixture.getByRole("tab", { name: "Beta" }).click();
  await expect(fixture.getByRole("tabpanel", { name: "Beta" })).toBeVisible();
  await expect(fixture.getByRole("tabpanel", { name: "Alpha" })).toBeHidden();
});

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------
test("accordion item opens and closes", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("accordion-fixture");

  const summary = fixture.getByRole("button", { name: /What is Chemical/ });
  const content = fixture.locator(".chx-accordion-panel");

  await expect(content).toBeHidden();
  await summary.click();
  await expect(content).toBeVisible();
  await expect(content).toContainText("A programming language.");
  await summary.click();
  await expect(content).toBeHidden();
});

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------
test("dialog opens, traps focus flow, and closes", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("dialog-fixture");

  // Hidden before opening.
  await expect(page.getByTestId("dialog-content")).toBeHidden();

  await fixture.getByTestId("dialog-open").click();
  const dialog = page.getByTestId("dialog-content");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Dialog title");

  // Confirm closes it.
  await dialog.getByTestId("dialog-confirm").click();
  await expect(dialog).toBeHidden();
});

// ---------------------------------------------------------------------------
// Select (custom dropdown)
// ---------------------------------------------------------------------------
test("select opens, picks an option, and reports the value", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("select-fixture");

  // Placeholder shown, listbox closed.
  await expect(fixture.getByTestId("select-value")).toHaveText("Chosen: none");
  await expect(fixture.getByRole("listbox")).toBeHidden();

  // Open and pick Banana.
  await fixture.getByRole("button", { name: "Pick a fruit" }).click();
  const listbox = fixture.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: "Banana" }).click();

  // Listbox closes; trigger shows the value; parent state got the change.
  await expect(listbox).toBeHidden();
  await expect(fixture.getByTestId("select-value")).toHaveText("Chosen: Banana");
});

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------
test("slider reports value via click and keyboard", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("slider-fixture");
  const slider = fixture.getByRole("slider", { name: "Volume" });

  // SSR value.
  await expect(fixture.getByTestId("slider-value")).toHaveText("Value: 30");
  await expect(slider).toHaveAttribute("aria-valuenow", "30");

  // ArrowRight increases by step (10).
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(fixture.getByTestId("slider-value")).toHaveText("Value: 40");

  // End jumps to max.
  await slider.press("End");
  await expect(fixture.getByTestId("slider-value")).toHaveText("Value: 100");

  // Home jumps to min.
  await slider.press("Home");
  await expect(fixture.getByTestId("slider-value")).toHaveText("Value: 0");
});

// ---------------------------------------------------------------------------
// Checkbox / Switch / Radio
// ---------------------------------------------------------------------------
test("checkbox toggles checked state", async ({ page }) => {
  await page.goto("/");
  const cb = page.getByTestId("checkbox-control").locator("input");
  await expect(cb).not.toBeChecked();
  await page.getByTestId("checkbox-control").click();
  await expect(cb).toBeChecked();
  await page.getByTestId("checkbox-control").click();
  await expect(cb).not.toBeChecked();
});

test("switch toggles checked state", async ({ page }) => {
  await page.goto("/");
  const sw = page.getByTestId("switch-control").locator("input");
  await expect(sw).toBeChecked();
  await page.getByTestId("switch-control").click();
  await expect(sw).not.toBeChecked();
  await page.getByTestId("switch-control").click();
  await expect(sw).toBeChecked();
});

test("radio buttons are mutually exclusive", async ({ page }) => {
  await page.goto("/");
  const a = page.getByTestId("radio-a").locator("input");
  const b = page.getByTestId("radio-b").locator("input");
  await expect(a).toBeChecked();
  await expect(b).not.toBeChecked();
  await page.getByTestId("radio-b").click();
  await expect(b).toBeChecked();
  await expect(a).not.toBeChecked();
});

// ---------------------------------------------------------------------------
// ToggleGroup (single)
// ---------------------------------------------------------------------------
test("toggle group single mode presses one item at a time", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("togglegroup-fixture");
  const bold = fixture.getByRole("button", { name: "Bold" });
  const italic = fixture.getByRole("button", { name: "Italic" });

  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(italic).toHaveAttribute("aria-pressed", "false");

  await italic.click();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
});

// ---------------------------------------------------------------------------
// RadioGroup (options mode)
// ---------------------------------------------------------------------------
test("radio group selects a single option", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("radiogroup-fixture");

  const medium = fixture.getByRole("radio", { name: "Medium" });
  const large = fixture.getByRole("radio", { name: "Large" });

  await expect(medium).toBeChecked();
  await expect(large).not.toBeChecked();

  await large.check();
  await expect(large).toBeChecked();
  await expect(medium).not.toBeChecked();
});

// ---------------------------------------------------------------------------
// Toast (auto-dismiss)
// ---------------------------------------------------------------------------
test("toast auto-dismisses after its duration", async ({ page }) => {
  await page.goto("/");
  const toast = page.getByTestId("toast-item");
  await expect(toast).toBeVisible();
  await expect(toast).toContainText("Changes saved");
  // duration=600ms — give the timer + removal a little slack.
  await expect(toast).toBeHidden({ timeout: 5_000 });
});

// ---------------------------------------------------------------------------
// Collapsible
// ---------------------------------------------------------------------------
test("collapsible shows and hides content", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("collapsible-fixture");

  const trigger = fixture.getByRole("button", { name: /More info/ });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(fixture).toContainText("Hidden details here.");

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------
test("sheet opens and closes from the side", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("sheet-fixture");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeHidden();

  await fixture.getByTestId("sheet-open").click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Sheet body");
  // Sheet panel has a close button (×).
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});
