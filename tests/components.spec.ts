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
  const content = fixture.getByTestId("acc-item-0").locator(".chx-accordion-panel");

  await expect(content).toBeHidden();
  await summary.click();
  await expect(content).toBeVisible();
  await expect(content).toContainText("A programming language.");
  await summary.click();
  await expect(content).toBeHidden();
});

test("accordion arrow keys move between items", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("accordion-fixture");

  const first = fixture.getByRole("button", { name: /What is Chemical/ });
  const second = fixture.getByRole("button", { name: /Is it fast/ });
  const third = fixture.getByRole("button", { name: /Who uses it/ });

  // ArrowDown moves to the next item.
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(second).toBeFocused();

  // ArrowUp wraps back to the previous.
  await page.keyboard.press("ArrowUp");
  await expect(first).toBeFocused();

  // End jumps to the last item, Home to the first.
  await page.keyboard.press("End");
  await expect(third).toBeFocused();
  await page.keyboard.press("Home");
  await expect(first).toBeFocused();
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
  const listbox = page.getByRole("listbox"); // portaled to document.body

  // Placeholder shown, listbox closed.
  await expect(fixture.getByTestId("select-value")).toHaveText("Chosen: none");
  await expect(listbox).toBeHidden();

  // The menu must render into document.body (portal), not inside the fixture.
  await fixture.getByRole("button", { name: "Pick a fruit" }).click();
  await expect(listbox).toBeVisible();
  await expect(listbox).toBeAttached();
  const inBody = await listbox.evaluate((el) => document.body.contains(el));
  expect(inBody).toBe(true);

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
// ToggleGroup (single, children-based context)
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

// ToggleGroup multiple mode: independent toggles driven by a shared selection
// array through context.
test("toggle group multiple mode toggles independently", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("togglegroup-multi-fixture");
  const bold = fixture.getByRole("button", { name: "Bold" });
  const italic = fixture.getByRole("button", { name: "Italic" });

  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(italic).toHaveAttribute("aria-pressed", "false");

  await italic.click();
  await expect(bold).toHaveAttribute("aria-pressed", "true");
  await expect(italic).toHaveAttribute("aria-pressed", "true");

  await bold.click();
  await expect(bold).toHaveAttribute("aria-pressed", "false");
  await expect(italic).toHaveAttribute("aria-pressed", "true");
});

// ---------------------------------------------------------------------------
// RadioGroup (children-based context)
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

// defaultValue must survive SSR → hydration: the checked state is applied by
// the group's context on the client even though the server renders items
// unchecked (children render before the provider's SSR function).
test("radio group defaultValue applies after hydration", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("radiogroup-fixture");
  await expect(fixture.getByRole("radio", { name: "Medium" })).toBeChecked();
});

// Context without a provider: a standalone item must not crash and stays
// unchecked (registry read falls back to the default).
test("radio item without a group stays unchecked", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("radiogroup-noprovider-fixture");
  const solo = fixture.getByRole("radio", { name: "Solo" });
  await expect(solo).not.toBeChecked();
  // Clicking must not crash (no provider → ctx.write is absent) and must not
  // corrupt other state.
  await solo.click({ force: true });
  await expect(fixture.getByRole("radio", { name: "Solo" })).toBeVisible();
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

// ---------------------------------------------------------------------------
// Dialog focus management (WAI-ARIA dialog pattern)
// ---------------------------------------------------------------------------
test("dialog traps focus and restores it on close", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("dialog-fixture");
  const openBtn = fixture.getByTestId("dialog-open");
  const dialog = page.getByTestId("dialog-content");

  await openBtn.click();
  await expect(dialog).toBeVisible();

  // Focus moved into the dialog on open (autofocus first focusable).
  await expect(openBtn).not.toBeFocused();
  const confirm = dialog.getByTestId("dialog-confirm");
  const cancel = dialog.getByTestId("dialog-cancel");
  await expect(confirm).toBeFocused();

  // Tab moves to the next focusable inside the dialog.
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();

  // Tab from the last element wraps back to the first.
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();

  // Shift+Tab from the first element wraps to the last.
  await page.keyboard.press("Shift+Tab");
  await expect(cancel).toBeFocused();

  // Escape closes and focus returns to the trigger.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(openBtn).toBeFocused();
});

test("sheet traps focus and restores it on close", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("sheet-fixture");
  const openBtn = fixture.getByTestId("sheet-open");

  await openBtn.click();
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();

  // Close button (first focusable in the sheet) receives focus on open.
  // The focus effect runs on a microtask after the prop change, so retry briefly.
  await expect(async () => {
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
  }).toPass({ timeout: 5000 });

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeHidden();
  await expect(openBtn).toBeFocused();
});

// ---------------------------------------------------------------------------
// Select keyboard navigation (WAI-ARIA listbox pattern)
// ---------------------------------------------------------------------------
test("select supports keyboard navigation and typeahead", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("select-fixture");
  const trigger = fixture.getByRole("button", { name: "Pick a fruit" });

  // ArrowDown opens the listbox.
  const listbox = page.getByRole("listbox"); // portaled to document.body
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await expect(listbox).toBeVisible();

  // aria-activedescendant points at the current value (Apple = option 0).
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAttribute("aria-activedescendant", "chx-select-opt-0");

  // ArrowDown moves highlight to Banana.
  await page.keyboard.press("ArrowDown");
  await expect(trigger).toHaveAttribute("aria-activedescendant", "chx-select-opt-1");

  // Enter selects the highlighted option.
  await page.keyboard.press("Enter");
  await expect(fixture.getByTestId("select-value")).toHaveText("Chosen: Banana");
  await expect(listbox).toBeHidden();
});

test("select typeahead jumps to a matching option", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("select-fixture");
  const trigger = fixture.getByRole("button", { name: "Pick a fruit" });

  await trigger.focus();
  await page.keyboard.press("Enter"); // open
  await expect(page.getByRole("listbox")).toBeVisible();

  // Type "c" → highlight jumps to Cherry.
  await page.keyboard.type("c");
  await expect(trigger).toHaveAttribute("aria-activedescendant", "chx-select-opt-2");

  await page.keyboard.press("Enter");
  await expect(fixture.getByTestId("select-value")).toHaveText("Chosen: Cherry");
});

// ---------------------------------------------------------------------------
// Portals: menus must escape overflow:hidden / transform clipping
// ---------------------------------------------------------------------------
test("select menu escapes an overflow:hidden container via portal", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("portal-fixture");
  const trigger = fixture.getByTestId("portal-overflow-select").getByRole("button", { name: "Overflow pick" });

  await trigger.click();
  const listbox = page.getByRole("listbox", { name: "" }).filter({ hasText: "Three" });
  await expect(listbox).toBeVisible();

  // The menu is portaled to body, so it is NOT clipped by the 70px container:
  // its bottom edge extends past the container's bottom.
  const box = await listbox.boundingBox();
  const containerBox = await fixture.locator("div").first().boundingBox();
  expect(box).not.toBeNull();
  expect(containerBox).not.toBeNull();
  expect(box!.y + box!.height).toBeGreaterThan(containerBox!.y + containerBox!.height);

  await listbox.getByRole("option", { name: "Three" }).click();
  await expect(fixture.getByTestId("portal-value")).toHaveText("Chosen: Three");
});

test("select menu escapes a transform container via portal", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("portal-fixture");
  const trigger = fixture.getByTestId("portal-transform-select").getByRole("button", { name: "Transform pick" });

  await trigger.click();
  const listbox = page.getByRole("listbox").filter({ hasText: "Gamma" });
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveCount(1); // not duplicated by the transformed ancestor

  await listbox.getByRole("option", { name: "Gamma" }).click();
  await expect(fixture.getByTestId("portal-value")).toHaveText("Chosen: Gamma");
});

// ---------------------------------------------------------------------------
// Tabs keyboard navigation (roving tabindex)
// ---------------------------------------------------------------------------
test("tabs arrow keys move selection and focus", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("tabs-fixture");

  const alpha = fixture.getByRole("tab", { name: "Alpha" });
  const beta = fixture.getByRole("tab", { name: "Beta" });
  const gamma = fixture.getByRole("tab", { name: "Gamma" });

  // Only the active tab is in the tab order.
  await expect(alpha).toHaveAttribute("tabindex", "0");
  await expect(beta).toHaveAttribute("tabindex", "-1");

  // ArrowRight moves focus + selection to Beta.
  await alpha.focus();
  await page.keyboard.press("ArrowRight");
  await expect(beta).toBeFocused();
  await expect(fixture.getByRole("tabpanel", { name: "Beta" })).toBeVisible();
  await expect(alpha).toHaveAttribute("tabindex", "-1");
  await expect(beta).toHaveAttribute("tabindex", "0");

  // ArrowRight wraps to the first tab.
  await page.keyboard.press("ArrowRight");
  await expect(gamma).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(alpha).toBeFocused();

  // ArrowLeft moves back.
  await page.keyboard.press("ArrowLeft");
  await expect(gamma).toBeFocused();

  // Home/End jump to the ends.
  await page.keyboard.press("Home");
  await expect(alpha).toBeFocused();
  await page.keyboard.press("End");
  await expect(gamma).toBeFocused();
});

// ---------------------------------------------------------------------------
// Dropdown (portaled menu escapes clipping)
// ---------------------------------------------------------------------------
test("dropdown menu escapes an overflow:hidden container via portal", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("dropdown-fixture");
  const trigger = fixture.getByRole("button", { name: "Actions" });

  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCount(1);
  const inBody = await menu.evaluate((el) => document.body.contains(el));
  expect(inBody).toBe(true);

  await menu.getByRole("menuitem", { name: "Delete" }).click();
  await expect(menu).toBeHidden();
});

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------
test("component render error shows fallback UI and the page survives", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("error-fixture");

  // Mount a component that throws during render; its useErrorBoundary
  // fallback replaces it.
  await fixture.getByTestId("error-mount").click();
  await expect(fixture.getByTestId("error-fallback")).toBeVisible();
  await expect(fixture.getByTestId("error-fallback")).toHaveText("Fallback shown");

  // The page keeps working (other interactive components still respond).
  const value = page.getByTestId("counter-value");
  await page.getByTestId("counter-increment").click();
  await expect(value).toHaveText("Count: 1");
});

test("component render error falls back to the default error UI", async ({ page }) => {
  await page.goto("/");
  const fixture = page.getByTestId("error-fixture");

  await fixture.getByTestId("error-default-mount").click();
  const fallback = fixture.locator(".chx-error-boundary");
  await expect(fallback).toBeVisible();
  await expect(fallback).toHaveAttribute("role", "alert");
});
