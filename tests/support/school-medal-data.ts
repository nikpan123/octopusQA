import { OCTOPUS_ENV } from "./environment";

import type { SchoolMedal, MedalSchool } from "./school-medal";

export type MedalReferenceSchool = MedalSchool & {
  expectedMedal: SchoolMedal;
  expectedSubjects: string[];
};

type MedalEnvironmentData = {
  gold: MedalReferenceSchool;
  silver: MedalReferenceSchool;
  bronze: MedalReferenceSchool;
  noMedal: MedalReferenceSchool;
};

const data: Record<"dev" | "test", MedalEnvironmentData> = {
  dev: {
    gold: {
      id: "57616",
      name: "Szkoła Podstawowa nr 5",
      city: "Lębork",
      expectedMedal: "Złoto",
      expectedSubjects: [
        "Matematyka",
        "Język polski",
        "Historia",
        "Fizyka",
        "Edukacja wczesnoszkolna",
      ],
    },

    silver: {
      id: "85263",
      name: "Szkoła Podstawowa nr 379",
      city: "Warszawa",
      expectedMedal: "Srebro",
      expectedSubjects: ["Matematyka", "Geografia"],
    },

    bronze: {
      id: "66109",
      name: "Szkoła Podstawowa w Raszkowie",
      city: "Raszków",
      expectedMedal: "Brąz",
      expectedSubjects: ["Matematyka"],
    },

    noMedal: {
      id: "92928",
      name: "Szkoła Podstawowa nr 403",
      city: "Warszawa",
      expectedMedal: "Brak",
      expectedSubjects: [],
    },
  },

  test: {
    gold: {
      id: "57616",
      name: "Szkoła Podstawowa nr 5",
      city: "Lębork",
      expectedMedal: "Złoto",
      expectedSubjects: ["Matematyka", "Język polski", "Historia"],
    },

    silver: {
      id: "52005",
      name: "Szkoła Podstawowa z Oddziałami Dwujęzycznymi nr 20 Fundacji Szkolnej",
      city: "Warszawa",
      expectedMedal: "Srebro",
      expectedSubjects: ["Matematyka", "Język polski"],
    },

    bronze: {
      id: "66109",
      name: "Szkoła Podstawowa w Raszkowie",
      city: "Raszków",
      expectedMedal: "Brąz",
      expectedSubjects: ["Matematyka"],
    },

    noMedal: {
      id: "92928",
      name: "Szkoła Podstawowa nr 403",
      city: "Warszawa",
      expectedMedal: "Brak",
      expectedSubjects: [],
    },
  },
};

export const MEDAL_DATA = data[OCTOPUS_ENV];

export const GOLD_SCHOOL = MEDAL_DATA.gold;

export const SILVER_SCHOOL = MEDAL_DATA.silver;

export const BRONZE_SCHOOL = MEDAL_DATA.bronze;

export const NO_MEDAL_SCHOOL = MEDAL_DATA.noMedal;
