import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { previewFromHtml, validPreviewId, redactPreview } from "./test-preview.mjs";
import { buildRunArguments } from "./test-ui-server.mjs";

const require = createRequire(import.meta.url);
const { yazl } = require(
  path.join(path.dirname(require.resolve("playwright-core/package.json")), "lib/utilsBundle.js"),
);
async function htmlReport(files) {
  const zip = new yazl.ZipFile();
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    zip.outputStream.on("data", (chunk) => chunks.push(chunk));
    zip.outputStream.on("end", resolve);
    zip.outputStream.on("error", reject);
  });
  for (const [name, content] of Object.entries(files))
    zip.addBuffer(Buffer.from(JSON.stringify(content)), name);
  zip.end();
  await done;
  return `<template>data:application/zip;base64,${Buffer.concat(chunks).toString("base64")}</template>`;
}

test("podgląd: dokładne ID, ostatnia próba, kroki, błędy i załączniki API", async () => {
  const html = await htmlReport({
    "tests.json": {
      tests: [
        { title: "ORD-100: inny test", results: [{ status: "passed" }] },
        {
          title: "ORD-10: kopiowanie",
          results: [
            { status: "failed" },
            {
              status: "failed",
              retry: 1,
              steps: [
                {
                  title: "Zapis API",
                  steps: [{ title: "Porównanie", error: { message: "Expected 3, Received 99" } }],
                },
              ],
              errors: [{ message: "Expected 3, Received 99" }],
              attachments: [
                {
                  name: "API",
                  contentType: "application/json",
                  body: JSON.stringify({
                    status: 200,
                    before: 3,
                    after: 99,
                    Authorization: "Bearer sensitive",
                    password: "hidden",
                  }),
                },
                { name: "screenshot", contentType: "image/png", path: "data/image.png" },
                { name: "bad screenshot", contentType: "image/png", path: "../../.env" },
              ],
            },
          ],
        },
      ],
    },
  });
  const preview = await previewFromHtml(html, "ORD-10", {
    assetsBase: "/report/123/",
    environment: "dev",
  });
  assert.equal(preview.title, "ORD-10: kopiowanie");
  assert.equal(preview.attempt, 1);
  assert.equal(preview.steps[0].steps[0].error, "Expected 3, Received 99");
  assert.deepEqual(preview.attachments[0].body, {
    status: 200,
    before: 3,
    after: 99,
    Authorization: "[ukryto]",
    password: "[ukryto]",
  });
  assert.equal(preview.attachments[1].image, "/report/123/data/image.png");
  assert.equal(preview.attachments.length, 2);
  assert.equal(await previewFromHtml(html, "ORD-1"), null);
});

test("podgląd: lista bez wykonania nie jest raportem, sekrety nie wyciekają", async () => {
  assert.equal(
    await previewFromHtml(
      await htmlReport({ "tests.json": { tests: [{ title: "ORD-10: lista", results: [] }] } }),
      "ORD-10",
    ),
    null,
  );
  assert.equal(await previewFromHtml("niepełny raport", "ORD-10"), null);
  for (const id of ["../.env", "ORD-1|ORD-2", "", null]) assert.equal(validPreviewId(id), false);
  assert.equal(
    redactPreview("Authorization: Bearer secret-value"),
    "Authorization: Bearer [ukryto]",
  );
  assert.deepEqual(
    redactPreview({ token: "value", nested: { refreshToken: "value", quantity: 99 } }),
    { token: "[ukryto]", nested: { refreshToken: "[ukryto]", quantity: 99 } },
  );
});

test("krok po kroku: tylko jeden test, jeden worker, bez retries, z trace i Inspektorem", () => {
  const built = buildRunArguments({
    debug: true,
    selectedTestIds: ["ORD-BUG-36290-03"],
    workers: 4,
    grep: "inne",
    suite: "all",
  });
  for (const flag of ["--debug", "--workers=1", "--retries=0", "--trace=on"])
    assert.ok(built.args.includes(flag));
  assert.equal(built.workers, 1);
  assert.equal(built.args.includes("inne"), false);
  for (const selectedTestIds of [[], ["ORD-1", "ORD-2"], ["ORD-1|ORD-2"]])
    assert.throws(() => buildRunArguments({ debug: true, selectedTestIds }));
  assert.throws(() =>
    buildRunArguments({ debug: true, selectedTestIds: ["ORD-1"], annualMode: "YEAR" }),
  );
  const normal = buildRunArguments({ workers: 2, suite: "orders" });
  assert.equal(normal.args.includes("--debug"), false);
  assert.equal(normal.workers, 2);
});
