export const ORDER_PRODUCTS = {
  physics7: {
    subject: "Fizyka",
    subjectCode: "FIZ",
    level: "Szkoła Podstawowa",
    levelCode: "SP",
    class: "7",
    search: "f7p",
    products: [
      {
        code: "F7P-1",
        title: "FIZYKA 7. To nasz świat. Podręcznik",
      },
      {
        code: "F7P",
        title: "Fizyka 7. Podręcznik",
      },
    ],
  },
  polish5: {
    subject: "Język polski",
    subjectCode: "JPL",
    level: "Szkoła Podstawowa",
    levelCode: "SP",
    class: "5",
    search: "p5pv",
    products: [
      {
        code: "P5Pv",
        title: "Język polski 5. Między nami. Podręcznik",
      },
      {
        code: "P5PvN",
        title: "***Między nami 5. Podręcznik w wersji nauczycielskiej",
      },
    ],
  },
} as const;

export const ORDER_SUBJECT_OPTIONS = [
  "Język polski",
  "Matematyka",
  "Historia",
  "Fizyka",
  "Biologia",
  "Edukacja wczesnoszkolna",
  "Przyroda",
  "Inny",
  "Geografia",
  "Język Angielski",
] as const;

export const ORDER_LEVEL_OPTIONS = [
  "Przedszkole",
  "Szkoła Podstawowa",
  "Szkoła Średnia",
  "Inny",
  "Zespół Szkół",
] as const;

export const ORDER_CLASS_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8"] as const;
