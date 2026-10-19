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

const server = http.createServer((request, response) => {
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
});
