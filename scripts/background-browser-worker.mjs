import { chromium, firefox, webkit } from "playwright-core";

// No credentials, pages or application data pass through IPC; only a local
// Playwright endpoint. Parent death closes this worker and its own browser.
if (!process.send) throw new Error("Proces przygotowania wymaga lokalnego kanału IPC.");
const type = { chromium, firefox, webkit }[process.argv[2]];
let server;
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  try {
    await server?.close();
  } finally {
    process.exit(0);
  }
}
process.on("disconnect", close);
process.on("message", (message) => {
  if (message?.command === "close") void close();
});
try {
  if (!type || process.env.PWDEBUG !== "0")
    throw new Error("Niepoprawna konfiguracja przygotowania.");
  server = await type.launchServer({ headless: true, host: "127.0.0.1", port: 0 });
  if (closing || !process.connected) await close();
  else process.send({ endpoint: server.wsEndpoint() });
} catch {
  if (process.connected) process.send({ error: true });
  await close();
}
