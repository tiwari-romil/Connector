import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { unstable_startWorker } from "wrangler";

// Runs the production build in Cloudflare's own runtime (workerd), exactly as it is deployed,
// using the wrangler.json that the build writes next to the server bundle.
let worker;
before(async () => {
  worker = await unstable_startWorker({
    config: "dist/server/wrangler.json",
    dev: { server: { hostname: "127.0.0.1", port: 0 }, inspector: false, watch: false, logLevel: "error" },
  });
  await worker.ready;
});
after(async () => { await worker?.dispose(); });

test("production game opens on the welcome screen with every game on offer", async () => {
  const response = await worker.fetch("http://localhost/", { headers: { accept: "text/html" } });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of ["Olympiad exam prep", "Puzzle Adventure", "Memory games", "Maths", "Science", "Hi friend!", "add a name"]) assert.ok(html.includes(label), label);
});

test("metadata links use the real host, never a forged X-Forwarded-Host", async () => {
  const response = await worker.fetch("http://localhost/", {
    headers: { accept: "text/html", host: "connector.example.workers.dev", "x-forwarded-host": "evil.example", "x-forwarded-proto": "http" },
  });
  const html = await response.text();
  const image = html.match(/property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(image, "page has an og:image");
  assert.ok(!image.includes("evil.example"), image);
});
