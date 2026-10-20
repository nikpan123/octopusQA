// Przygotowanie danych wyłącznie przez GET; tworzenie/oznaczanie pozostaje jawne w adapterze UI.
const dictionaries = new Map();

export class FixtureSchoolsApi {
  constructor(request, { baseURL, headers, userId }) {
    this.request = request;
    this.baseURL = baseURL;
    this.headers = headers;
    this.userId = userId;
  }

  async get(path, params = {}) {
    let response;
    try {
      response = await this.request.get(new URL(path, this.baseURL).href, {
        headers: this.headers,
        params,
      });
    } catch {
      throw new Error(
        `Przygotowanie szkół: błąd połączenia GET ${path}. Nie tworzymy zastępczych danych.`,
      );
    }
    if (!response.ok())
      throw new Error(
        `Przygotowanie szkół: GET ${path}: HTTP ${response.status()}. Nie tworzymy zastępczych danych po błędzie API.`,
      );
    return response.json();
  }

  async types() {
    if (!dictionaries.has(this.baseURL))
      dictionaries.set(
        this.baseURL,
        this.get("/api/Dictionary/GetSchoolTypes").catch((error) => {
          dictionaries.delete(this.baseURL);
          throw error;
        }),
      );
    const types = await dictionaries.get(this.baseURL);
    if (!Array.isArray(types)) throw new Error("Niepoprawny słownik typów szkół.");
    return types;
  }

  async query(filter) {
    const body = await this.get("/api/InstitutionBrowser/GetInstitutions", {
      filterModel: JSON.stringify({
        ...filter,
        saveSearchHistory: false,
        page: 1,
        limit: 500,
        userId: this.userId,
      }),
    });
    if (!Array.isArray(body.data) || (body.metaData?.totalItems ?? 0) > 500)
      throw new Error("Niepełna lub niepoprawna lista szkół; nie tworzymy duplikatów.");
    return body.data;
  }

  validate(row, definition, cachedId) {
    if (!/^(?:AUTO_|AUTOMAT CLUB )/.test(definition.name))
      throw new Error("Przygotowanie dotyczy wyłącznie wydzielonych szkół testowych.");
    if (cachedId && String(row.id) !== String(cachedId))
      throw new Error("API zwróciło inne ID szkoły niż zapisane w rejestrze.");
    if (row.name !== definition.name)
      throw new Error(
        `Szkoła ${row.id}: nazwa nie odpowiada rejestrowi. Nie naprawiamy obcego rekordu.`,
      );
    if (row.isDel !== false)
      throw new Error(`Szkoła ${row.id}: rekord jest usunięty lub zawieszony.`);
    if (!Number.isSafeInteger(row.institutionUnitId) || row.institutionUnitId <= 0)
      throw new Error("Niepoprawne institutionUnitId szkoły.");
  }

  async findMany(definitions) {
    for (const definition of definitions)
      if (!/^(?:AUTO_|AUTOMAT CLUB )/.test(definition.name))
        throw new Error("Dozwolone są wyłącznie wydzielone szkoły testowe.");
    const types = await this.types();
    const cached = definitions.filter((d) => d.id);
    for (const d of cached)
      if (!/^[1-9]\d*$/.test(String(d.id))) throw new Error("Niepoprawne ID szkoły w rejestrze.");
    const rows = cached.length
      ? await this.query({ institutionIds: cached.map((d) => String(d.id)) })
      : [];
    return Promise.all(
      definitions.map(async (definition) => {
        let matches = definition.id
          ? rows.filter((row) => String(row.id) === String(definition.id))
          : [];
        if (matches.length > 1) throw new Error("API zwróciło powielone ID szkoły.");
        if (matches.length) this.validate(matches[0], definition, definition.id);
        else {
          // Pusty, poprawny odczyt ID to nie powód do tworzenia: najpierw odzyskaj po dokładnej nazwie.
          matches = (await this.query({ nameOrFullName: definition.name })).filter(
            (row) => row.name === definition.name,
          );
          if (matches.length > 1)
            throw new Error(
              `Niejednoznaczna szkoła testowa ${definition.name}; nie tworzymy kolejnej.`,
            );
        }
        if (!matches.length) return null;
        const row = matches[0];
        this.validate(row, definition);
        const type = types.filter((type) => type.name === definition.type && type.isDel === false);
        if (type.length !== 1 || row.typeId !== type[0].id)
          throw new Error(`Szkoła ${row.id}: niewłaściwy typ, oczekiwano ${definition.type}.`);
        if (Object.hasOwn(definition, "count")) {
          const valid =
            definition.count === undefined
              ? row.quantityOfStudents == null || row.quantityOfStudents === 0
              : row.quantityOfStudents === definition.count;
          if (!valid)
            throw new Error(`Szkoła ${row.id}: niezgodna liczba uczniów w danych przygotowania.`);
        }
        if (definition.rspo !== undefined && String(row.rspo) !== definition.rspo)
          throw new Error(`Szkoła ${row.id}: niezgodny numer RSPO.`);
        const complex = type[0].name === "Zespół szkół";
        const tested = await this.get(
          complex ? "/api/SchoolComplex/GetSchoolComplexIsTested" : "/api/School/GetSchoolIsTested",
          complex ? { schoolComplexId: row.id } : { schoolId: row.id },
        );
        if (typeof tested !== "boolean")
          throw new Error("API flagi Testowy musi zwrócić wartość logiczną.");
        return {
          id: String(row.id),
          name: row.name,
          institutionUnitId: row.institutionUnitId,
          typeId: row.typeId,
          tested,
          quantityOfStudents: row.quantityOfStudents,
        };
      }),
    );
  }
}
