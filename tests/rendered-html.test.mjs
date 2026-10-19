import assert from "node:assert/strict";
import test from "node:test";

test("production game opens on the welcome screen with every game on offer", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of ["Olympiad exam prep", "Puzzle Adventure", "Maths", "Science", "Hi friend!", "add a name"]) assert.ok(html.includes(label), label);
});
