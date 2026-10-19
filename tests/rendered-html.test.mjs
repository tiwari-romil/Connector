import assert from "node:assert/strict";
import test from "node:test";

test("production game opens on the welcome screen with Puzzle Adventure, quizzes and discovery missions", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const response = await worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const label of ["LogIQids exam prep", "Puzzle Adventure", "Level quizzes", "Discovery missions", "Hear it again", "Hridhaan"]) assert.ok(html.includes(label), label);
  assert.doesNotMatch(html, /Your site is taking shape/);
});
