// Components E2E demo app.
//
// One page (index) that renders every interactive component fixture. Each
// fixture is wrapped in an element with a stable `data-testid` so Playwright
// tests can target it regardless of hashed class names. State is owned by the
// fixture so tests can click through SSR → hydration → interaction.

// ---------------------------------------------------------------------------
// Counter: the core hydration test. If hydration breaks, clicks either don't
// fire or the count resets to the SSR value.
// ---------------------------------------------------------------------------
#universal CounterFixture(props) {
    state count = 0
    return <div data-testid="counter-fixture">
        <p data-testid="counter-value">Count: {count}</p>
        <Button data-testid="counter-increment" onClick={() => count += 1}>Increment</Button>
        <Button data-testid="counter-reset" variant="ghost" onClick={() => count = 0}>Reset</Button>
    </div>
}

// ---------------------------------------------------------------------------
// Tabs: stateful tabs from arrays
// ---------------------------------------------------------------------------
#universal TabsFixture(props) {
    return <div data-testid="tabs-fixture">
        <Tabs tabs={["Alpha", "Beta", "Gamma"]} panels={["Panel A", "Panel B", "Panel C"]} defaultIndex={0} />
    </div>
}

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------
#universal AccordionFixture(props) {
    return <div data-testid="accordion-fixture">
        <AccordionItem title="What is Chemical?" defaultOpen={false}>A programming language.</AccordionItem>
    </div>
}

// ---------------------------------------------------------------------------
// Dialog (controlled via open/onClose)
// ---------------------------------------------------------------------------
#universal DialogFixture(props) {
    state open = false
    return <div data-testid="dialog-fixture">
        <Button data-testid="dialog-open" onClick={() => open = true}>Open dialog</Button>
        <Dialog open={open} onClose={() => open = false}>
            <DialogContent data-testid="dialog-content">
                <DialogHeader>
                    <H3>Dialog title</H3>
                </DialogHeader>
                <p>Dialog body text</p>
                <DialogActions>
                    <Button data-testid="dialog-confirm" onClick={() => open = false}>Confirm</Button>
                    <Button variant="ghost" data-testid="dialog-cancel" onClick={() => open = false}>Cancel</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    </div>
}

// ---------------------------------------------------------------------------
// Select (custom dropdown, options mode)
// ---------------------------------------------------------------------------
#universal SelectFixture(props) {
    state value = ""
    return <div data-testid="select-fixture">
        <Select data-testid="select-control" options={["Apple", "Banana", "Cherry"]} value={value} onValueChange={(v) => value = v} placeholder="Pick a fruit" />
        <p data-testid="select-value">Chosen: {value ? value : "none"}</p>
    </div>
}

// ---------------------------------------------------------------------------
// Slider: click the track, verify aria-valuenow + keyboard
// ---------------------------------------------------------------------------
#universal SliderFixture(props) {
    state value = 30
    return <div data-testid="slider-fixture">
        <Slider data-testid="slider-control" min={0} max={100} step={10} value={value} onValueChange={(v) => value = v} ariaLabel="Volume" />
        <p data-testid="slider-value">Value: {value}</p>
    </div>
}

// ---------------------------------------------------------------------------
// Checkbox / Switch / Radio
// ---------------------------------------------------------------------------
#universal ToggleFixture(props) {
    state checked = false
    state switched = true
    state radio = "a"
    return <div data-testid="toggle-fixture">
        <Checkbox data-testid="checkbox-control" checked={checked} onClick={() => checked = !checked}>Enable</Checkbox>
        <Switch data-testid="switch-control" checked={switched} onClick={() => switched = !switched}>Notify</Switch>
        <Radio data-testid="radio-a" checked={radio == "a"} name="choice" onClick={() => radio = "a"}>Option A</Radio>
        <Radio data-testid="radio-b" checked={radio == "b"} name="choice" onClick={() => radio = "b"}>Option B</Radio>
    </div>
}

// ---------------------------------------------------------------------------
// ToggleGroup (single)
// ---------------------------------------------------------------------------
#universal ToggleGroupFixture(props) {
    return <div data-testid="togglegroup-fixture">
        <ToggleGroup type="single" options={["Bold", "Italic", "Underline"]} defaultValue="Bold" />
    </div>
}

// ---------------------------------------------------------------------------
// RadioGroup (options mode)
// ---------------------------------------------------------------------------
#universal RadioGroupFixture(props) {
    return <div data-testid="radiogroup-fixture">
        <RadioGroup options={["Small", "Medium", "Large"]} defaultValue="Medium" />
    </div>
}

// ---------------------------------------------------------------------------
// Toast: show + auto-dismiss via duration
// ---------------------------------------------------------------------------
#universal ToastFixture(props) {
    state show = true
    return <div data-testid="toast-fixture">
        <ToastViewport data-testid="toast-viewport">
            {show ? <Toast data-testid="toast-item" title="Saved" description="Changes saved" duration={600} onClose={() => show = false} /> : null}
        </ToastViewport>
    </div>
}

// ---------------------------------------------------------------------------
// Collapsible
// ---------------------------------------------------------------------------
#universal CollapsibleFixture(props) {
    return <div data-testid="collapsible-fixture">
        <Collapsible data-testid="collapsible-control" trigger="More info">Hidden details here.</Collapsible>
    </div>
}

// ---------------------------------------------------------------------------
// Sheet (controlled)
// ---------------------------------------------------------------------------
#universal SheetFixture(props) {
    state open = false
    return <div data-testid="sheet-fixture">
        <Button data-testid="sheet-open" onClick={() => open = true}>Open sheet</Button>
        <Sheet open={open} onClose={() => open = false} title="Settings" side="right">
            <p>Sheet body</p>
        </Sheet>
    </div>
}

public func main() : int {
    var page = HtmlPage()
    page.appendTitle("Components E2E")
    page.defaultPrepare()
    page.defaultUniversalSetup()
    page.injectDefaultComponentsTheme()

    #html {
        <main style="padding:2rem;display:grid;gap:2rem;max-width:720px;margin:0 auto;">
            <h1>Components E2E</h1>
            <CounterFixture />
            <TabsFixture />
            <AccordionFixture />
            <DialogFixture />
            <SelectFixture />
            <SliderFixture />
            <ToggleFixture />
            <ToggleGroupFixture />
            <RadioGroupFixture />
            <ToastFixture />
            <CollapsibleFixture />
            <SheetFixture />
        </main>
    }

    page.writeToDirectory("output", "index", "", "chx-default dark")
    return 0
}
