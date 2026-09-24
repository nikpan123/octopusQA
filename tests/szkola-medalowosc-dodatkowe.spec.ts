import { test, expect } from "./support/fixtures";

import { Octopus } from "./support/octopus";
import {
  expectUniqueMedalSubjects,
  searchSchoolsByMedalsWithApi,
  type SchoolMedal,
} from "./support/school-medal";

/*
 * =========================================================
 * SZK-MED-DOD-01
 * SPÓJNOŚĆ MEDAL <-> LICZBA PRZEDMIOTÓW POZA WARSZAWĄ
 * =========================================================
 *
 * Gap analysis, punkt F.28: próbkowanie coroczne (PREP/VERIFY w
 * support/school-medal-annual.ts, getRandomAnnualMedalCandidates)
 * jest na sztywno ograniczone do miasta Warszawa (filterModel.cityPost
 * === "warszawa"). Oznacza to, że jakość danych medalowych (patrz
 * znane ryzyko MED-57/58/59: spójność medalu z liczbą przedmiotów) jest
 * regularnie weryfikowana wyłącznie dla szkół warszawskich - żaden
 * istniejący test nie sprawdza tego samego dla reszty kraju.
 *
 * Ten test celowo NIE dotyka kruchej infrastruktury PREP/VERIFY z
 * school-medal-annual.ts (współdzielone zrzuty stanu powiązane z
 * konkretną datą kalendarzową). Zamiast tego korzysta z ogólnego,
 * niezależnego od miasta wyszukiwania po medalach
 * (searchSchoolsByMedalsWithApi, ten sam mechanizm co w MED-60) i
 * losowo próbkuje szkoły SPOZA Warszawy z bieżących danych.
 */

test("SZK-MED-DOD-01: zgodność medalu z liczbą przedmiotów jest audytowana także dla szkół spoza Warszawy @school @medal @data-quality", async ({
  page,
}, testInfo) => {
  const app = new Octopus(page);

  const { schools } = await searchSchoolsByMedalsWithApi(app, ["Złoto", "Srebro", "Brąz"]);

  const nonWarsawSchools = schools.filter((school) => {
    const city = (school as { city?: string }).city;
    return (
      typeof city === "string" && city.trim().toLowerCase() !== "warszawa" && city.trim() !== ""
    );
  });

  console.log(
    `SZK-MED-DOD-01: wyszukiwanie zwróciło ${schools.length} szkół z medalem, z czego ` +
      `${nonWarsawSchools.length} spoza Warszawy.`,
  );

  test.skip(
    nonWarsawSchools.length === 0,
    "Brak w dostępnych danych jakiejkolwiek szkoły z medalem spoza Warszawy - nie da się " +
      "zweryfikować różnorodności geograficznej. To samo w sobie jest sygnałem potwierdzającym " +
      "ryzyko z raportu gap analysis (punkt F.28): dane referencyjne mogą być zdominowane przez " +
      "Warszawę tak samo jak próbkowanie coroczne.",
  );

  const sampleSize = Math.min(5, nonWarsawSchools.length);
  const sample = nonWarsawSchools
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  const citiesChecked: string[] = [];
  const anomalies: string[] = [];

  for (const school of sample) {
    const medal = school.informationAboutMedalCategory?.medalCategoryName as
      SchoolMedal | undefined;
    const subjectNames = school.informationAboutMedalCategory?.subjectNames ?? [];
    const city = ((school as { city?: string }).city ?? "?").trim();
    citiesChecked.push(city);

    console.log(
      `SZK-MED-DOD-01: szkoła ${school.id} (${city}) - medal "${medal}", ` +
        `${subjectNames.length} przedmiot(ów): ${JSON.stringify(subjectNames)}.`,
    );

    expect(
      medal,
      `Szkoła ${school.id} (${city}) powinna mieć jedną z rozpoznanych wartości medalu`,
    ).toBeTruthy();
    const medalMatches =
      (medal === "Brak" && subjectNames.length === 0) ||
      (medal === "Brąz" && subjectNames.length === 1) ||
      (medal === "Srebro" && subjectNames.length === 2) ||
      (medal === "Złoto" && subjectNames.length >= 3);
    if (!medalMatches) anomalies.push(`${school.id}: ${medal}/${subjectNames.length}`);
    expectUniqueMedalSubjects(subjectNames);
  }

  console.log(`SZK-MED-DOD-01: sprawdzone miasta spoza Warszawy: ${citiesChecked.join(", ")}.`);
  if (anomalies.length > 0) {
    testInfo.annotations.push({
      type: "data-quality",
      description: `Niespójne dane medalowe: ${anomalies.join(", ")}`,
    });
    console.warn(`SZK-MED-DOD-01: wykryte niespójności danych: ${anomalies.join(", ")}.`);
  }
});
