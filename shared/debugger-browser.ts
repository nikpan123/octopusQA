import type { Page, TestInfo } from "@playwright/test";

// Images are transient and belong to one run. No cookies, storage or browser
// control channel are sent to the dashboard. It can only advance business steps.
export async function startDebuggerPreview(page: Page, info: TestInfo) {
  if (process.env.QA_TEST_DEBUGGER !== "1") return async () => {};
  const base = new URL(process.env.OCTOPUS_GUIDED_URL!);
  if (base.protocol !== "http:" || base.hostname !== "127.0.0.1")
    throw new Error("Debugger wymaga lokalnego panelu.");
  let stopped = false;
  let task: Promise<void> | undefined;
  let last: Buffer | undefined;
  const capture = async () => {
    if (stopped || page.isClosed()) return;
    try {
      const active = page.context().pages().filter(item => !item.isClosed()).at(-1) || page;
      if (active.url() === "about:blank") return;
      const image = await active.screenshot({ type: "jpeg", quality: 55, timeout: 2000, animations: "allow" });
      if (stopped) return;
      last = image;
      await fetch(new URL("/api/debugger/frame", base), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-guided-key": process.env.OCTOPUS_GUIDED_KEY! },
        body: JSON.stringify({ runId: process.env.OCTOPUS_UI_RUN_ID, image: image.toString("base64") }),
        signal: AbortSignal.timeout(2500),
      });
    } catch { /* Navigation and closed popup windows may briefly prevent capture. */ }
  };
  const tick = () => { if (!task) task = capture().finally(() => { task = undefined; }); };
  tick();
  const timer = setInterval(tick, 900);
  return async () => {
    stopped = true;
    clearInterval(timer);
    await task;
    if (last) await info.attach("Debugger — ostatni widok", { body: last, contentType: "image/jpeg" });
  };
}
