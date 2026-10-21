import { test as base, expect } from "../tests/support/fixtures";
const origin = "http://single-tab.test";
let previousTarget: string;
const test = base.extend({
  authSession: async ({}, use, info) => {
    const token = info.title.includes("pierwszy") ? "offline-token-1" : "offline-token-2";
    await use({
      storageState: {
        cookies: [],
        origins: [{ origin, localStorage: [{ name: "token", value: token }] }],
      },
      session: { origin, values: { baseline: "restored" } },
    });
  },
});
test("pierwszy test pozostawia stan do kontroli resetu", async ({ page }) => {
  const session = await page.context().newCDPSession(page);
  previousTarget = (await session.send("Target.getTargetInfo")).targetInfo.targetId;
  await session.detach();
  await page.route("**/*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>First</h1>" }),
  );
  await page.goto(origin);
  await expect(page.locator("h1")).toHaveText("First");
  await page.evaluate(() => {
    localStorage.setItem("leak", "first");
    sessionStorage.setItem("leak", "first");
  });
  await page.context().addCookies([{ name: "leak", value: "first", url: origin }]);
  expect(page.listenerCount("requestfailed")).toBe(1);
});
test("drugi test zachowuje kartę, lecz nie dziedziczy stanu ani starego tokenu", async ({
  page,
}) => {
  const session = await page.context().newCDPSession(page);
  expect((await session.send("Target.getTargetInfo")).targetInfo.targetId).toBe(previousTarget);
  await session.detach();
  expect(page.context().pages()).toHaveLength(1);
  await page.route("**/*", (route) =>
    route.fulfill({ contentType: "text/html", body: "<h1>Second</h1>" }),
  );
  await page.goto(origin);
  await expect(page.locator("h1")).toHaveText("Second");
  expect(
    await page.evaluate(() => ({
      token: localStorage.getItem("token"),
      local: localStorage.getItem("leak"),
      session: sessionStorage.getItem("leak"),
      baseline: sessionStorage.getItem("baseline"),
    })),
  ).toEqual({ token: "offline-token-2", local: null, session: null, baseline: "restored" });
  expect((await page.context().cookies()).some((cookie) => cookie.name === "leak")).toBe(false);
  expect(page.listenerCount("requestfailed")).toBe(1);
});
