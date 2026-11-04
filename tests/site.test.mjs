import assert from "node:assert/strict";
import test from "node:test";
import { siteOrigin } from "../app/site.ts";

test("site origin: real hosts get https, local and home-network hosts get http", () => {
  assert.equal(siteOrigin("connector.example.workers.dev").origin, "https://connector.example.workers.dev");
  assert.equal(siteOrigin("Example.COM").origin, "https://example.com");
  assert.equal(siteOrigin("localhost:3000").origin, "http://localhost:3000");
  assert.equal(siteOrigin("127.0.0.1:5173").origin, "http://127.0.0.1:5173");
  assert.equal(siteOrigin("192.168.1.20:3100").origin, "http://192.168.1.20:3100");
  assert.equal(siteOrigin("10.0.0.5:3100").origin, "http://10.0.0.5:3100");
  assert.equal(siteOrigin("172.20.1.1:3100").origin, "http://172.20.1.1:3100");
  assert.equal(siteOrigin("172.40.1.1").origin, "https://172.40.1.1");
});

test("site origin: missing or malformed hosts fall back instead of building odd links", () => {
  for (const host of [null, undefined, "", "   ", "evil.com/path", "evil.com@good.com", "user:pass@evil.com", "evil.com\r\nx: y", "javascript:alert(1)", "a".repeat(300), "-bad.com", "evil.com:99999999"]) {
    assert.equal(siteOrigin(host).origin, "http://localhost:3000", String(host));
  }
});
