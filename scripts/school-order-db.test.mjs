import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateDbConfiguration, validateSqlId } from "./school-order-db.mjs";
import { buildRunArguments } from "./test-ui-server.mjs";

const config = {
  OCTOPUS_ENV: "dev",
  OCTOPUS_DEV_DB_NAME: "GWO_CRMDEV",
  OCTOPUS_DEV_DB_SERVER: "fake-server",
  OCTOPUS_DEV_DB_USER: "fake-reader",
  OCTOPUS_DEV_DB_PASSWORD: "offline-secret",
};

test("SQL: tylko jawna baza DEV; bez wycieku danych logowania w błędach", () => {
  assert.doesNotThrow(() => validateDbConfiguration(config));
  for (const override of [
    { OCTOPUS_ENV: "test" },
    { OCTOPUS_DEV_DB_NAME: "GWO_CRMTEST" },
    { OCTOPUS_DEV_DB_NAME: "" },
    { OCTOPUS_DEV_DB_PASSWORD: "" },
    { OCTOPUS_DEV_DB_PORT: "1433;DROP" },
  ]) {
    assert.throws(
      () => validateDbConfiguration({ ...config, ...override }),
      (error) =>
        !error.message.includes("offline-secret") && !error.message.includes("fake-reader"),
    );
  }
});

test("SQL: identyfikatory są liczbami Int, nigdy fragmentem zapytania", () => {
  assert.equal(validateSqlId("1013414"), 1013414);
  for (const id of ["1 OR 1=1", "1;DELETE FROM SchoolOrder", "-1", 0, "", null, "2147483648"])
    assert.throws(() => validateSqlId(id));
});

test("SQL: adapter ma wyłącznie stałe SELECT i parametry obu identyfikatorów", async () => {
  const script = await readFile(new URL("./read-school-order.ps1", import.meta.url), "utf8");
  const queries = [...script.matchAll(/\$command\.CommandText = '(.*?)'/g)].map((m) => m[1]);
  assert.equal(queries.length, 2);
  assert.ok(queries.every((query) => query.startsWith("SELECT ")));
  assert.match(queries[1], /WHERE Id = @OrderId AND SchoolId = @SchoolId$/);
  assert.match(queries[1], /^SELECT Id, SchoolId, IsDel, IsCopied FROM dbo\.SchoolOrder /);
  assert.match(script, /isCopied = \[bool\]\$reader\['IsCopied'\]/);
  assert.match(script, /Parameters\.Add\('@OrderId', \[System\.Data\.SqlDbType\]::Int\)/);
  assert.match(script, /Parameters\.Add\('@SchoolId', \[System\.Data\.SqlDbType\]::Int\)/);
  assert.doesNotMatch(script, /\$command\.CommandText = \$|ExecuteNonQuery|ExecuteReader\([^)]*\$/);
});

test("SQL: osobny pakiet / wybrany test; zwykła regresja nie wymaga dostępu do bazy", () => {
  assert.equal(buildRunArguments({ suite: "all" }).includeDatabase, false);
  assert.equal(buildRunArguments({ suite: "orders" }).includeDatabase, false);
  assert.equal(buildRunArguments({ suite: "database" }).includeDatabase, true);
  const databaseRun = buildRunArguments({ suite: "database" });
<<<<<<< Updated upstream
  assert.ok(databaseRun.args.includes("tests/zamowienia-kopie-baza.spec.ts"));
=======
  assert.ok(databaseRun.args.includes("tests/zamowienia-softlab-odczyt.spec.ts"));
>>>>>>> Stashed changes
  for (const id of ["ORD-DB-02", "ORD-DB-03"])
    assert.equal(buildRunArguments({ selectedTestIds: [id] }).includeDatabase, true);
  assert.equal(buildRunArguments({ suite: "database", workers: 4 }).workers, 1);
  assert.throws(() => buildRunArguments({ suite: "database", environment: "test" }));
  assert.throws(() =>
    buildRunArguments({ debug: true, selectedTestIds: ["ORD-DB-01"], environment: "test" }),
  );
  assert.equal(buildRunArguments({ selectedTestIds: ["ORD-DB-01"] }).includeDatabase, true);
  assert.equal(
    buildRunArguments({ debug: true, selectedTestIds: ["ORD-DB-01"] }).includeDatabase,
    true,
  );
});
