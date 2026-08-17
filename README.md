# Chemical Components E2E

Real-browser end-to-end tests for the Chemical components library and the universal
runtime it depends on. The tests verify the full pipeline the string-level plugin
tests can't: **SSR → hydration → interaction** in an actual Chromium browser.

## What's covered

Every interactive component is rendered by a Chemical demo app (`app/`) with stable
`data-testid` hooks, and Playwright clicks through it asserting real DOM state:

| Component | What's verified |
|---|---|
| Counter | hydration, state updates, reset, **no runtime errors** |
| Tabs | panel switching, aria-controls / aria-labelledby wiring |
| Accordion | open/close, content visibility |
| Dialog | open/close, focus flow |
| Select | dropdown open, option pick, controlled value reporting |
| Slider | click + keyboard (arrows, Home, End), aria-valuenow |
| Checkbox / Switch / Radio | checked state toggling, mutual exclusivity |
| ToggleGroup | single-mode pressed state (reactive `aria-pressed`) |
| RadioGroup | single option selection (reactive `checked`) |
| Toast | auto-dismiss after duration |
| Collapsible | show/hide, aria-expanded |
| Sheet | opens and closes from the side |

The suite has caught real production bugs that string tests missed: hydration
duplicating state-wrapped universal children, reactive props frozen into plain values
(clicks did nothing), components not forwarding `{...props}` (custom attributes never
reached the DOM), and missing ARIA wiring.

## Prerequisites

- **Node.js 18+** with npm
- **The Chemical compiler** (`TCCCompiler`) built in the parent repo:
  ```bash
  cd <chemical-repo> && ./scripts/setup.sh && ./scripts/build.sh --tcc
  ```
- This repo is normally cloned inside the Chemical repo at
  `lang/compiled/components-e2e` (so the build script finds the compiler three levels
  up). When running standalone, set `CHEMICAL_COMPILER=/path/to/TCCCompiler`.

## Install

```bash
npm install
npx playwright install chromium
```

## Run

```bash
node scripts/build-app.mjs    # compile the Chemical app → app/output/
npx playwright test           # run all tests
```

The Playwright config starts a static server over `app/output/` automatically.

### Useful flags

```bash
npx playwright test -g "toast"            # single test by name
npx playwright test --reporter=list       # readable output
npx playwright test tests/counter.spec.ts # one file
BUILD_NO_CACHE=1 node scripts/build-app.mjs   # full rebuild (no Chemical cache)
```

**Rebuild the app after changing any Chemical library** (`lang/libs/components/`,
`lang/libs/page/`, `lang/libs/universal_cbi/`, `css`/`css_parser`):
`node scripts/build-app.mjs`. Changes to the compiler itself (`.cpp`/`.h`) require
`./scripts/build.sh --tcc` in the parent repo first.

## Repo layout

```
app/                 Chemical demo app — fixture source of truth (src/main.ch)
scripts/build-app.mjs  compile + run the app → app/output/
scripts/serve.mjs      static server for app/output/
tests/                 Playwright specs (counter.spec.ts, components.spec.ts)
playwright.config.ts
```

`app/output/` and `test-results/` are generated and gitignored.

## Writing a test

1. Add a `#universal XFixture` in `app/src/main.ch` with a `data-testid` wrapper and
   controlled state, plus an output hook (`<p data-testid="x-value">Value: {v}</p>`).
2. Register `<XFixture />` in `main()`'s `<main>` block.
3. `node scripts/build-app.mjs`, inspect `app/output/index.html` / `index.js` to
   confirm SSR output.
4. Write `tests/x.spec.ts` using role-based locators and Playwright auto-waiting.
5. `npx playwright test -g "x"`.

See the full guide (patterns, debugging, mapping failures to library fixes) in the
Chemical repo's skill: `.agents/skills/components_e2e/SKILL.md`.

## Performance

15 tests across 10 workers complete in ~6–7s once the app is built. The Chemical
compile step (30–60s, cached by default) dominates; the browser tests themselves are
fast and rely on Playwright's auto-waiting rather than sleeps.
