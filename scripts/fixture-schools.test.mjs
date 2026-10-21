import test from "node:test";
import assert from "node:assert/strict";
import { FixtureSchoolsApi } from "./fixture-schools.mjs";

let sequence = 0;
const types = [
  { id: 3, name: "Szkoła podstawowa", isDel: false },
  { id: 100, name: "Zespół szkół", isDel: false },
];
const def = { id: "1", name: "AUTO_API_SP", type: "Szkoła podstawowa" };
const row = {
  id: 1,
  name: def.name,
  typeId: 3,
  institutionUnitId: 101,
  isDel: false,
  quantityOfStudents: 100,
};
function fixture(options = {}) {
  const calls = [];
  const request = {
    async get(url, args) {
      const path = new URL(url).pathname;
      calls.push({ path, params: args.params });
      if (options.connectionError) throw Error("Authorization: Bearer SECRET");
      let body;
      if (path.endsWith("GetSchoolTypes")) body = types;
      else if (path.endsWith("GetInstitutions")) {
        const filter = JSON.parse(args.params.filterModel);
        body = options.body ?? {
          data: filter.institutionIds
            ? (options.rows ?? [row])
            : (options.searchRows ?? options.rows ?? [row]),
          metaData: { totalItems: 1 },
        };
      } else body = options.flag ?? true;
      return {
        ok: () => !options.status,
        status: () => options.status ?? 200,
        json: async () => body,
      };
    },
  };
  return {
    calls,
    api: new FixtureSchoolsApi(request, {
      baseURL: `https://fixtures-${++sequence}.test`,
      headers: { Authorization: "Bearer SECRET" },
      userId: 2,
    }),
  };
}

test("fixture: zbiorczy GET po ID, bez historii wyszukiwania i bez nawigacji ani zapisów", async () => {
  const second = { ...row, id: 2, institutionUnitId: 102, name: "AUTO_API_SP_B" };
  const { api, calls } = fixture({ rows: [row, second] });
  const data = await api.findMany([def, { ...def, id: "2", name: second.name }]);
  assert.equal(data.length, 2);
  assert.equal(data[0].tested, true);
  const searches = calls.filter((c) => c.path.endsWith("GetInstitutions"));
  assert.equal(searches.length, 1);
  const filter = JSON.parse(searches[0].params.filterModel);
  assert.deepEqual(filter.institutionIds, ["1", "2"]);
  assert.equal(filter.saveSearchHistory, false);
  assert.ok(
    calls.every(
      (c) => !c.path.includes("Add") && !c.path.includes("Update") && !c.path.includes("Delete"),
    ),
  );
  await api.findMany([def]);
  assert.equal(
    calls.filter((c) => c.path.endsWith("GetSchoolTypes")).length,
    1,
    "Słownik tylko raz, ale aktualne rekordy i flagi przy każdym przygotowaniu",
  );
});

test("fixture: brak ID odzyskuje dokładną nazwę, a brak obu zwraca jawne null", async () => {
  const { api, calls } = fixture({ rows: [], searchRows: [row] });
  assert.equal((await api.findMany([def]))[0].id, "1");
  assert.equal(calls.filter((c) => c.path.endsWith("GetInstitutions")).length, 2);
  const empty = fixture({ rows: [], searchRows: [] });
  assert.deepEqual(await empty.api.findMany([def]), [null]);
});

test("fixture: niejednoznaczność, obce dane, usunięta szkoła i niewłaściwy typ blokują przygotowanie", async () => {
  for (const rows of [
    [row, row],
    [{ ...row, name: "Obca szkoła" }],
    [{ ...row, isDel: true }],
    [{ ...row, typeId: 100 }],
  ])
    await assert.rejects(fixture({ rows }).api.findMany([def]));
  await assert.rejects(fixture({ rows: [], searchRows: [row, row] }).api.findMany([def]));
  const guarded = fixture();
  await assert.rejects(guarded.api.findMany([{ ...def, name: "Zwykła szkoła" }]));
  assert.equal(guarded.calls.length, 0);
});

test("fixture: HTTP 401/403/500 i sieć nie są traktowane jak brak szkoły; błędy nie ujawniają tokenu", async () => {
  for (const status of [401, 403, 500])
    await assert.rejects(fixture({ status }).api.findMany([def]), /HTTP/);
  await assert.rejects(
    fixture({ connectionError: true }).api.findMany([def]),
    (error) => !error.message.includes("SECRET"),
  );
});

test("fixture: ilości i flaga Testowy są odczytywane, a nie naprawiane w ciemno", async () => {
  await assert.rejects(fixture().api.findMany([{ ...def, rspo: "12345" }]), /RSPO/);
  await assert.rejects(fixture().api.findMany([{ ...def, count: 99 }]), /liczba uczniów/);
  assert.equal(
    (await fixture({ flag: false }).api.findMany([{ ...def, count: 100 }]))[0].tested,
    false,
  );
  await assert.rejects(fixture({ flag: "true" }).api.findMany([def]), /logiczną/);
});

test("fixture: zespół używa własnego endpointu flagi, a uszkodzona i niepełna odpowiedź jest odrzucana", async () => {
  const group = { ...row, name: "AUTO_API_ZESPOL", typeId: 100 };
  const f = fixture({ rows: [group] });
  await f.api.findMany([{ ...def, name: group.name, type: "Zespół szkół" }]);
  assert.ok(
    f.calls.some(
      (c) =>
        c.path === "/api/SchoolComplex/GetSchoolComplexIsTested" && c.params.schoolComplexId === 1,
    ),
  );
  for (const body of [{ data: null }, { data: [row], metaData: { totalItems: 501 } }])
    await assert.rejects(fixture({ body }).api.findMany([def]));
});
