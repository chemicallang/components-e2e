import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// Runtime unit tests.
//
// The universal runtime is emitted as part of the page bundle, so its globals
// ($_us, $_ucs, $__uni_reconcile_list, $__uni_run_effects, $__uni_dispose, ...)
// are live in the loaded page. These tests exercise the runtime primitives
// directly against a real DOM, independent of any component. This is the
// unit-test layer the professionalization plan calls for (Phase 1) and it
// guards the exact contracts the runtime promises to generated code.

let page: Page;

test.describe.serial("Runtime unit", () => {
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto("/");
    await page.waitForFunction(() => typeof (window as any).$_us === "function");
  });

  test.afterAll(async () => {
    if (page) await page.close();
  });

  test("$_us: notifies subscribers, dedupes, and unsubscribe stops delivery", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const s = w.$_us(0);
      const seen: number[] = [];
      const unsub = s.subscribe((v: number) => seen.push(v));
      s.value = 1;
      s.value = 2;
      unsub();
      s.value = 3;
      return { seen, value: s.value };
    });
    expect(result.seen).toEqual([1, 2]);
    expect(result.value).toBe(3);
  });

  test("$_ucs: tracks dependencies and recomputes on change", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const a = w.$_us(2);
      const double = w.$_ucs(() => a.value * 2);
      const seen: number[] = [];
      double.subscribe((v: number) => seen.push(v));
      a.value = 5;
      return { initial: 4, seen, value: double.value };
    });
    expect(result.value).toBe(10);
    expect(result.seen).toEqual([10]);
  });

  test("$_ucs: $_dispose drops subscribers and dependency links", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const a = w.$_us(1);
      const c = w.$_ucs(() => a.value + 1);
      const seen: number[] = [];
      c.subscribe((v: number) => seen.push(v));
      c.$_dispose();
      a.value = 100;
      return { seen, cached: c.value };
    });
    // After disposal the computed no longer recomputes or notifies.
    expect(result.seen).toEqual([]);
    expect(result.cached).toBe(2);
  });

  test("$__uni_run_effects: deps compared by resolved value (no over-run)", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const inst: any = { effects: [], layoutEffects: [], children: [], _disposables: [], _resources: [] };
      const a = w.$_us(0);
      const b = w.$_us(0);
      let runsA = 0;
      let runsB = 0;
      inst.effects.push({ fn: () => { runsA++; }, deps: [a], lastDeps: null, cleanup: null, depUnsubs: [] });
      inst.effects.push({ fn: () => { runsB++; }, deps: [b], lastDeps: null, cleanup: null, depUnsubs: [] });
      w.$__uni_run_effects(inst, inst.effects); // both run once
      w.$__uni_run_effects(inst, inst.effects); // nothing changed -> no re-run
      a.value = 1;
      w.$__uni_run_effects(inst, inst.effects); // only A re-runs
      return { runsA, runsB };
    });
    expect(result).toEqual({ runsA: 2, runsB: 1 });
  });

  test("$__uni_run_effects: cleanup runs before re-run", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const inst: any = { effects: [], layoutEffects: [], children: [], _disposables: [], _resources: [] };
      const a = w.$_us(0);
      const log: string[] = [];
      inst.effects.push({
        fn: () => { log.push("run"); return () => log.push("cleanup"); },
        deps: [a], lastDeps: null, cleanup: null, depUnsubs: []
      });
      w.$__uni_run_effects(inst, inst.effects);
      a.value = 1;
      w.$__uni_run_effects(inst, inst.effects);
      return log;
    });
    expect(result).toEqual(["run", "cleanup", "run"]);
  });

  test("$__uni_reconcile_list: keyed reorder preserves node identity", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const ul = document.createElement("ul");
      document.body.appendChild(ul);
      const start = document.createComment("s");
      const end = document.createComment("e");
      ul.appendChild(start);
      ul.appendChild(end);
      const mk = (k: string, label: string) => ({ t: "li", p: { key: k }, c: [label] });
      let tracked = w.$__uni_reconcile_list(start, end, [mk("a", "A"), mk("b", "B")], null);
      const nodeA = start.nextSibling;
      // reverse the list
      tracked = w.$__uni_reconcile_list(start, end, [mk("b", "B"), mk("a", "A")], tracked);
      const first = start.nextSibling;
      const second = first.nextSibling;
      const out = {
        firstKey: first.__uni_vnode_key,
        secondKey: second.__uni_vnode_key,
        aIdentityPreserved: second === nodeA,
        aText: second.textContent,
      };
      ul.remove();
      return out;
    });
    expect(result).toEqual({
      firstKey: "b",
      secondKey: "a",
      aIdentityPreserved: true,
      aText: "A",
    });
  });

  test("$__uni_reconcile_list: keyed removal drops only the removed node", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const ul = document.createElement("ul");
      document.body.appendChild(ul);
      const start = document.createComment("s");
      const end = document.createComment("e");
      ul.appendChild(start);
      ul.appendChild(end);
      const mk = (k: string, label: string) => ({ t: "li", p: { key: k }, c: [label] });
      let tracked = w.$__uni_reconcile_list(start, end, [mk("a", "A"), mk("b", "B"), mk("c", "C")], null);
      tracked = w.$__uni_reconcile_list(start, end, [mk("a", "A"), mk("c", "C")], tracked);
      const keys: string[] = [];
      let n = start.nextSibling;
      while (n && n !== end) {
        if (n.nodeType === 1) keys.push(n.__uni_vnode_key + ":" + n.textContent);
        n = n.nextSibling;
      }
      ul.remove();
      return keys;
    });
    expect(result).toEqual(["a:A", "c:C"]);
  });

  test("$__uni_dispose: runs effect cleanups and releases resources", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const log: string[] = [];
      const inst: any = {
        children: [],
        effects: [{ cleanup: () => log.push("effect"), depUnsubs: [] }],
        layoutEffects: [{ cleanup: () => log.push("layout"), depUnsubs: [] }],
        _disposables: [() => log.push("disposable")],
        _resources: [{ $_dispose: () => log.push("resource") }],
        parent: null,
      };
      w.$__uni_dispose(inst);
      return log;
    });
    expect(result.sort()).toEqual(["disposable", "effect", "layout", "resource"]);
  });

  test("$__uni_register_resource: attributes signals to the render instance", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      const inst: any = { _resources: [] };
      const prev = w.$__uni_render_instance;
      w.$__uni_render_instance = inst;
      const s = w.$_us(0);
      const c = w.$_ucs(() => s.value);
      w.$__uni_render_instance = prev;
      return { count: inst._resources.length, hasDispose: typeof s.$_dispose === "function" };
    });
    expect(result.count).toBe(2);
    expect(result.hasDispose).toBe(true);
  });

  test("$__uni_shallow_equal: element-wise equality", async () => {
    const result = await page.evaluate(() => {
      const w = window as any;
      return {
        eq: w.$__uni_shallow_equal([1, 2], [1, 2]),
        neq: w.$__uni_shallow_equal([1, 2], [1, 3]),
        len: w.$__uni_shallow_equal([1], [1, 2]),
      };
    });
    expect(result).toEqual({ eq: true, neq: false, len: false });
  });
});
