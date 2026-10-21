import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { safeGuidedValue } from "./guided-api.mjs";

const active = new AsyncLocalStorage();
const enabled = () => process.env.OCTOPUS_GUIDED_API === "1" || process.env.QA_TEST_DEBUGGER === "1";
async function send(path, body) {
  const base = new URL(process.env.OCTOPUS_GUIDED_URL);
  if (base.protocol !== "http:" || base.hostname !== "127.0.0.1")
    throw new Error("Podgląd API wymaga lokalnego panelu.");
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-guided-key": process.env.OCTOPUS_GUIDED_KEY },
    body: JSON.stringify({ ...body, runId: process.env.OCTOPUS_UI_RUN_ID }),
    ...(path.endsWith("wait") ? {} : { signal: AbortSignal.timeout(10000) }),
  });
  if (!response.ok)
    throw new Error(
      "Panel podglądu API odrzucił aktualizację. Zatrzymaj przebieg i uruchom go ponownie.",
    );
  return response.json();
}

export async function guidedOperation(title, operation, automatic = false, options = {}) {
  if (!enabled() || active.getStore()) return operation();
  const stepId = randomUUID();
  await send("/api/guided/event", { kind: "start", stepId, title, automatic, checkpoint: options.checkpoint === true, inspection: options.inspection });
  if (!automatic) {
    const result = await send("/api/guided/wait", { stepId });
    if (!result.proceed) throw new Error("Podgląd API zatrzymany przed wykonaniem kroku.");
  }
  try {
    const result = await active.run({ stepId, automatic }, operation);
    await send("/api/guided/event", { kind: "finish", stepId, status: "passed" });
    return result;
  } catch (error) {
    await send("/api/guided/event", {
      kind: "finish",
      stepId,
      status: "failed",
      error: safeGuidedValue(error.message),
    }).catch(() => {});
    throw error;
  }
}

// Only the scoped business step is recorded; setup, authentication and cleanup
// are never captured. Original fetch is called exactly once, unchanged.
export function observeGuidedRequests(request) {
  if (!enabled()) return () => {};
  const original = request.fetch;
  request.fetch = async function (url, options = {}) {
    const step = active.getStore();
    const path = typeof url === "string" ? new URL(url, "http://local").pathname : "";
    if (!step || step.automatic || !/^\/api\/(SchoolOrder|SchoolComplexOrder)\//.test(path))
      return original.call(this, url, options);
    const event = {
      method: options.method || "GET",
      path,
      body: safeGuidedValue(options.data ?? null),
    };
    try {
      const response = await original.call(this, url, options);
      event.status = response.status();
      // Do not copy oversized bodies into the live panel.
      const length = Number(response.headers()["content-length"] || 0);
      if (length > 256 * 1024) event.response = "Odpowiedź za duża — szczegóły w raporcie/trace.";
      else {
        const body = await response.body();
        if (body.length > 256 * 1024)
          event.response = "Odpowiedź za duża — szczegóły w raporcie/trace.";
        else {
          try {
            event.response = safeGuidedValue(JSON.parse(body.toString("utf8")));
          } catch {
            event.response = "Odpowiedź nie jest JSON-em — szczegóły w raporcie.";
          }
        }
      }
      await send("/api/guided/event", { kind: "request", stepId: step.stepId, request: event });
      return response;
    } catch (error) {
      event.error = safeGuidedValue(error.message);
      await send("/api/guided/event", {
        kind: "request",
        stepId: step.stepId,
        request: event,
      }).catch(() => {});
      throw error;
    }
  };
  return () => {
    request.fetch = original;
  };
}
