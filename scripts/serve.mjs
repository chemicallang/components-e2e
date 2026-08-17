#!/usr/bin/env node
// Zero-dependency static server for the compiled app output (app/output/).
// Playwright's webServer config starts/stops this automatically.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(repoRoot, "app/output");
const port = Number(process.env.E2E_PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (pathname === "/") pathname = "/index.html";
    // Prevent path traversal.
    const filePath = normalize(join(outputDir, pathname));
    if (!filePath.startsWith(outputDir)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    if (!existsSync(filePath)) {
      res.writeHead(404).end("not found");
      return;
    }
    const data = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(500).end("internal error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[serve] ${outputDir} → http://127.0.0.1:${port}`);
});
