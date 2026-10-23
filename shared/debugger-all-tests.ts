/* eslint-disable @typescript-eslint/no-explicit-any -- Preserve overloaded public Playwright methods and fixture generics when forwarding arguments. */
import type { Page, TestInfo, TestType } from "@playwright/test";
import {
  guidedOperation,
  guidedOperationActive,
  recordGuidedResponse,
} from "../scripts/guided-api-client.mjs";

// Public Playwright methods only. The scope begins after the page/session
// fixtures have been prepared; authentication and the screenshot pump stay out.
// Playwright resumes test bodies outside the fixture's async context. A worker
// executes a single test at a time; the fixture owns this scope until teardown.
let current: { tail: Promise<unknown> } | undefined;
const enabled = () =>
  process.env.QA_TEST_DEBUGGER === "1" && process.env.QA_DEBUGGER_GENERIC === "1";
const instrumented = new WeakSet<object>();
const patched = new WeakMap<object, Set<string>>();

function operation<T>(title: string, action: () => Promise<T>): Promise<T> {
  const session = current;
  if (!enabled() || !session || guidedOperationActive()) return action();
  // Parallel preparation is deliberately serialized only in the debugger.
  const result = session.tail.then(() => guidedOperation(title, action));
  session.tail = result.catch(() => {});
  return result;
}

export function instrumentDebuggerTest<T extends TestType<any, any>>(test: T): T {
  if (instrumented.has(test)) return test;
  instrumented.add(test);
  const step = test.step;
  test.step = Object.assign(
    ((title: string, body: (...args: any[]) => any, options?: any) =>
      operation(title, () => step(title, body, options))) as typeof step,
    step,
  );
  const extend = test.extend;
  test.extend = ((...args: any[]) =>
    instrumentDebuggerTest(extend(...(args as [any])))) as typeof extend;
  const setTimeout = test.setTimeout;
  test.setTimeout = (timeout) => setTimeout(enabled() && current ? 0 : timeout);
  return test;
}

function patch(
  target: object,
  names: string[],
  title: (name: string, args: any[], receiver: any) => string,
  invoke?: (
    original: (...args: any[]) => any,
    receiver: any,
    name: string,
    args: any[],
  ) => Promise<any>,
) {
  for (const name of names) {
    let owner: any = target;
    while (owner && !Object.hasOwn(owner, name)) owner = Object.getPrototypeOf(owner);
    if (!owner || typeof owner[name] !== "function") continue;
    const methods = patched.get(owner) || new Set<string>();
    if (methods.has(name)) continue;
    methods.add(name);
    patched.set(owner, methods);
    const original = owner[name];
    owner[name] = function (...args: any[]) {
      if (!enabled() || !current) return original.apply(this, args);
      return operation(title(name, args, this), () =>
        invoke ? invoke(original, this, name, args) : original.apply(this, args),
      );
    };
  }
}

const labels: Record<string, string> = {
  goto: "Otwórz stronę",
  reload: "Odśwież stronę",
  goBack: "Wróć do poprzedniej strony",
  goForward: "Przejdź do następnej strony",
  setContent: "Przygotuj widok",
  click: "Kliknij",
  dblclick: "Kliknij dwukrotnie",
  fill: "Wypełnij pole",
  check: "Zaznacz",
  uncheck: "Odznacz",
  setChecked: "Zmień zaznaczenie",
  selectOption: "Wybierz opcję",
  press: "Naciśnij klawisz",
  pressSequentially: "Wpisz tekst",
  type: "Wpisz tekst",
  hover: "Najedź na element",
  focus: "Ustaw kursor w polu",
  blur: "Opuść pole",
  dragTo: "Przeciągnij element",
  setInputFiles: "Wybierz plik",
  insertText: "Wpisz tekst",
  tap: "Dotknij element",
  clear: "Wyczyść pole",
  dragAndDrop: "Przeciągnij element",
};
const actions = [
  "click",
  "dblclick",
  "fill",
  "check",
  "uncheck",
  "setChecked",
  "selectOption",
  "press",
  "pressSequentially",
  "type",
  "hover",
  "focus",
  "blur",
  "dragTo",
  "setInputFiles",
  "tap",
  "clear",
];

function browserTitle(name: string, _args: any[], receiver: any) {
  // Values entered into inputs and URLs are intentionally omitted (credentials).
  return `${labels[name] || name}${typeof receiver.toString === "function" && receiver.constructor?.name === "Locator" ? " · " + receiver.toString().slice(0, 180) : ""}`;
}

export async function withDebuggerTest(page: Page, info: TestInfo, use: () => Promise<void>) {
  if (!enabled()) return use();
  info.setTimeout(0);
  patch(
    page,
    ["goto", "reload", "goBack", "goForward", "setContent", ...actions, "dragAndDrop"],
    browserTitle,
  );
  patch(page.locator("html"), actions, browserTitle);
  patch(page.keyboard, ["press", "type", "insertText"], browserTitle);
  patch(page.mouse, ["click", "dblclick"], browserTitle);
  patch(
    page.context().request,
    ["fetch", "get", "post", "put", "patch", "delete", "head"],
    (name, args) => {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url?.() || "";
      const pathname = new URL(url, "http://local").pathname;
      return `API ${String(args[1]?.method || name).toUpperCase()} · ${pathname}`;
    },
    async (original, receiver, name, args) => {
      const response = await original.apply(receiver, args);
      await recordGuidedResponse(name, args, response);
      return response;
    },
  );
  current = { tail: Promise.resolve() };
  try {
    await operation(
      "Rozpocznij test · " + info.title.replace(/@[\w-]+/g, "").trim(),
      async () => {},
    );
    await use();
  } finally {
    current = undefined;
  }
}
