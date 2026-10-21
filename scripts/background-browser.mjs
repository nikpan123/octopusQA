import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout, clearTimeout } from "node:timers";

// PWDEBUG is captured when Playwright loads. Changing it around launch() in the
// test worker cannot disable the Inspector for preparation browsers.
export async function launchBackgroundBrowser(type) {
  if (!process.env.PWDEBUG || ["0", "false", "console"].includes(process.env.PWDEBUG)) {
    const browser = await type.launch({ headless: true });
    return { browser, close: () => browser.close() };
  }
  const worker = fork(
    fileURLToPath(new URL("./background-browser-worker.mjs", import.meta.url)),
    [type.name()],
    {
      env: { ...process.env, PWDEBUG: "0" },
      execArgv: [],
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    },
  );
  const stop = async () => {
    if (worker.exitCode !== null || worker.signalCode !== null) return;
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        worker.kill();
        resolve();
      }, 6000);
      worker.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
      if (worker.connected) worker.send({ command: "close" }, () => {});
      else worker.kill();
    });
  };
  try {
    const endpoint = await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => finish(new Error("Przekroczono czas uruchamiania przygotowania w tle.")),
        30000,
      );
      const finish = (error, value) => {
        clearTimeout(timer);
        worker.off("message", onMessage);
        worker.off("error", onError);
        worker.off("exit", onExit);
        if (error) reject(error);
        else resolve(value);
      };
      const onError = () => finish(new Error("Nie można uruchomić przygotowania w tle."));
      const onExit = () =>
        finish(new Error("Proces przygotowania zakończył się przed uruchomieniem przeglądarki."));
      const onMessage = (message) => {
        if (message?.error) return onError();
        if (typeof message?.endpoint !== "string") return;
        const url = new URL(message.endpoint);
        if (url.protocol !== "ws:" || url.hostname !== "127.0.0.1") return onError();
        finish(null, message.endpoint);
      };
      worker.on("message", onMessage);
      worker.once("error", onError);
      worker.once("exit", onExit);
    });
    const browser = await type.connect(endpoint);
    return {
      browser,
      async close() {
        try {
          await browser.close();
        } finally {
          await stop();
        }
      },
    };
  } catch (error) {
    await stop();
    throw error;
  }
}
