#!/usr/bin/env node
// Builds the Chemical demo app (app/) into app/output/ using the Chemical
// TCCCompiler from the parent repo, then runs the exe to emit static files.
//
// Usage:
//   node scripts/build-app.mjs
//
// Env:
//   CHEMICAL_COMPILER   override path to the TCCCompiler binary
//                       (default: ../../cmake-build-debug/TCCCompiler, i.e. the
//                       parent Chemical repo's build dir)
//   BUILD_NO_CACHE=1    pass --no-cache to the compiler (full rebuild)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = resolve(repoRoot, "app");

// The compiler lives in the parent Chemical repository. When this repo is
// cloned standalone, it must be cloned into lang/compiled/components-e2e of
// the Chemical repo so this relative path resolves (up three levels: the
// repo dir → compiled → lang → repo root).
let compiler =
  process.env.CHEMICAL_COMPILER ||
  resolve(repoRoot, "../../../cmake-build-debug/TCCCompiler");

// Windows appends .exe.
if (!existsSync(compiler) && existsSync(compiler + ".exe")) {
  compiler += ".exe";
}

if (!existsSync(compiler)) {
  console.error(
    `[build] TCCCompiler not found at ${compiler}\n` +
      `Build the Chemical compiler first:\n` +
      `  cd <chemical-repo> && ./scripts/build.sh --tcc\n` +
      `Or set CHEMICAL_COMPILER=/path/to/TCCCompiler`
  );
  process.exit(1);
}

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (r.status !== 0) {
    console.error(`[build] command failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
};

// 1. Compile the Chemical app (relative to the app dir so imports resolve).
const cacheFlag = process.env.BUILD_NO_CACHE ? "--no-cache" : "--cache";
console.log(`[build] compiling app with ${compiler}`);
run(compiler, [
  "chemical.mod",
  "-o",
  "main.exe",
  "--mode",
  "debug_quick",
  cacheFlag,
], { cwd: appDir });

// 2. Run the app to write app/output/{index.html,index.css,index.js,...}.
console.log("[build] running app to emit static output");
run(resolve(appDir, "main.exe"), [], { cwd: appDir });

console.log("[build] done — static output in app/output/");
