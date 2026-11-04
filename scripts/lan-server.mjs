import http from "node:http";
import { spawn } from "node:child_process";

const lanPort = Number(process.argv[2] ?? 3100);
const internalPort = 3200;
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

const game = spawn(npxCommand, ["vinext", "dev", "--port", String(internalPort)], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: process.platform === "win32",
});

// This proxies a development server with no login, so only answer devices on the home network
// (and this computer). If the port is ever forwarded or the machine has a public address,
// outside requests are refused instead of reaching the dev server.
const PRIVATE_CLIENT = /^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.)/;
function isLocalClient(address = "") {
  const ip = address.replace(/^::ffff:/i, "");
  return PRIVATE_CLIENT.test(ip) || ip === "::1";
}

const server = http.createServer((request, response) => {
  if (!isLocalClient(request.socket.remoteAddress)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("This game only plays on the home network.");
    return;
  }
  const upstream = http.request({
    hostname: "::1",
    port: internalPort,
    family: 6,
    path: request.url,
    method: request.method,
    headers: request.headers,
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on("error", () => {
    if (!response.headersSent) {
      response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("The game is starting. Please refresh in a moment.");
  });
  request.pipe(upstream);
});

function stop() {
  server.close();
  game.kill();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
game.on("exit", (code) => {
  if (code && code !== 0) console.error(`Game server stopped with code ${code}.`);
});

server.listen(lanPort, "0.0.0.0", () => {
  console.log(`LAN bridge ready on http://0.0.0.0:${lanPort}`);
  console.log("Only devices on this home network can connect. Use it on a trusted Wi-Fi, not a public one.");
});
