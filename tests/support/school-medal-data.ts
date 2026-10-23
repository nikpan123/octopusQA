import { OCTOPUS_ENV } from "./environment";

import type { SchoolMedal, MedalSchool } from "./school-medal";

export type MedalReferenceSchool = MedalSchool & {
  expectedMedal: SchoolMedal;
  expectedSubjects: string[];
  expectedHistoryValue?: string;
  expectedHistoryDate?: string;
};

type MedalEnvironmentData = {
  gold: Omit<MedalReferenceSchool, "id">;
  silver: Omit<MedalReferenceSchool, "id">;
  bronze: Omit<MedalReferenceSchool, "id">;
  noMedal: Omit<MedalReferenceSchool, "id">;
};

const data: Record<"dev" | "test", MedalEnvironmentData> = {
  dev: {
    gold: {
      name: "Szkoła Podstawowa nr 5",
      city: "Lębork",
      expectedMedal: "Złoto",
      expectedSubjects: ["Fizyka", "Przyroda", "Edukacja wczesnoszkolna", "Historia", "Matematyka"],

      expectedHistoryValue: "2025/2026 Złoto",
      expectedHistoryDate: "2026-10-01 00:00",
    },

    silver: {
      name: "Szkoła Podstawowa nr 379",
      city: "Warszawa",
      expectedMedal: "Srebro",
      expectedSubjects: ["Język polski", "Geografia"],
    },

    bronze: {
      name: "Szkoła Podstawowa w Raszkowie",
      city: "Pogrzybów",
      expectedMedal: "Brąz",
      expectedSubjects: ["Geografia"],
    },

    noMedal: {
      name: "Szkoła Podstawowa nr 403",
      city: "Warszawa",
      expectedMedal: "Brak",
      expectedSubjects: [],
    },
  },

  test: {
    gold: {
      name: "Szkoła Podstawowa nr 5",
      city: "Lębork",
      expectedMedal: "Złoto",
      expectedSubjects: ["Matematyka", "Język polski", "Historia"],

      expectedHistoryValue: "2024/2025 Złoto",
      expectedHistoryDate: "2025-10-01 00:00",
    },

    silver: {
      name: "Szkoła Podstawowa z Oddziałami Dwujęzycznymi nr 20 Fundacji Szkolnej",
      city: "Warszawa",
      expectedMedal: "Srebro",
      expectedSubjects: ["Matematyka", "Język polski"],
    },

    bronze: {
      name: "Szkoła Podstawowa w Raszkowie",
      city: "Pogrzybów",
      expectedMedal: "Brąz",
      expectedSubjects: ["Matematyka"],
    },

    noMedal: {
      name: "Szkoła Podstawowa nr 403",
      city: "Warszawa",
      expectedMedal: "Brak",
      expectedSubjects: [],
    },
  },
};

export const MEDAL_DATA = data[OCTOPUS_ENV];
