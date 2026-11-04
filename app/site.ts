// The site's own origin, for absolute metadata links (Open Graph images and so on).
// Only the Host header is used: on Cloudflare it can only name a hostname routed to this worker,
// whereas X-Forwarded-Host / X-Forwarded-Proto are set by the client and could point links at
// someone else's site. A host that is not a plain hostname (or IP) with an optional port is ignored.

const FALLBACK = "http://localhost:3000";
const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*(?::\d{1,5})?$/i;
/** Local and home-network addresses are served over plain http (the dev server and the LAN launcher). */
const LOCAL = /^(?:localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/i;

export function siteOrigin(host: string | null | undefined): URL {
  const value = host?.trim() ?? "";
  if (!value || value.length > 253 || !HOSTNAME.test(value)) return new URL(FALLBACK);
  const name = value.replace(/:\d+$/, "");
  return new URL(`${LOCAL.test(name) ? "http" : "https"}://${value.toLowerCase()}`);
}
